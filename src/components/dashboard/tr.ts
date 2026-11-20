/**
 * tr.ts —— Track Record 页面文案与枚举翻译映射
 * 阶段五统一并入 lib/i18n.ts；数据枚举值保持英文，仅显示层翻译。
 */

import type { Locale } from "@/lib/i18n";

const ZH = {
  title: "投研日志",
  subtitle: "每条记录 = 一个判断(Call) + 若干更新(Update) + 一个结果复盘(Outcome)。判断发布后不可改写。",
  // 统计
  statTotal: "判断总数",
  statClosed: "已复盘",
  statOpen: "进行中",
  statExpired: "待复盘",
  statWinRate: "胜率",
  statMedianReturn: "收益中位数",
  statMedianDD: "回撤中位数",
  since: (d: string) => `统计区间：${d} 至今`,
  smallSample: "样本较少（<5 条已复盘），统计数据仅供参考",
  // 筛选
  filterStatus: "状态",
  filterVerdict: "结论",
  filterNarrative: "叙事类型",
  filterChain: "链",
  all: "全部",
  clear: "清除筛选",
  empty: "没有符合筛选条件的记录",
  prev: "← 上一页",
  next: "下一页 →",
  page: (n: number, total: number) => `第 ${n} / ${total} 页`,
  // 行
  calledAt: "判断时间",
  mcapJourney: "市值变化",
  now: "当前",
  atCall: "判断时",
  closedAt: "结束时",
  performance: "判断以来",
  viewDetail: "详情",
  // stance
  "stance.watch": "观望",
  "stance.bullish": "看多",
  "stance.bearish": "看空",
  "stance.avoid": "避雷",
  // status
  "status.open": "进行中",
  "status.closed": "已复盘",
  "status.expired": "待复盘",
  // verdict
  "verdict.correct": "判断正确",
  "verdict.partly": "部分正确",
  "verdict.wrong": "判断错误",
  "verdict.unresolved": "未结论",
  // narrativeType
  "nt.meme-culture": "Meme 文化",
  "nt.event-driven": "事件驱动",
  "nt.ip": "IP",
  "nt.celebrity": "名人",
  "nt.ai": "AI",
  "nt.other": "其他",
  // disclosure badges
  "pos.holding": "持仓中",
  "pos.sold": "已清仓",
  "pos.none": "无持仓",
  "pos.unknown": "持仓未知",
  sponsored: "有合作",
  referral: "含返佣",
  historical: "历史记录，非事前判断",
  // 详情页
  back: "← 返回列表",
  callSnapshot: "判断快照",
  updates: "更新记录",
  outcome: "复盘结论",
  disclosure: "利益披露",
  invalidation: "什么情况算我错",
  successCriteria: "成功标准",
  targetMcap: "目标市值",
  stopMcap: "止损市值",
  proof: "X 同步证明",
  related: "关联研报",
  entryPrice: "成本价",
  sizeTier: (s: string) => ({ small: "小仓位", medium: "中仓位", large: "大仓位" })[s] ?? s,
  lessons: "经验教训",
  mistakeType: "错误类型",
  maxMcap: "判断后最高市值",
  minMcap: "判断后最低市值",
  maxDD: "最大回撤",
  invalidationHit: "证伪条件已触发",
  invalidationNo: "证伪条件未触发",
  noUpdates: "还没有更新记录",
  thesisChanged: "论点修正",
  positionChanged: "仓位变动",
  closedNote: "已结束",
  note: "笔记",
  disclaimer: "仅为个人研究记录，非投资建议",
  dataManual: "价格手填",
  source: "判断依据",
};

export type Tr = typeof ZH;

const EN: Tr = {
  title: "Track Record",
  subtitle: "Each entry = one Call + Updates + an Outcome. Calls are locked once published.",
  statTotal: "Total Calls",
  statClosed: "Closed",
  statOpen: "Open",
  statExpired: "Pending Review",
  statWinRate: "Win Rate",
  statMedianReturn: "Median Return",
  statMedianDD: "Median Drawdown",
  since: (d: string) => `Period: ${d} — present`,
  smallSample: "Small sample (<5 closed calls); stats are indicative only",
  filterStatus: "Status",
  filterVerdict: "Verdict",
  filterNarrative: "Narrative",
  filterChain: "Chain",
  all: "All",
  clear: "Clear filters",
  empty: "No records match the current filters",
  prev: "← Prev",
  next: "Next →",
  page: (n: number, total: number) => `Page ${n} / ${total}`,
  calledAt: "Called At",
  mcapJourney: "Mcap Journey",
  now: "Now",
  atCall: "At Call",
  closedAt: "At Close",
  performance: "Since Call",
  viewDetail: "Detail",
  "stance.watch": "Watch",
  "stance.bullish": "Bullish",
  "stance.bearish": "Bearish",
  "stance.avoid": "Avoid",
  "status.open": "Open",
  "status.closed": "Closed",
  "status.expired": "Pending",
  "verdict.correct": "Correct",
  "verdict.partly": "Partly",
  "verdict.wrong": "Wrong",
  "verdict.unresolved": "Unresolved",
  "nt.meme-culture": "Meme Culture",
  "nt.event-driven": "Event-driven",
  "nt.ip": "IP",
  "nt.celebrity": "Celebrity",
  "nt.ai": "AI",
  "nt.other": "Other",
  "pos.holding": "Holding",
  "pos.sold": "Sold",
  "pos.none": "No Position",
  "pos.unknown": "Position Unknown",
  sponsored: "Sponsored",
  referral: "Referral",
  historical: "Historical — not a pre-call",
  back: "← Back",
  callSnapshot: "Call Snapshot",
  updates: "Updates",
  outcome: "Outcome",
  disclosure: "Disclosure",
  invalidation: "What would prove me wrong",
  successCriteria: "Success Criteria",
  targetMcap: "Target Mcap",
  stopMcap: "Stop Mcap",
  proof: "Proof on X",
  related: "Related Reports",
  entryPrice: "Entry",
  sizeTier: (s: string) => ({ small: "Small", medium: "Medium", large: "Large" })[s] ?? s,
  lessons: "Lessons",
  mistakeType: "Mistake Type",
  maxMcap: "Max mcap after call",
  minMcap: "Min mcap after call",
  maxDD: "Max Drawdown",
  invalidationHit: "Invalidation triggered",
  invalidationNo: "Invalidation not triggered",
  noUpdates: "No updates yet",
  thesisChanged: "Thesis changed",
  positionChanged: "Position change",
  closedNote: "Closed",
  note: "Note",
  disclaimer: "Personal research log only. Not investment advice.",
  dataManual: "Manual price",
  source: "Thesis",
};

export function getTr(locale: Locale): Tr {
  return locale === "en" ? EN : ZH;
}

/** mistakeType 翻译 */
/* 枚举 → 显示标签（带类型收窄） */
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

/** 披露徽章标签集（纯字符串，可安全跨 server→client 传递） */
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

/* 徽章配色：标签不只靠颜色——stance/verdict 均带文字与图标 */
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
