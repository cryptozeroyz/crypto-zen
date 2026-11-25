/**
 * calls-store.ts —— Track Record 数据层（不可变写入规则在此实现）
 *
 * 核心约定：
 * - Call 发布后锁定：任何对 LOCKED_CALL_FIELDS 的修改都会被拒绝（ImmutableCallError）；
 * - 演进只能新增 Update；写入 Outcome 后该 call 彻底冻结（不再接受 Update）；
 * - 纯函数（apply*）与 IO（read/save）分离，纯函数无副作用、可直接单测；
 * - 存储走 storage 适配器（本地文件 / GitHub），VPS 上保存即自动提交部署。
 */

import {
  CallRecordSchema,
  CallSchema,
  UpdateSchema,
  OutcomeSchema,
  DisclosureSchema,
  StanceSchema,
  LOCKED_CALL_FIELDS,
  type Call,
  type CallRecord,
  type CallUpdate,
  type Outcome,
} from "@/lib/calls";
import { readTextFile, saveTextFile } from "@/lib/storage";

export const CALLS_PATH = "content/calls.json";

/* ---------- 错误类型 ---------- */

export class ImmutableCallError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImmutableCallError";
  }
}
export class CallNotFoundError extends Error {
  constructor(id: string) {
    super(`Call 不存在: ${id}`);
    this.name = "CallNotFoundError";
  }
}
export class CallAlreadyClosedError extends Error {
  constructor(id: string) {
    super(`Call 已复盘关闭，不可再变更: ${id}`);
    this.name = "CallAlreadyClosedError";
  }
}
export class DuplicateCallError extends Error {
  constructor(id: string) {
    super(`Call id 重复: ${id}`);
    this.name = "DuplicateCallError";
  }
}

/* ---------- 纯函数：所有写入必须先过这里 ---------- */

/** 拒绝任何对 Call 锁定字段的修改（校验层实现不可变性） */
export function assertCallImmutable(
  original: Call,
  next: unknown
): void {
  if (typeof next !== "object" || next === null) {
    throw new ImmutableCallError("Call 必须是对象");
  }
  const patch = next as Record<string, unknown>;
  for (const field of LOCKED_CALL_FIELDS) {
    if (field in patch) {
      const a = JSON.stringify(original[field]);
      const b = JSON.stringify(patch[field]);
      if (a !== b) {
        throw new ImmutableCallError(
          `Call 发布后不可修改锁定字段「${field}」。判断错了请新增 thesis-change Update 或关闭复盘，不要改写原判断。`
        );
      }
    }
  }
}

/** 新建 Call（重复 id 拒绝） */
export function applyCreateCall(
  records: CallRecord[],
  call: Call
): CallRecord[] {
  CallSchema.parse(call);
  if (records.some((r) => r.call.id === call.id)) {
    throw new DuplicateCallError(call.id);
  }
  return [...records, { call, updates: [], outcome: null }];
}

/** 追加 Update（call 关闭后拒绝） */
export function applyAppendUpdate(
  records: CallRecord[],
  update: CallUpdate
): CallRecord[] {
  UpdateSchema.parse(update);
  const idx = records.findIndex((r) => r.call.id === update.callId);
  if (idx === -1) throw new CallNotFoundError(update.callId);
  if (records[idx].outcome) throw new CallAlreadyClosedError(update.callId);
  const next = records.slice();
  next[idx] = {
    ...records[idx],
    updates: [...records[idx].updates, update],
  };
  return next;
}

/** 更新利益披露（唯一允许的 Call 字段变更；锁定字段必须原样不动，否则拒绝） */
export function applyUpdateDisclosure(
  records: CallRecord[],
  callId: string,
  disclosure: Call["disclosure"]
): CallRecord[] {
  DisclosureSchema.parse(disclosure);
  const idx = records.findIndex((r) => r.call.id === callId);
  if (idx === -1) throw new CallNotFoundError(callId);
  const nextCall = { ...records[idx].call, disclosure };
  assertCallImmutable(records[idx].call, nextCall); // 兜底：锁定字段不可顺带篡改
  const next = records.slice();
  next[idx] = { ...records[idx], call: CallSchema.parse(nextCall) };
  return next;
}

/** 更新立场（唯一允许修正的判断字段；自动追加「立场调整」Update 留痕；关闭后拒绝） */
export function applyUpdateStance(
  records: CallRecord[],
  callId: string,
  stance: Call["stance"],
  at: string
): CallRecord[] {
  StanceSchema.parse(stance);
  const idx = records.findIndex((r) => r.call.id === callId);
  if (idx === -1) throw new CallNotFoundError(callId);
  if (records[idx].outcome) throw new CallAlreadyClosedError(callId);
  const prev = records[idx].call.stance;
  if (prev === stance) return records;
  const nextCall = { ...records[idx].call, stance };
  assertCallImmutable(records[idx].call, nextCall); // 兜底：只允许 stance 变
  const next = records.slice();
  next[idx] = {
    ...records[idx],
    call: CallSchema.parse(nextCall),
    updates: [
      ...records[idx].updates,
      {
        callId,
        at,
        type: "thesis-change",
        content: `立场调整 stance: ${prev} → ${stance}`,
      },
    ],
  };
  return next;
}

/** 关闭复盘：写入 Outcome。returnAtClose 由判断时/关闭时价格自动计算，不允许手填覆盖 */
export function applyCloseCall(
  records: CallRecord[],
  input: Omit<Outcome, "returnAtClose">
): CallRecord[] {
  const idx = records.findIndex((r) => r.call.id === input.callId);
  if (idx === -1) throw new CallNotFoundError(input.callId);
  if (records[idx].outcome) throw new CallAlreadyClosedError(input.callId);
  const returnAtClose =
    (input.priceAtClose / records[idx].call.priceAtCall - 1) * 100;
  const outcome: Outcome = OutcomeSchema.parse({
    ...input,
    returnAtClose: Math.round(returnAtClose * 100) / 100,
  });
  const next = records.slice();
  next[idx] = { ...records[idx], outcome };
  return next;
}

/* ---------- IO：读取与保存（走 storage 适配器） ---------- */

/** 读取全部记录；文件缺失返回 []；单条损坏跳过并告警（不拖垮整站） */
export async function readCallRecords(): Promise<CallRecord[]> {
  const raw = await readTextFile(CALLS_PATH);
  if (!raw) return [];
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    console.error("[calls] calls.json 不是合法 JSON，按空列表处理");
    return [];
  }
  if (!Array.isArray(json)) return [];
  const records: CallRecord[] = [];
  for (const item of json) {
    const parsed = CallRecordSchema.safeParse(item);
    if (parsed.success) records.push(parsed.data);
    else console.error("[calls] 跳过损坏记录:", parsed.error.issues[0]?.path, parsed.error.issues[0]?.message);
  }
  return records;
}

export async function saveCallRecords(records: CallRecord[]): Promise<void> {
  await saveTextFile(CALLS_PATH, JSON.stringify(records, null, 1));
}

/** 便捷写入：读 → 纯函数变更 → 存 */
export async function createCall(call: Call): Promise<CallRecord[]> {
  const records = await readCallRecords();
  const next = applyCreateCall(records, call);
  await saveCallRecords(next);
  return next;
}

export async function appendUpdate(update: CallUpdate): Promise<CallRecord[]> {
  const records = await readCallRecords();
  const next = applyAppendUpdate(records, update);
  await saveCallRecords(next);
  return next;
}

export async function closeCall(
  input: Omit<Outcome, "returnAtClose">
): Promise<CallRecord[]> {
  const records = await readCallRecords();
  const next = applyCloseCall(records, input);
  await saveCallRecords(next);
  return next;
}

export async function updateCallStance(
  callId: string,
  stance: Call["stance"],
  at: string
): Promise<CallRecord[]> {
  const records = await readCallRecords();
  const next = applyUpdateStance(records, callId, stance, at);
  await saveCallRecords(next);
  return next;
}

export async function updateCallDisclosure(
  callId: string,
  disclosure: Call["disclosure"]
): Promise<CallRecord[]> {
  const records = await readCallRecords();
  const next = applyUpdateDisclosure(records, callId, disclosure);
  await saveCallRecords(next);
  return next;
}
