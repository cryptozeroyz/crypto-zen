/**
 * trench.ts —— Trench Index（tehcscreener 公开 API）
 * https://tehcscreener.com/api/v1/trench
 * 今日评分 + 四个成分分位 + 历史序列（2024 年起每日）。
 * 无需密钥。页面侧 ISR 缓存，抓不到时返回 null（组件隐藏）。
 */

export interface TrenchComponent {
  value: number;
  percentile: number;
}

export interface TrenchData {
  day: string;
  score: number;
  band: string;
  components: {
    pad_volume: TrenchComponent;
    tokens_launched: TrenchComponent;
    bot_volume: TrenchComponent;
    bot_fees: TrenchComponent;
  };
  history: Array<{ day: string; score: number }>;
}

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
      components: json.today.components ?? {
        pad_volume: { value: 0, percentile: 0 },
        tokens_launched: { value: 0, percentile: 0 },
        bot_volume: { value: 0, percentile: 0 },
        bot_fees: { value: 0, percentile: 0 },
      },
      history: Array.isArray(json.history) ? json.history : [],
    };
  } catch {
    return null;
  }
}

/** 评分对应的情绪带颜色（分值越高市场越狂热） */
export function scoreColor(score: number): string {
  if (score >= 70) return "#d97706"; // 狂热
  if (score >= 45) return "#176f68"; // 活跃
  return "#7a8590"; // 冷清
}
