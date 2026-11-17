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

export const revalidate = 60;

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

  return NextResponse.json({ error: "unknown type" }, { status: 400 });
}
