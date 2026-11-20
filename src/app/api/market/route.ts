/**
 * api/market/route.ts —— 行情/图片统一代理
 *
 * 为什么需要：CoinGecko 与 DexScreener 的域名在国内访问不稳定，
 * 访客浏览器直连会失败。改成走本站代理：浏览器 → cryptozen.fun（首尔服务器）→ 上游。
 *
 * 一个路由三种用途（为控制 Vercel Hobby 12 函数上限，不拆路由）：
 *   GET /api/market?type=ticker        → CoinGecko 行情（BTC/ETH/SOL），缓存 60s
 *   GET /api/market?type=token&ca=…    → DexScreener 代币数据，缓存 120s
 *   GET /api/market?type=img&url=…     → 任意代币图片代理（含 IPFS/CDN），缓存 7 天
 *
 * 缓存：服务端 fetch 走 Next 数据缓存（revalidate），全体访客共享，
 * 上游只看到服务器 IP 的少量请求，不会被限流。
 */

import { NextResponse } from "next/server";
import { fetchWatchlistWithData } from "@/lib/watchlist";
import { getAllPosts } from "@/lib/posts";
import { getJournal } from "@/lib/journal";
import { fetchGeckoOhlcv, fetchGeckoOhlcvSeries, fetchGeckoSpark } from "@/lib/gecko";

export const revalidate = 60;

/** DexScreener chainId → GeckTerminal network 名（K 线用） */
/** GeckTerminal OHLCV → 收盘价数组（时间正序）。免费无密钥，覆盖新 Meme。 */

/* ---------------- 方程式新闻 MCP 客户端 ----------------
 * api.eqn.news 的 JSON REST 被 Cloudflare 拦，但 /public/mcp 对服务器开放。
 * MCP 是 JSON-RPC over HTTP：initialize → notifications/initialized → tools/call。
 * 每次请求新建会话（无状态、简单可靠）；路由层有 60s 响应缓存兜底。
 */

const EQN_MCP_URL = "https://api.eqn.news/public/mcp";

export interface EqnMcpItem {
  no: number;
  time: string;
  channels: string[];
  source: string;
  zh: string;
  en: string;
  coins: string[];
  url: string;
  source_url?: string;
}

async function eqnListNews(opts: {
  channel: string;
  coin?: string | null;
  query?: string | null;
  limit?: number;
}): Promise<{ items: EqnMcpItem[] }> {
  let sid: string | null = null;
  async function rpc(method: string, params: unknown, id: number) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    };
    if (sid) headers["Mcp-Session-Id"] = sid;
    const res = await fetch(EQN_MCP_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    });
    if (!sid) sid = res.headers.get("mcp-session-id");
    const text = await res.text();
    const line = text.split("\n").find((l) => l.startsWith("data: "));
    return JSON.parse(line ? line.slice(6) : text);
  }
  await rpc(
    "initialize",
    {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "cryptozen", version: "1" },
    },
    1
  );
  try {
    await rpc("notifications/initialized", {}, 2); // 202 无响应体，容错
  } catch {
    /* 忽略 */
  }
  const r = await rpc(
    "tools/call",
    {
      name: "list_news",
      arguments: {
        channel: opts.channel,
        coin: opts.coin ?? null,
        query: opts.query ?? null,
        limit: Math.min(Math.max(opts.limit ?? 30, 1), 50),
      },
    },
    3
  );
  const txt = r?.result?.content?.[0]?.text;
  if (!txt) return { items: [] };
  try {
    return JSON.parse(txt) as { items: EqnMcpItem[] };
  } catch {
    return { items: [] };
  }
}

/** 15 个频道 key 白名单（与 MCP schema 的 enum 一致） */
const EQN_CHANNELS = new Set([
  "all",
  "main",
  "tradfi",
  "binance",
  "korea",
  "pricechange",
  "oi",
  "major",
  "tier2",
  "tier3",
  "alpha",
  "cz",
  "earn",
  "hl",
  "tfmoves",
]);

const TICKER_IDS = "bitcoin,ethereum,solana";

const TICKER_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" +
  TICKER_IDS +
  "&price_change_percentage=24h";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  /* ---------- 行情代理 ---------- */
  if (type === "ticker") {
    try {
      const res = await fetch(TICKER_URL, { next: { revalidate: 60 } });
      if (!res.ok) return NextResponse.json([], { status: 502 });
      const json = await res.json();
      return NextResponse.json(json, {
        headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
      });
    } catch {
      return NextResponse.json([], { status: 502 });
    }
  }

  /* ---------- DexScreener 代币数据代理 ---------- */
  if (type === "token") {
    const ca = searchParams.get("ca");
    if (!ca || !/^[0-9a-zA-Z]{20,80}$/.test(ca))
      return NextResponse.json({ error: "bad ca" }, { status: 400 });
    try {
      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${ca}`,
        { next: { revalidate: 120 } }
      );
      if (!res.ok) return NextResponse.json(null, { status: 502 });
      const json = await res.json();
      return NextResponse.json(json, {
        headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=60" },
      });
    } catch {
      return NextResponse.json(null, { status: 502 });
    }
  }

  /* ---------- 看板聚合数据：关注列表 + 行情 + 7D 走势 + Why 标签 + 关联研报 ---------- */
  if (type === "watchlist") {
    try {
      const localeParam = searchParams.get("locale");
      const locale = localeParam === "en" ? "en" : "zh";
      const { coins, tags } = await fetchWatchlistWithData();
      const journal = getJournal();
      const posts = getAllPosts(locale).map((p) => ({
        slug: p.slug,
        title: p.title,
        date: p.date,
        tokens: p.tokens ?? [],
      }));
      const enriched = await Promise.all(
        coins.map(async (c) => {
          let spark: number[] | null = null;
          if (c.data?.pairAddress) {
            spark = await fetchGeckoSpark(c.data.chainId, c.data.pairAddress).catch(
              () => null
            );
          }
          /* 关联研报：frontmatter tokens 含该币 symbol（不区分大小写）或 CA */
          const related = posts
            .filter((p) =>
              p.tokens.some((tk) => {
                const s = tk.trim().toLowerCase();
                return (
                  s.length > 0 &&
                  (s === (c.symbol ?? "").toLowerCase() ||
                    s === c.address.toLowerCase())
                );
              })
            )
            .map((p) => ({ slug: p.slug, title: p.title, date: p.date }));
          const relatedJournal = journal
            .filter((j) =>
              j.tokens.some((tk) => {
                const s = tk.trim().toLowerCase();
                return (
                  s.length > 0 &&
                  (s === (c.symbol ?? "").toLowerCase() ||
                    s === c.address.toLowerCase())
                );
              })
            )
            .map((j) => ({
              id: j.id,
              date: j.date,
              title: j.title,
              body: j.body,
              tags: j.tags,
            }));
          return { ...c, spark, posts: related, journal: relatedJournal };
        })
      );
      return NextResponse.json(
        { updatedAt: Date.now(), coins: enriched, tags },
        { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=60" } }
      );
    } catch {
      return NextResponse.json({ coins: [], tags: [] }, { status: 502 });
    }
  }

  /* ---------- 成绩单统计：叙事胜率 / 分链准确度 / 7D·30D 持有期表现 ---------- */
  if (type === "grade") {
    try {
      const { coins } = await fetchWatchlistWithData();
      const withSince = coins
        .map((c) => {
          let cur = c.data?.priceUsd;
          const last = c.events[c.events.length - 1];
          if (last && (last.type === "close_position" || last.type === "unfollow") && typeof last.price === "number") {
            cur = last.price;
          }
          return {
            c,
            since: cur && c.followPrice ? (cur / c.followPrice - 1) * 100 : null,
          };
        })
        .filter((x): x is { c: (typeof coins)[number]; since: number } => x.since !== null);

      /* 叙事胜率：按 why 标签分组（一个币的多个标签各计一次） */
      const tagMap = new Map<string, number[]>();
      for (const { c, since } of withSince) {
        for (const w of c.why ?? []) {
          if (!tagMap.has(w)) tagMap.set(w, []);
          tagMap.get(w)!.push(since);
        }
      }
      const narratives = [...tagMap.entries()].map(([id, arr]) => ({
        id,
        count: arr.length,
        avg: arr.reduce((a, b) => a + b, 0) / arr.length,
        winRate: (arr.filter((v) => v > 0).length / arr.length) * 100,
      }));

      /* 分链准确度 */
      const chainMap = new Map<string, number[]>();
      for (const { c, since } of withSince) {
        const ch = c.chain || c.data?.chainId || "unknown";
        if (!chainMap.has(ch)) chainMap.set(ch, []);
        chainMap.get(ch)!.push(since);
      }
      const chains = [...chainMap.entries()].map(([id, arr]) => ({
        id,
        count: arr.length,
        avg: arr.reduce((a, b) => a + b, 0) / arr.length,
        winRate: (arr.filter((v) => v > 0).length / arr.length) * 100,
      }));

      /* 持有期表现：从日线 OHLCV 查关注日 +7/+30 的价格 */
      const windows = { d7: [] as number[], d30: [] as number[] };
      await Promise.all(
        withSince.map(async ({ c, since }) => {
          const pair = c.data?.pairAddress;
          const chain = c.data?.chainId;
          if (!pair || !chain || !c.addedAt) return;
          const list = await fetchGeckoOhlcv(chain, pair, "ALL").catch(() => []);
          if (list.length < 2) {
            windows.d7.push(since);
            return;
          }
          /* closes 为最近 90 天日线（时间正序）；关注日+N 的收盘索引： */
          const closes = list;
          const startTs = new Date(c.addedAt).getTime();
          const step = 86_400_000; // day 聚合 ≈ 每日一根
          for (const [key, days] of [["d7", 7], ["d30", 30]] as const) {
            const i = closes.length - 1 - Math.floor((Date.now() - (startTs + days * step)) / step);
            if (i >= 0 && i < closes.length && closes[i] > 0 && c.followPrice) {
              windows[key].push((closes[i] / c.followPrice - 1) * 100);
            }
          }
        })
      );
      const win = (arr: number[]) =>
        arr.length
          ? {
              avg: arr.reduce((a, b) => a + b, 0) / arr.length,
              winRate: (arr.filter((v) => v > 0).length / arr.length) * 100,
              count: arr.length,
            }
          : null;

      return NextResponse.json(
        {
          total: withSince.length,
          winRate:
            withSince.length > 0
              ? (withSince.filter((x) => x.since > 0).length / withSince.length) * 100
              : null,
          avgSince:
            withSince.length > 0
              ? withSince.reduce((a, x) => a + x.since, 0) / withSince.length
              : null,
          narratives,
          chains,
          d7: win(windows.d7),
          d30: win(windows.d30),
        },
        { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=300" } }
      );
    } catch {
      return NextResponse.json({ narratives: [], chains: [] }, { status: 502 });
    }
  }

  /* ---------- K 线历史（GeckTerminal OHLCV， DexScreener 无此接口） ---------- */
  if (type === "ohlcv") {
    const chain = searchParams.get("chain") ?? "";
    const pair = searchParams.get("pair") ?? "";
    const range = searchParams.get("range") ?? "7D";
    if (!/^[a-z0-9]{2,20}$/.test(chain) || !/^[0-9a-zA-Z]{20,80}$/.test(pair))
      return NextResponse.json({ error: "bad params" }, { status: 400 });
    try {
      /* withTs=1 时返回带时间戳序列（详情页图表标点）；默认保持 closes 兼容旧客户端 */
      if (searchParams.get("withTs") === "1") {
        const series = await fetchGeckoOhlcvSeries(chain, pair, range);
        return NextResponse.json(
          { series },
          { headers: { "Cache-Control": "s-maxage=1800, stale-while-revalidate=900" } }
        );
      }
      const closes = await fetchGeckoOhlcv(chain, pair, range);
      return NextResponse.json(
        { closes },
        { headers: { "Cache-Control": "s-maxage=1800, stale-while-revalidate=900" } }
      );
    } catch {
      return NextResponse.json({ closes: [] }, { status: 502 });
    }
  }

  /* ---------- Track Record 批量现价（最多 30 个 CA 一次 DexScreener 请求） ---------- */
  if (type === "prices") {
    const cas = (searchParams.get("cas") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^[0-9a-zA-Z]{20,80}$/.test(s))
      .slice(0, 30);
    if (cas.length === 0)
      return NextResponse.json({ prices: {} }, { status: 400 });
    try {
      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${cas.join(",")}`,
        { next: { revalidate: 120 } }
      );
      if (!res.ok) return NextResponse.json({ prices: {} }, { status: 502 });
      const json = await res.json();
      const prices: Record<
        string,
        { priceUsd: number; mcap: number; change24h: number }
      > = {};
      for (const ca of cas) {
        const pairs = (json?.pairs ?? []).filter(
          (p: { baseToken?: { address?: string } }) =>
            (p?.baseToken?.address ?? "").toLowerCase() === ca.toLowerCase()
        );
        const best =
          pairs.find((p: { chainId?: string }) => p.chainId === "solana") ?? pairs[0];
        if (best?.priceUsd) {
          prices[ca] = {
            priceUsd: Number(best.priceUsd),
            mcap: Number(best.marketCap ?? best.fdv ?? 0),
            change24h: Number(best.priceChange?.h24 ?? 0),
          };
        }
      }
      return NextResponse.json(
        { prices },
        { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=60" } }
      );
    } catch {
      return NextResponse.json({ prices: {} }, { status: 502 });
    }
  }

  /* ---------- 图片代理（支持 IPFS http 网关等） ---------- */
  if (type === "img") {
    const url = searchParams.get("url");
    if (!url || !/^https:\/\//.test(url))
      return NextResponse.json({ error: "bad url" }, { status: 400 });
    // 仅放行已知的图片域名，防止被当成任意代理滥用
    const ALLOWED = [
      "cdn.dexscreener.com",
      "dd.dexscreener.com",
      "api.dexscreener.com",
      "ipfs.io",
      "gateway.pinata.cloud",
      "cloudflare-ipfs.com",
      "assets.coingecko.com",
      "coin-images.coingecko.com",
      "static.coingecko.com",
      "pbs.twimg.com",
      "imagedelivery.net",
    ];
    let host: string;
    try {
      host = new URL(url).hostname;
    } catch {
      return NextResponse.json({ error: "bad url" }, { status: 400 });
    }
    if (!ALLOWED.some((d) => host === d || host.endsWith(`.${d}`)))
      return NextResponse.json({ error: "host not allowed" }, { status: 403 });
    try {
      const res = await fetch(url, { next: { revalidate: 604800 } });
      if (!res.ok || !res.body)
        return NextResponse.json({ error: "upstream" }, { status: 502 });
      const ct = res.headers.get("content-type") ?? "image/png";
      return new NextResponse(res.body, {
        headers: {
          "Content-Type": ct.startsWith("image/") ? ct : "image/png",
          "Cache-Control": "public, s-maxage=604800, max-age=86400",
        },
      });
    } catch {
      return NextResponse.json({ error: "fetch failed" }, { status: 502 });
    }
  }

  /* ---------- 方程式新闻（MCP 代理，15 频道 + 关键词/币种搜索） ---------- */
  if (type === "eqn") {
    const channel = searchParams.get("channel") ?? "all";
    if (!EQN_CHANNELS.has(channel))
      return NextResponse.json({ error: "bad channel" }, { status: 400 });
    const coinRaw = searchParams.get("coin");
    const coin = coinRaw && /^[A-Za-z0-9]{2,12}$/.test(coinRaw) ? coinRaw.toUpperCase() : null;
    const qRaw = searchParams.get("q");
    const query = qRaw && qRaw.trim().length >= 1 ? qRaw.trim().slice(0, 40) : null;
    const limit = Number(searchParams.get("limit") ?? 30);
    try {
      const data = await eqnListNews({ channel, coin, query, limit });
      return NextResponse.json(data, {
        headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
      });
    } catch {
      return NextResponse.json({ items: [] }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "unknown type" }, { status: 400 });
}
