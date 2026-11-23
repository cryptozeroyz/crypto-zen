/**
 * tr.ts —— Track Record 显示层翻译（数据层中立，枚举英文存储）
 * 文案统一收编在 lib/i18n.ts 的 dictionary.trackRecord（zh/en），
 * 本文件仅保留：类型导出、取词函数、徽章配色、枚举→标签映射逻辑。
 */

import { getDictionary, type Dictionary, type Locale } from "@/lib/i18n";

export type Tr = Dictionary["trackRecord"];

export function getTr(locale: Locale): Tr {
  return getDictionary(locale).trackRecord;
}

export interface DisclosureLabels {
  holding: string;
  sold: string;
  none: string;
  unknown: string;
  sponsored: string;
  referral: string;
}

export function disclosureLabelsOf(tr: Tr): DisclosureLabels {
  return {
    holding: tr["pos.holding"],
    sold: tr["pos.sold"],
    none: tr["pos.none"],
    unknown: tr["pos.unknown"],
    sponsored: tr.sponsored,
    referral: tr.referral,
  };
}

/* 枚举 → 显示标签 */
export function stanceLabel(s: string, tr: Tr): string {
  return ({ watch: tr["stance.watch"], bullish: tr["stance.bullish"], bearish: tr["stance.bearish"], avoid: tr["stance.avoid"] } as Record<string, string>)[s] ?? s;
}
export function verdictLabel(v: string, tr: Tr): string {
  return ({ correct: tr["verdict.correct"], partly: tr["verdict.partly"], wrong: tr["verdict.wrong"], unresolved: tr["verdict.unresolved"] } as Record<string, string>)[v] ?? v;
}
export function ntLabel(n: string, tr: Tr): string {
  const m: Record<string, string> = {
    "meme-culture": tr["nt.meme-culture"],
    "event-driven": tr["nt.event-driven"],
    ip: tr["nt.ip"],
    celebrity: tr["nt.celebrity"],
    ai: tr["nt.ai"],
    other: tr["nt.other"],
  };
  return m[n] ?? n;
}
export function posLabel(p: string, tr: Tr): string {
  return ({ holding: tr["pos.holding"], sold: tr["pos.sold"], none: tr["pos.none"], unknown: tr["pos.unknown"] } as Record<string, string>)[p] ?? p;
}

/** calledAt 显示：历史记录只有日期（T00:00 占位）时只显示日期，有真实时间则带 HH:mm */
export function fmtCalledAt(iso: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(iso);
  if (!m) return iso.slice(0, 10);
  return m[2] === "00:00" ? m[1] : `${m[1]} ${m[2]}`;
}

/** mistakeType 翻译（枚举本身不在词典内，属逻辑映射） */
export function mistakeLabel(m: string, locale: Locale): string {
  const map: Record<string, [string, string]> = {
    "narrative-fade": ["叙事消退", "Narrative fade"],
    "late-entry": ["进场太晚", "Late entry"],
    liquidity: ["流动性问题", "Liquidity"],
    rug: ["项目跑路", "Rug"],
    timing: ["时机不对", "Timing"],
    sizing: ["仓位不当", "Sizing"],
    other: ["其他", "Other"],
  };
  return map[m]?.[locale === "en" ? 1 : 0] ?? m;
}

/* 徽章配色：标签同时带文字/图标，不只靠颜色 */
export const STANCE_BADGE: Record<string, string> = {
  watch: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30",
  bullish: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  bearish: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30",
  avoid: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
};

export const VERDICT_BADGE: Record<string, string> = {
  correct: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  partly: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  wrong: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
  unresolved: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30",
};
