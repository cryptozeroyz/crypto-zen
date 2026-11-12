/**
 * watchlist.ts —— 关注列表数据层
 *
 * - 配置存于 content/watchlist.json（CA + 一句话评价），后台可维护
 * - 行情与头像通过 DexScreener 公开 API 按 CA 抓取（无需密钥）：
 *     https://api.dexscreener.com/latest/dex/tokens/{ca}
 * - 页面使用 ISR（revalidate = 300）每 5 分钟刷新一次数据；
 *   本地网络抓不到时会优雅降级为占位展示，不影响页面构建
 */

import fs from "fs";
import path from "path";

export interface WatchCoin {
  ca: string;
  comment: string;
  addedAt: string;
}

export interface CoinMarketData {
  name: string;
  symbol: string;
  imageUrl?: string;
  priceUsd: number;
  change24h: number;
  fdv?: number;
  chainId: string;
  dexId: string;
  url: string;
}

export type WatchCoinWithData = WatchCoin & { data: CoinMarketData | null };

const WATCHLIST_FILE = path.join(process.cwd(), "content", "watchlist.json");

/** 读取关注列表配置（构建期/服务端） */
export function getWatchlist(): WatchCoin[] {
  if (!fs.existsSync(WATCHLIST_FILE)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(WATCHLIST_FILE, "utf8"));
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((c) => c && typeof c.ca === "string")
      .map((c) => ({
        ca: c.ca,
        comment: String(c.comment ?? ""),
        addedAt: String(c.addedAt ?? ""),
      }));
  } catch {
    return [];
  }
}

interface DexPair {
  chainId: string;
  dexId: string;
  url?: string;
  fdv?: number;
  priceUsd?: string;
  priceChange?: { h24?: number };
  baseToken?: { name?: string; symbol?: string };
  info?: { imageUrl?: string };
}

/** 按 CA 抓取行情（DexScreener），失败返回 null */
export async function fetchCoinData(ca: string): Promise<CoinMarketData | null> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(ca)}`,
      { signal: AbortSignal.timeout(10000), cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { pairs?: DexPair[] };
    const pair = json.pairs?.[0];
    if (!pair?.baseToken) return null;
    return {
      name: pair.baseToken.name ?? "Unknown",
      symbol: pair.baseToken.symbol ?? "?",
      imageUrl: pair.info?.imageUrl,
      priceUsd: Number(pair.priceUsd ?? 0),
      change24h: Number(pair.priceChange?.h24 ?? 0),
      fdv: pair.fdv,
      chainId: pair.chainId,
      dexId: pair.dexId,
      url:
        pair.url ?? `https://dexscreener.com/${pair.chainId}/${pair.dexId}`,
    };
  } catch {
    return null;
  }
}

/** 关注列表 + 行情（Promise.all 并发抓取） */
export async function fetchWatchlistWithData(): Promise<WatchCoinWithData[]> {
  const coins = getWatchlist();
  const dataList = await Promise.all(coins.map((c) => fetchCoinData(c.ca)));
  return coins.map((c, i) => ({ ...c, data: dataList[i] }));
}

// 纯展示工具函数（formatPrice / avatarHue）在 @/lib/coin-format 中，
// 以便 client component 引用时不牵连本文件的 fs 依赖。
