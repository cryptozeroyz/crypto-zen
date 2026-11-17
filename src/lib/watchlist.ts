/**
 * watchlist.ts —— 投研成绩单数据层（v2）
 *
 * 从「关注列表」升级为「判断记录」：
 * - 身份：chain + address（兼容旧 ca 字段）
 * - status: watching 观望中 | holding 持仓中 | exited 已收官（取消关注≠删除）
 * - why: Why I Followed 标签 id 数组（多选，标签体系在 content/why-tags.json）
 * - events: 投研时间线，只追加不删除：
 *     follow 建立关注 / open_position 开启持仓 / add 加仓 / reduce 减仓 /
 *     close_position 清仓 / unfollow 取消关注
 *   行为事件只记 行为+理由+当时价格（价格自动抓取，可缺失），不记数量；
 *   仓位数量与成本仍由 holdAmount/avgCost 手动维护（可选）。
 * - 交易对：优先取存储的 pairAddress，否则按 流动性→24H量 规则自动择优（不再 pairs[0]）。
 */

import fs from "fs";
import path from "path";

export type WatchStatus = "watching" | "holding" | "exited";
export type EventType =
  | "follow"
  | "open_position"
  | "add"
  | "reduce"
  | "close_position"
  | "unfollow";

export interface WatchEvent {
  type: EventType;
  date: string; // YYYY-MM-DD
  price?: number; // 当时价格（自动抓取，可能缺失）
  note: string; // 理由（必填）
  why?: string[]; // 仅 follow 事件携带
}

export interface WatchCoin {
  chain: string;
  address: string;
  symbol?: string;
  name?: string;
  dex?: string;
  pairAddress?: string;
  pairLiquidity?: number;
  pairVolume24h?: number;
  status: WatchStatus;
  why: string[];
  comment: string; // 关注论点（= follow 事件 note）
  addedAt: string;
  followPrice?: number;
  followMcap?: number;
  holdAmount?: number;
  avgCost?: number;
  events: WatchEvent[];
}

export interface WhyTag {
  id: string;
  zh: string;
  en: string;
}

export interface CoinMarketData {
  name: string;
  symbol: string;
  imageUrl?: string;
  priceUsd: number;
  change24h: number;
  fdv?: number;
  marketCap?: number;
  chainId: string;
  dexId: string;
  pairAddress: string;
  liquidity?: number;
  volume24h?: number;
  url: string;
}

export type WatchCoinWithData = WatchCoin & { data: CoinMarketData | null };

const WATCHLIST_FILE = path.join(process.cwd(), "content", "watchlist.json");
const WHY_TAGS_FILE = path.join(process.cwd(), "content", "why-tags.json");

/** 内置默认标签（why-tags.json 缺失时的兜底，也是初始种子） */
export const DEFAULT_WHY_TAGS: WhyTag[] = [
  { id: "og_meme", zh: "OG Meme 文化", en: "OG Meme Culture" },
  { id: "kol", zh: "KOL 传播", en: "KOL Driven" },
  { id: "community", zh: "社区增长", en: "Community Growth" },
  { id: "event", zh: "重大事件驱动", en: "Event Driven" },
  { id: "smart_money", zh: "聪明钱持续买入", en: "Smart Money" },
  { id: "thesis", zh: "个人叙事判断", en: "My Thesis" },
];

export function getWhyTags(): WhyTag[] {
  try {
    if (fs.existsSync(WHY_TAGS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(WHY_TAGS_FILE, "utf8"));
      if (Array.isArray(raw) && raw.length > 0) return raw;
    }
  } catch {
    /* 兜底 */
  }
  return DEFAULT_WHY_TAGS;
}

/** 读取关注列表（兼容 v1：ca/单 whyNote/无 events/无 status 的旧数据自动补全） */
export function getWatchlist(): WatchCoin[] {
  if (!fs.existsSync(WATCHLIST_FILE)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(WATCHLIST_FILE, "utf8"));
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((c) => c && typeof (c.address ?? c.ca) === "string")
      .map((c) => {
        const address = String(c.address ?? c.ca);
        const comment = String(c.comment ?? "");
        const addedAt = String(c.addedAt ?? "");
        /* 旧数据无 events → 用现有字段合成一条 follow 事件 */
        let events: WatchEvent[] = Array.isArray(c.events)
          ? c.events.filter((e: { type?: unknown }) => e && typeof e.type === "string")
          : [];
        if (events.length === 0) {
          events = [
            {
              type: "follow",
              date: addedAt,
              price: typeof c.followPrice === "number" ? c.followPrice : undefined,
              note: comment,
              why: Array.isArray(c.why) ? c.why : [],
            },
          ];
        }
        const status: WatchStatus =
          c.status === "holding" || c.status === "exited"
            ? c.status
            : c.holding === true
              ? "holding"
              : "watching";
        return {
          chain: String(c.chain ?? ""),
          address,
          symbol: typeof c.symbol === "string" ? c.symbol : undefined,
          name: typeof c.name === "string" ? c.name : undefined,
          dex: typeof c.dex === "string" ? c.dex : undefined,
          pairAddress:
            typeof c.pairAddress === "string" ? c.pairAddress : undefined,
          pairLiquidity:
            typeof c.pairLiquidity === "number" ? c.pairLiquidity : undefined,
          pairVolume24h:
            typeof c.pairVolume24h === "number" ? c.pairVolume24h : undefined,
          status,
          why: Array.isArray(c.why) ? c.why.map(String) : [],
          comment,
          addedAt,
          followPrice:
            typeof c.followPrice === "number" ? c.followPrice : undefined,
          followMcap:
            typeof c.followMcap === "number" ? c.followMcap : undefined,
          holdAmount:
            typeof c.holdAmount === "number" ? c.holdAmount : undefined,
          avgCost: typeof c.avgCost === "number" ? c.avgCost : undefined,
          events,
        };
      });
  } catch {
    return [];
  }
}

/* ---------------- DexScreener ---------------- */

interface DexPair {
  chainId: string;
  dexId: string;
  url?: string;
  pairAddress?: string;
  fdv?: number;
  marketCap?: number;
  priceUsd?: string;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  baseToken?: { name?: string; symbol?: string; address?: string };
  info?: { imageUrl?: string };
}

/** 选池第一步：只保留「查询代币作为 baseToken」的交易对，
 *  排除它作为 quote 币出现在别人池子里的干扰对（如 Milk Money/MM 池） */
function ownPairs(pairs: DexPair[], ca: string): DexPair[] {
  const own = pairs.filter(
    (p) => p.baseToken?.address?.toLowerCase() === ca.toLowerCase()
  );
  return own.length > 0 ? own : pairs;
}

/** 选池：流动性优先，24H 成交量次之 */
function pickBestPair(pairs: DexPair[]): DexPair | null {
  return (
    [...pairs].sort((a, b) => {
      const la = a.liquidity?.usd ?? 0;
      const lb = b.liquidity?.usd ?? 0;
      if (lb !== la) return lb - la;
      return (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0);
    })[0] ?? null
  );
}

function pairToMarketData(pair: DexPair, fb: Partial<WatchCoin>): CoinMarketData {
  return {
    name: pair.baseToken?.name ?? fb.name ?? "Unknown",
    symbol: pair.baseToken?.symbol ?? fb.symbol ?? "?",
    imageUrl: pair.info?.imageUrl,
    priceUsd: Number(pair.priceUsd ?? 0),
    change24h: Number(pair.priceChange?.h24 ?? 0),
    fdv: pair.fdv,
    marketCap: pair.marketCap ?? pair.fdv,
    chainId: pair.chainId,
    dexId: pair.dexId,
    pairAddress: pair.pairAddress ?? "",
    liquidity: pair.liquidity?.usd,
    volume24h: pair.volume?.h24,
    url: pair.url ?? `https://dexscreener.com/${pair.chainId}/${pair.dexId}`,
  };
}

/** 按 CA 抓行情；尊重存储的 pairAddress，否则自动择优 */
export async function fetchCoinData(
  ca: string,
  stored?: Pick<WatchCoin, "pairAddress">
): Promise<CoinMarketData | null> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(ca)}`,
      { signal: AbortSignal.timeout(10000), cache: "no-store" }
    );
    if (!res.ok) return null;
    const pairs = ((await res.json()) as { pairs?: DexPair[] }).pairs ?? [];
    if (pairs.length === 0) return null;
    const candidates = ownPairs(pairs, ca);
    let pair: DexPair | null = null;
    if (stored?.pairAddress) {
      pair =
        pairs.find(
          (p) => p.pairAddress?.toLowerCase() === stored.pairAddress!.toLowerCase()
        ) ?? null;
    }
    if (!pair) pair = pickBestPair(candidates);
    if (!pair?.baseToken) return null;
    return pairToMarketData(pair, stored ?? {});
  } catch {
    return null;
  }
}

/** 同币全部交易对（流动性降序），供后台手动切换 */
export async function fetchTokenPairs(
  ca: string
): Promise<
  Array<Pick<CoinMarketData, "pairAddress" | "dexId" | "chainId" | "liquidity" | "volume24h">>
> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(ca)}`,
      { signal: AbortSignal.timeout(10000), cache: "no-store" }
    );
    if (!res.ok) return [];
    const pairs = ((await res.json()) as { pairs?: DexPair[] }).pairs ?? [];
    return [...ownPairs(pairs, ca)]
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))
      .map((p) => ({
        pairAddress: p.pairAddress ?? "",
        dexId: p.dexId,
        chainId: p.chainId,
        liquidity: p.liquidity?.usd ?? 0,
        volume24h: p.volume?.h24 ?? 0,
      }));
  } catch {
    return [];
  }
}

/** 关注列表 + 行情 + 标签 */
export async function fetchWatchlistWithData(): Promise<{
  coins: WatchCoinWithData[];
  tags: WhyTag[];
}> {
  const coins = getWatchlist();
  const dataList = await Promise.all(coins.map((c) => fetchCoinData(c.address, c)));
  return {
    coins: coins.map((c, i) => ({ ...c, data: dataList[i] })),
    tags: getWhyTags(),
  };
}

// 展示工具函数在 @/lib/coin-format（避免 client 引用牵连 fs）
