/**
 * calls-stats.ts —— Track Record 派生指标（纯函数，全部可单测）
 *
 * 派生规则：
 * - status: open（进行中）/ closed（有 Outcome）/ expired（超过 horizon 且无 Outcome，页面显示“待复盘”）；
 * - 统计口径：胜率 = correct ÷ 已结束（unresolved 不计入分母）；
 * - 涨跌幅、回撤一律用中位数（不用平均数，避免单只暴涨暴跌扭曲）；
 * - 统计起始日期 = 最早一条 Call 的 calledAt。
 */

import {
  HORIZON_MS,
  type CallRecord,
} from "@/lib/calls";

export type CallStatus = "open" | "closed" | "expired";

/** 最近活跃时间：判断 / 任一 Update / 复盘 的最大时间（排序用） */
export function activityAt(record: CallRecord): string {
  return [
    record.call.calledAt,
    ...record.updates.map((u) => u.at),
    record.outcome?.closedAt ?? "",
  ].sort().pop() as string;
}

/** 单条记录的派生状态 */
export function statusOf(record: CallRecord, now = Date.now()): CallStatus {
  if (record.outcome) return "closed";
  const called = Date.parse(record.call.calledAt);
  if (Number.isNaN(called)) return "open";
  return now - called > HORIZON_MS[record.call.horizon] ? "expired" : "open";
}

/** 中位数（偶数取中间两数平均；空数组返回 null） */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface CallStats {
  /** 判断总数 */
  total: number;
  /** 已结束数（有 Outcome） */
  closed: number;
  /** 进行中 */
  open: number;
  /** 待复盘（expired） */
  expired: number;
  /** 胜率 %：correct ÷ 已结束（unresolved 不计入） */
  winRate: number | null;
  /** 涨跌幅中位数 %（已结束记录） */
  medianReturn: number | null;
  /** 最大回撤中位数 %（已结束记录，正数表示回撤幅度） */
  medianMaxDrawdown: number | null;
  /** mistakeType 占比 %（已结束且填写了 mistakeType） */
  mistakeShare: Record<string, number>;
  /** 统计起始日期（最早 calledAt 的日期部分） */
  since: string | null;
  /** 样本不足阈值提示（<5 条已结束） */
  smallSample: boolean;
}

const SMALL_SAMPLE_THRESHOLD = 5;

export function computeStats(records: CallRecord[], now = Date.now()): CallStats {
  const resolved = records.filter(
    (r) => r.outcome && r.outcome.verdict !== "unresolved"
  );
  const closed = records.filter((r) => r.outcome);
  const open = records.filter((r) => statusOf(r, now) === "open");
  const expired = records.filter((r) => statusOf(r, now) === "expired");

  const correct = resolved.filter((r) => r.outcome!.verdict === "correct");
  const returns = closed
    .map((r) => r.outcome!.returnAtClose)
    .filter((v) => Number.isFinite(v));
  const drawdowns = closed
    .map((r) => r.outcome!.maxDrawdown)
    .filter((v) => Number.isFinite(v));

  const mistakeCounts = new Map<string, number>();
  for (const r of closed) {
    const m = r.outcome!.mistakeType;
    if (m) mistakeCounts.set(m, (mistakeCounts.get(m) ?? 0) + 1);
  }
  const mistakeTotal = [...mistakeCounts.values()].reduce((a, b) => a + b, 0);
  const mistakeShare: Record<string, number> = {};
  for (const [k, v] of mistakeCounts) {
    mistakeShare[k] = Math.round((v / mistakeTotal) * 1000) / 10;
  }

  const times = records
    .map((r) => Date.parse(r.call.calledAt))
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);

  return {
    total: records.length,
    closed: closed.length,
    open: open.length,
    expired: expired.length,
    winRate:
      resolved.length > 0
        ? Math.round((correct.length / resolved.length) * 1000) / 10
        : null,
    medianReturn: median(returns.map((v) => Math.round(v * 100) / 100)),
    medianMaxDrawdown: median(drawdowns),
    mistakeShare,
    since: times.length > 0 ? new Date(times[0]).toISOString().slice(0, 10) : null,
    smallSample: resolved.length < SMALL_SAMPLE_THRESHOLD,
  };
}
