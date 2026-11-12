/**
 * trench.ts —— Trench Index（tehcscreener 公开 API）
 * https://tehcscreener.com/api/v1/trench
 *
 * 口径（来自官方文档）：
 * - 0–100 综合活跃度评分：发射盘（launchpads）+ 交易终端（trading terminals）
 * - 基于近 90 天窗口的分位混合（blended percentile）
 * - band：ded | cold | active | hot | euphoric
 * - components：pad_volume / tokens_launched / pad_revenue / bot_volume / bot_fees
 *   每项 { value（当日原始总量）, percentile（0–100 分位）}
 *
 * 无需密钥。页面侧 ISR 缓存，抓不到时返回 null（组件隐藏）。
 */

export interface TrenchComponent {
  value: number;
  percentile: number;
}

export type TrenchComponentKey =
  | "pad_volume"
  | "tokens_launched"
  | "pad_revenue"
  | "bot_volume"
  | "bot_fees";

export type TrenchBand = "ded" | "cold" | "active" | "hot" | "euphoric";

export interface TrenchData {
  day: string;
  score: number;
  band: TrenchBand | string;
  components: Partial<Record<TrenchComponentKey, TrenchComponent>>;
  history: Array<{ day: string; score: number }>;
}

/** 成分展示顺序 */
export const COMPONENT_ORDER: TrenchComponentKey[] = [
  "pad_volume",
  "tokens_launched",
  "pad_revenue",
  "bot_volume",
  "bot_fees",
];

const EMPTY_COMPONENTS: TrenchData["components"] = {
  pad_volume: { value: 0, percentile: 0 },
  tokens_launched: { value: 0, percentile: 0 },
  pad_revenue: { value: 0, percentile: 0 },
  bot_volume: { value: 0, percentile: 0 },
  bot_fees: { value: 0, percentile: 0 },
};

export async function fetchTrench(): Promise<TrenchData | null> {
  try {
    const res = await fetch("https://tehcscreener.com/api/v1/trench", {
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      today?: {
        day?: string;
        score?: number;
        band?: string;
        components?: TrenchData["components"];
      };
      history?: Array<{ day: string; score: number }>;
    };
    if (!json.today || typeof json.today.score !== "number") return null;
    return {
      day: json.today.day ?? "",
      score: json.today.score,
      band: json.today.band ?? "",
      components: { ...EMPTY_COMPONENTS, ...(json.today.components ?? {}) },
      history: Array.isArray(json.history) ? json.history : [],
    };
  } catch {
    return null;
  }
}

/** 与昨日评分对比（history 最后一项为昨日） */
export function dayDelta(data: TrenchData): number | null {
  const h = data.history;
  if (h.length < 2) return null;
  const yesterday = h[h.length - 2];
  if (!yesterday || typeof yesterday.score !== "number") return null;
  return data.score - yesterday.score;
}

/** 金额紧凑格式：$1.17B / $28.4M / $950K */
export function formatUsdCompact(value: number): string {
  if (!value || value <= 0) return "—";
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

/** 整数千分位 */
export function formatCount(value: number): string {
  if (!value || value <= 0) return "—";
  return Math.round(value).toLocaleString("en-US");
}

/**
 * band → 展示色（克制低饱和，契合品牌色系）：
 * ded 死寂 / cold 冷清 / active 活跃(品牌青) / hot 火热(哑琥珀) / euphoric 狂热(哑红)
 */
const BAND_COLOR: Record<string, string> = {
  ded: "#98a2ad",
  cold: "#7a93a8",
  active: "#176f68",
  hot: "#b45309",
  euphoric: "#b91c1c",
};

export function bandColor(band: string): string {
  return BAND_COLOR[band] ?? "#7a8590";
}
