/**
 * calls.ts —— Track Record 核心数据模型（Zod schema 为唯一事实来源，类型全部推导）
 *
 * 结构：CallRecord = { call: Call（发布后锁定）, updates: Update[]（只追加）, outcome: Outcome|null }
 *
 * 规则：
 * - invalidation（什么情况算我错）新 Call 必填；
 * - disclosure.position 的 "unknown" 仅允许历史记录（isHistorical=true）使用；
 * - 价格快照可标 source:"manual"（自动抓取失败手填时）；
 * - 判断总数/胜率/中位数等派生指标见 calls-stats.ts，不在此处存储。
 */

import { z } from "zod";

/* ---------- 枚举 ---------- */

export const STANCES = ["watch", "bullish", "bearish", "avoid"] as const;
export const StanceSchema = z.enum(STANCES);

export const NARRATIVE_TYPES = [
  "meme-culture",
  "event-driven",
  "ip",
  "celebrity",
  "ai",
  "other",
] as const;
export const NarrativeTypeSchema = z.enum(NARRATIVE_TYPES);

export const HORIZONS = ["intraday", "days", "weeks", "months"] as const;
export const HorizonSchema = z.enum(HORIZONS);

export const POSITIONS = ["none", "holding", "sold", "unknown"] as const;
export const DisclosurePositionSchema = z.enum(POSITIONS);

export const UPDATE_TYPES = ["note", "thesis-change", "position-change", "closed"] as const;
export const UpdateTypeSchema = z.enum(UPDATE_TYPES);

export const POSITION_ACTIONS = ["add", "reduce", "exit"] as const;

export const VERDICTS = ["correct", "partly", "wrong", "unresolved"] as const;
export const VerdictSchema = z.enum(VERDICTS);

export const MISTAKE_TYPES = [
  "narrative-fade",
  "late-entry",
  "liquidity",
  "rug",
  "timing",
  "sizing",
  "other",
] as const;

/* ---------- 子结构 ---------- */

/** 利益披露（必填）。position:"unknown" 仅限历史记录（见 CallSchema 交叉校验） */
export const DisclosureSchema = z.object({
  position: DisclosurePositionSchema,
  entryPrice: z.number().positive().optional(),
  entryAt: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "entryAt 需为日期").optional(),
  sizeTier: z.enum(["small", "medium", "large"]).optional(),
  sponsored: z.boolean(),
  referral: z.boolean(),
  sourceOfIdea: z.string().max(200).optional(),
});

/** ISO 时间，精确到分钟（秒恒为 00） */
const MinuteIsoSchema = z
  .string()
  .refine((s) => {
    const t = Date.parse(s);
    if (Number.isNaN(t)) return false;
    const sec = Number(s.slice(17, 19));
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) && sec === 0;
  }, "时间需为 ISO 格式且精确到分钟（如 2026-11-20T14:30）");

/** 价格来源：auto=接口自动抓取，manual=抓取失败手填 */
export const PriceSourceSchema = z.enum(["auto", "manual"]);

/* ---------- Call（发布后锁定） ---------- */

export const CallSchema = z
  .object({
    id: z
      .string()
      .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9][a-z0-9-]*$/, "id 形如 2026-11-20-huss"),
    chain: z.string().min(1).max(40),
    tokenName: z.string().min(1).max(80),
    symbol: z.string().min(1).max(20),
    contractAddress: z
      .string()
      .regex(/^[0-9a-zA-Z]{20,80}$/, "合约地址格式不正确"),
    calledAt: MinuteIsoSchema,
    proofUrl: z.string().url().optional(),
    stance: StanceSchema,
    priceAtCall: z.number().positive(),
    mcapAtCall: z.number().positive(),
    liquidityAtCall: z.number().positive().optional(),
    holdersAtCall: z.number().int().positive().optional(),
    narrative: z.string().min(2).max(200),
    thesis: z.string().min(2).max(4000),
    catalysts: z.array(z.string().min(1).max(300)).max(10).default([]),
    risks: z.array(z.string().min(1).max(300)).max(10).default([]),
    narrativeType: NarrativeTypeSchema,
    horizon: HorizonSchema,
    invalidation: z.string().min(2).max(1000),
    successCriteria: z.string().max(1000).optional(),
    targetMcap: z.number().positive().optional(),
    stopMcap: z.number().positive().optional(),
    disclosure: DisclosureSchema,
    relatedReports: z.array(z.string().min(1).max(120)).max(10).default([]),
    tags: z.array(z.string().min(1).max(40)).max(10).default([]),
    isHistorical: z.boolean().default(false),
    priceSource: PriceSourceSchema.default("auto"),
    /** 优选交易对（创建/迁移时记录，取价与 K 线优先用它，避免选到同名代币的池子） */
    pairAddress: z
      .string()
      .regex(/^[0-9a-zA-Z]{20,80}$/)
      .optional(),
  })
  .superRefine((call, ctx) => {
    /* 历史记录专属白名单：unknown 持仓状态 */
    if (call.disclosure.position === "unknown" && !call.isHistorical) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["disclosure", "position"],
        message: 'position "unknown" 仅限历史记录（isHistorical=true）使用',
      });
    }
  });

export type Call = z.infer<typeof CallSchema>;

/* ---------- Update（只追加） ---------- */

export const UpdateSchema = z.object({
  callId: z.string().min(1),
  at: MinuteIsoSchema,
  type: UpdateTypeSchema,
  content: z.string().min(1).max(4000),
  priceAt: z.number().positive().optional(),
  mcapAt: z.number().positive().optional(),
  positionAction: z.enum(POSITION_ACTIONS).optional(),
});
export type CallUpdate = z.infer<typeof UpdateSchema>;

/* ---------- Outcome（复盘，一次） ---------- */

export const OutcomeSchema = z.object({
  callId: z.string().min(1),
  closedAt: MinuteIsoSchema,
  verdict: VerdictSchema,
  priceAtClose: z.number().positive(),
  mcapAtClose: z.number().positive(),
  maxMcapAfterCall: z.number().positive(),
  minMcapAfterCall: z.number().positive(),
  returnAtClose: z.number(),
  maxDrawdown: z.number(),
  invalidationTriggered: z.boolean(),
  lessons: z.string().min(1).max(4000),
  mistakeType: z.enum(MISTAKE_TYPES).optional(),
  priceSource: PriceSourceSchema.default("auto"),
});
export type Outcome = z.infer<typeof OutcomeSchema>;

/* ---------- 存储条目 ---------- */

export const CallRecordSchema = z.object({
  call: CallSchema,
  updates: z.array(UpdateSchema).default([]),
  outcome: OutcomeSchema.nullable().default(null),
});
export type CallRecord = z.infer<typeof CallRecordSchema>;

/** Call 中发布后锁定的字段（不可变性校验的清单依据）。
 *  stance（立场）不在此列：判断会随行情修正，经专门接口更新并自动留痕。 */
export const LOCKED_CALL_FIELDS = [
  "id",
  "chain",
  "tokenName",
  "symbol",
  "contractAddress",
  "calledAt",
  "priceAtCall",
  "mcapAtCall",
  "narrative",
  "thesis",
  "catalysts",
  "risks",
  "narrativeType",
  "horizon",
  "invalidation",
  "isHistorical",
] as const;
export type LockedCallField = (typeof LOCKED_CALL_FIELDS)[number];

/** horizon → 判定 expired 的时长（毫秒） */
export const HORIZON_MS: Record<(typeof HORIZONS)[number], number> = {
  intraday: 1 * 86_400_000,
  days: 7 * 86_400_000,
  weeks: 30 * 86_400_000,
  months: 180 * 86_400_000,
};

/** 生成 call id：2026-11-20-xxxxx（slug 为用户自定义短名） */
export function makeCallId(dateIso: string, slug: string): string {
  const day = dateIso.slice(0, 10);
  const clean = slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return `${day}-${clean || "call"}`;
}
