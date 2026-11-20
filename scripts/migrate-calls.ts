/**
 * migrate-calls.ts —— 阶段三迁移脚本：watchlist.json + journal.json → calls.json
 *
 * 原则：缺失字段不编造。
 * - isHistorical 一律 true（标注「历史记录，非事前判断」）；
 * - invalidation 缺失写「历史记录，未事前设定」；
 * - disclosure.position 无法确认标 unknown（schema 仅限历史记录）；
 * - 复盘 Outcome 只在有真实数据时生成：close 价来自 close_position/unfollow 事件，
 *   max/min 市值用 GeckoTerminal OHLCV 期间价格 × 判断时市值比例推算；抓不到就不生成（待复盘）。
 *
 * 用法：
 *   npx tsx scripts/migrate-calls.ts            # dry-run：只打印差异报告，不写文件
 *   npx tsx scripts/migrate-calls.ts --execute  # 真正写入 content/calls.json
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import { CallSchema, makeCallId, type Call, type CallRecord, type CallUpdate, type Outcome } from "../src/lib/calls";

/* 本机直连 geckoterminal 不稳定：有代理环境变量时让 fetch 走代理 */
const proxy = process.env.HTTPS_PROXY ?? process.env.https_proxy;
if (proxy) {
  try {
    setGlobalDispatcher(new ProxyAgent(proxy));
  } catch (e) {
    console.warn("代理设置失败，按直连继续:", (e as Error).message);
  }
}

const ROOT = path.resolve(__dirname, "..");
const EXECUTE = process.argv.includes("--execute");

/* ---------- 读取源数据 ---------- */

interface SrcEvent { type: string; date: string; note?: string; price?: number; why?: string[] }
interface SrcCoin {
  address?: string; ca?: string; chain?: string; symbol?: string; name?: string;
  status?: string; comment?: string; addedAt?: string; holding?: boolean;
  followPrice?: number; followMcap?: number; avgCost?: number;
  pairAddress?: string; why?: string[];
  profile?: { narrative?: string; risks?: string; catalysts?: string; invalidate?: string };
  events?: SrcEvent[];
}
interface SrcJournal { id: string; date: string; tokens: string[]; tags: string[]; title: string; body: string }

const watchlist: SrcCoin[] = JSON.parse(fs.readFileSync(path.join(ROOT, "content/watchlist.json"), "utf8"));
const journal: SrcJournal[] = JSON.parse(fs.readFileSync(path.join(ROOT, "content/journal.json"), "utf8"));

const postsDir = path.join(ROOT, "content/posts");
const postTokens: Record<string, string[]> = {};
if (fs.existsSync(postsDir)) {
  for (const f of fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"))) {
    const slug = f.replace(/\.md$/, "");
    const { data } = matter(fs.readFileSync(path.join(postsDir, f), "utf8"));
    postTokens[slug] = Array.isArray(data.tokens) ? data.tokens.map(String) : [];
  }
}

/* ---------- 工具 ---------- */

const atMinute = (date: string) => `${date.slice(0, 10)}T00:00`;
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

function narrativeTypeOf(why: string[]): Call["narrativeType"] {
  const w = (why[0] ?? "").toLowerCase();
  if (["event", "news"].includes(w)) return "event-driven";
  if (w === "ai") return "ai";
  if (w === "ip") return "ip";
  if (w === "celebrity" || w === "kol") return "celebrity";
  if (["pfp", "animals", "meme", "culture", "dog", "cat"].includes(w)) return "meme-culture";
  return "other";
}

function matchToken(coin: SrcCoin, tokens: string[]): boolean {
  const sym = (coin.symbol ?? "").toLowerCase();
  const addr = (coin.address ?? coin.ca ?? "").toLowerCase();
  return tokens.some((t) => {
    const s = t.trim().toLowerCase();
    return s.length > 0 && (s === sym || s === addr);
  });
}

function relatedReportsOf(coin: SrcCoin): string[] {
  return Object.entries(postTokens)
    .filter(([, tks]) => matchToken(coin, tks))
    .map(([slug]) => slug);
}

/** GeckoTerminal OHLCV（日线，最多 90 根），返回时间正序收盘价；失败重试一次 */
async function fetchDailyCloses(chain: string, pair: string): Promise<number[]> {
  const net: Record<string, string> = { solana: "solana", ethereum: "eth", bsc: "bsc", base: "base" };
  const n = net[chain.toLowerCase()];
  if (!n) return [];
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(
        `https://api.geckoterminal.com/api/v2/networks/${n}/pools/${pair}/ohlcv/day?aggregate=1&limit=90`,
        { headers: { Accept: "application/json" } }
      );
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) continue;
      const json = await res.json();
      const list = json?.data?.attributes?.ohlcv_list;
      if (!Array.isArray(list)) continue;
      return list.map((c: number[]) => Number(c[4])).reverse();
    } catch {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
  return [];
}

/* ---------- 逐币迁移 ---------- */

interface Report {
  symbol: string; id: string; flags: string[];
  updates: number; outcome: string; // "skip 原因" / verdict
}

async function migrateCoin(
  coin: SrcCoin,
  assignedThisRun: Set<string>,
  preExisting: Set<string>
): Promise<{ record: CallRecord; report: Report }> {
  const flags: string[] = [];
  const addr = coin.address ?? coin.ca ?? "";
  const symbol = coin.symbol ?? "UNKNOWN";
  const date = (coin.addedAt ?? "1970-01-01").slice(0, 10);

  let id = makeCallId(date, symbol.toLowerCase());
  if (assignedThisRun.has(id)) {
    /* 本次运行内冲突（两个币同名同日）→ 加后缀区分 */
    let i = 2;
    while (assignedThisRun.has(`${id}-${i}`)) i++;
    id = `${id}-${i}`;
    flags.push(`本次运行内 id 冲突，改为 ${id}`);
  } else if (preExisting.has(id)) {
    /* 上次运行已生成 → 沿用同 id，由 upsert 覆盖补齐 */
    flags.push("已存在同 id 记录，将覆盖更新");
  }
  assignedThisRun.add(id);

  /* Call */
  if (!coin.followPrice || coin.followPrice <= 0) flags.push("缺 followPrice，priceAtCall 不可用");
  if (!coin.followMcap || coin.followMcap <= 0) flags.push("缺 followMcap，mcapAtCall 不可用");
  const call: Call = CallSchema.parse({
    id,
    chain: coin.chain ?? "unknown",
    tokenName: coin.name ?? symbol,
    symbol,
    contractAddress: addr,
    calledAt: atMinute(coin.addedAt ?? "1970-01-01"),
    stance: "watch",
    priceAtCall: coin.followPrice ?? 0.00000001,
    mcapAtCall: coin.followMcap ?? 1,
    narrative: clean(coin.profile?.narrative ?? coin.comment ?? "").slice(0, 200) || "历史记录",
    thesis: clean(coin.comment ?? "") || "历史记录，未留存判断原文",
    catalysts: coin.profile?.catalysts ? [clean(coin.profile.catalysts).slice(0, 300)] : [],
    risks: coin.profile?.risks ? [clean(coin.profile.risks).slice(0, 300)] : [],
    narrativeType: narrativeTypeOf(coin.why ?? []),
    /* horizon 对历史记录仅用于 expired 判定；已关闭的记录永不显示该值 */
    horizon: "weeks",
    invalidation: clean(coin.profile?.invalidate ?? "") || "历史记录，未事前设定",
    disclosure: {
      position: coin.holding ? "holding" : coin.status === "exited" ? "sold" : "unknown",
      entryPrice: coin.holding && coin.avgCost ? coin.avgCost : undefined,
      sponsored: false,
      referral: false,
    },
    relatedReports: relatedReportsOf(coin),
    tags: coin.why ?? [],
    isHistorical: true,
    priceSource: "auto",
  });
  if (call.disclosure.position === "unknown") flags.push("持仓状态未知 → disclosure.position=unknown");
  if (call.invalidation === "历史记录，未事前设定") flags.push("无 profile.invalidate → 兜底文案");

  /* Updates：时间线事件（跳过首条 follow）+ 关联研究日志 */
  const updates: CallUpdate[] = [];
  for (const ev of (coin.events ?? []).slice(1)) {
    if (!ev.date) continue;
    updates.push({
      callId: id,
      at: atMinute(ev.date),
      type: ev.type === "add" || ev.type === "reduce" ? "position-change" : ev.type === "close_position" || ev.type === "unfollow" ? "closed" : "note",
      content: clean(ev.note ?? "") || `历史事件：${ev.type}`,
      priceAt: typeof ev.price === "number" && ev.price > 0 ? ev.price : undefined,
      positionAction: ev.type === "add" ? "add" : ev.type === "reduce" ? "reduce" : ev.type === "close_position" || ev.type === "unfollow" ? "exit" : undefined,
    });
  }
  const matchedJournal = journal.filter((j) => matchToken(coin, j.tokens));
  for (const j of matchedJournal) {
    updates.push({
      callId: id,
      at: atMinute(j.date),
      type: "note",
      content: clean(j.title ? `「${j.title}」 ${j.body}` : j.body).slice(0, 4000),
    });
  }
  updates.sort((a, b) => a.at.localeCompare(b.at));

  /* Outcome：仅 exited 且有 close 价时尝试生成 */
  let outcome: Outcome | null = null;
  let outcomeReport = "未生成（仍在关注/持仓）";
  const closeEv = (coin.events ?? []).find((e) => e.type === "close_position" || e.type === "unfollow");
  if (coin.status === "exited" && closeEv && typeof closeEv.price === "number" && closeEv.price > 0) {
    const closes = await fetchDailyCloses(call.chain, coin.pairAddress ?? "").catch(() => []);
    if (closes.length >= 2 && coin.followPrice) {
      const ratio = closes.map((c) => c / coin.followPrice!);
      const ret = (closeEv.price! / coin.followPrice - 1) * 100;
      outcome = {
        callId: id,
        closedAt: atMinute(closeEv.date ?? date),
        verdict: ret > 10 ? "correct" : ret < -10 ? "wrong" : "partly",
        priceAtClose: closeEv.price,
        mcapAtClose: Math.round(call.mcapAtCall * (closeEv.price / coin.followPrice)),
        maxMcapAfterCall: Math.round(call.mcapAtCall * Math.max(...ratio)),
        minMcapAfterCall: Math.round(call.mcapAtCall * Math.min(...ratio)),
        returnAtClose: Math.round(ret * 100) / 100,
        maxDrawdown: Math.round((1 - Math.min(...ratio) / Math.max(...ratio)) * 10000) / 100,
        invalidationTriggered: false,
        lessons: "历史迁移记录，未填写复盘。",
        priceSource: "auto",
      };
      outcomeReport = `${outcome.verdict} (${outcome.returnAtClose}%)`;
      flags.push("invalidationTriggered 历史数据无法确认，默认 false");
    } else {
      outcomeReport = "未生成（无法取得 OHLCV，留待复盘）";
      flags.push("OHLCV 抓取失败，无 Outcome");
    }
  } else if (coin.status === "exited") {
    outcomeReport = "未生成（无 close 价格，留待复盘）";
    flags.push("exited 但缺 close 价");
  }

  return {
    record: { call, updates, outcome },
    report: { symbol, id, flags, updates: updates.length, outcome: outcomeReport },
  };
}

/* ---------- 主流程 ---------- */

async function main() {
  const existing: CallRecord[] = fs.existsSync(path.join(ROOT, "content/calls.json"))
    ? JSON.parse(fs.readFileSync(path.join(ROOT, "content/calls.json"), "utf8"))
    : [];
  const preExisting = new Set(existing.map((r) => r.call.id));
  const assignedThisRun = new Set<string>();

  const reports: Report[] = [];
  const records: CallRecord[] = [];
  for (const coin of watchlist) {
    const { record, report } = await migrateCoin(coin, assignedThisRun, preExisting);
    records.push(record);
    reports.push(report);
  }

  /* dry-run 报告 */
  console.log(`\n=== 迁移报告（${EXECUTE ? "已执行" : "dry-run"}）===`);
  console.log(`源：watchlist ${watchlist.length} 币，journal ${journal.length} 条 → 目标 ${records.length} 条 Call\n`);
  for (const r of reports) {
    console.log(`${r.symbol}  ${r.id}`);
    console.log(`  updates: ${r.updates} 条 | outcome: ${r.outcome}`);
    for (const f of r.flags) console.log(`  ⚠ ${f}`);
  }
  const noOutcome = reports.filter((r) => r.outcome.startsWith("未生成")).length;
  console.log(`\n汇总：${records.length} 条 Call，${records.reduce((a, r) => a + r.updates.length, 0)} 条 Update，${records.length - noOutcome} 条 Outcome，${noOutcome} 条留待复盘`);
  console.log(`全部标记 isHistorical=true（页面显示「历史记录，非事前判断」）`);

  if (!EXECUTE) {
    console.log("\n[dry-run] 未写入任何文件。确认无误后加 --execute 执行。");
    return;
  }
  /* 单调合并策略：新生成的记录若 outcome 为 null，沿用已存在的同 id 记录的 outcome
     （网络抖动重跑时不会把已有的复盘数据覆盖丢失） */
  for (const r of records) {
    if (!r.outcome) {
      const old = existing.find((e) => e.call.id === r.call.id);
      if (old?.outcome) r.outcome = old.outcome;
    }
  }
  /* 按 call.id 幂等合并：同 id 覆盖，不同 id 保留 */
  const byId = new Map(existing.map((r) => [r.call.id, r]));
  for (const r of records) byId.set(r.call.id, r);
  const merged = [...byId.values()];
  fs.writeFileSync(path.join(ROOT, "content/calls.json"), JSON.stringify(merged, null, 1));
  console.log(`\n[execute] 已写入 content/calls.json（共 ${merged.length} 条，覆盖同 id ${records.length} 条）`);
}

main().catch((e) => {
  console.error("迁移失败:", e);
  process.exit(1);
});
