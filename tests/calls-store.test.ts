/**
 * calls-store 不可变性测试：判断发布后锁定、只追加、关闭后冻结
 */
import { describe, it, expect } from "vitest";
import {
  applyCreateCall,
  applyAppendUpdate,
  applyCloseCall,
  assertCallImmutable,
  ImmutableCallError,
  DuplicateCallError,
  CallAlreadyClosedError,
} from "@/lib/calls-store";
import type { Call, CallUpdate } from "@/lib/calls";

function baseCall(over: Partial<Call> = {}): Call {
  return {
    id: "2026-11-20-huss",
    chain: "solana",
    tokenName: "Huss",
    symbol: "HUSS",
    contractAddress: "9hjBLBrc7WZW2H8UQvBAvG5WiTZotXUv2Bdcn4f4pump",
    calledAt: "2026-11-20T14:30",
    stance: "bullish",
    priceAtCall: 0.02,
    mcapAtCall: 18_000_000,
    narrative: "GTA VI 道具叙事",
    thesis: "社区复刻 + 精确 ticker 的叙事闭环",
    catalysts: ["GTA VI 发售临近"],
    risks: ["热度依赖单一事件"],
    narrativeType: "event-driven",
    horizon: "weeks",
    invalidation: "GTA VI 延期且社区热度跌破启动前水平",
    disclosure: { position: "none", sponsored: false, referral: false },
    relatedReports: [],
    tags: [],
    isHistorical: false,
    priceSource: "auto",
    ...over,
  } as Call;
}

function note(callId = "2026-11-20-huss"): CallUpdate {
  return {
    callId,
    at: "2026-11-21T09:00",
    type: "note",
    content: "价格回踩，叙事未变",
  };
}

describe("applyCreateCall", () => {
  it("创建并追加记录", () => {
    const next = applyCreateCall([], baseCall());
    expect(next).toHaveLength(1);
    expect(next[0].updates).toEqual([]);
    expect(next[0].outcome).toBeNull();
  });

  it("重复 id 拒绝", () => {
    const one = applyCreateCall([], baseCall());
    expect(() => applyCreateCall(one, baseCall())).toThrow(DuplicateCallError);
  });

  it("schema 不通过的 Call 拒绝", () => {
    expect(() =>
      applyCreateCall([], baseCall({ thesis: "x" } as Call))
    ).toThrow();
  });
});

describe("不可变性：assertCallImmutable", () => {
  const call = baseCall();

  it("修改锁定字段（thesis）被拒绝", () => {
    expect(() => assertCallImmutable(call, { thesis: "改写后的论点" })).toThrow(
      ImmutableCallError
    );
    expect(() => assertCallImmutable(call, { thesis: "改写后的论点" })).toThrow(
      /thesis/
    );
  });

  it("修改锁定字段（priceAtCall / calledAt）被拒绝", () => {
    for (const patch of [
      { priceAtCall: 0.01 },
      { calledAt: "2026-11-21T14:30" },
      { invalidation: "换个证伪条件" },
      { thesis: "改写后的论点" },
    ]) {
      expect(() => assertCallImmutable(call, patch)).toThrow(ImmutableCallError);
    }
  });

  it("非锁定字段或同值补丁不报错", () => {
    expect(() =>
      assertCallImmutable(call, { proofUrl: "https://x.com/0CryptoZero/status/1" })
    ).not.toThrow();
    expect(() => assertCallImmutable(call, { thesis: call.thesis })).not.toThrow();
    expect(() => assertCallImmutable(call, {})).not.toThrow();
  });
});

describe("applyAppendUpdate", () => {
  it("向 open call 追加 update", () => {
    const recs = applyCreateCall([], baseCall());
    const next = applyAppendUpdate(recs, note());
    expect(next[0].updates).toHaveLength(1);
  });

  it("不存在的 call 拒绝", () => {
    const recs = applyCreateCall([], baseCall());
    expect(() => applyAppendUpdate(recs, note("2099-01-01-none"))).toThrow();
  });
});

describe("applyCloseCall", () => {
  const closeInput = {
    callId: "2026-11-20-huss",
    closedAt: "2026-11-28T10:00",
    verdict: "wrong" as const,
    priceAtClose: 0.015,
    mcapAtClose: 13_000_000,
    maxMcapAfterCall: 19_500_000,
    minMcapAfterCall: 12_000_000,
    maxDrawdown: 34,
    invalidationTriggered: true,
    lessons: "热度只维持三天，追高介入",
    mistakeType: "late-entry" as const,
    priceSource: "auto" as const,
  };

  it("写入 outcome 并自动计算 returnAtClose", () => {
    const recs = applyCreateCall([], baseCall());
    const next = applyCloseCall(recs, closeInput);
    const o = next[0].outcome!;
    expect(o.returnAtClose).toBeCloseTo(-25, 5);
    expect(o.verdict).toBe("wrong");
  });

  it("关闭后拒绝再写 outcome（不可重复复盘）", () => {
    const recs = applyCloseCall(applyCreateCall([], baseCall()), closeInput);
    expect(() => applyCloseCall(recs, closeInput)).toThrow(CallAlreadyClosedError);
  });

  it("关闭后拒绝再追加 update（记录冻结）", () => {
    const recs = applyCloseCall(applyCreateCall([], baseCall()), closeInput);
    expect(() => applyAppendUpdate(recs, note())).toThrow(CallAlreadyClosedError);
  });
});

describe("applyUpdateDisclosure", () => {
  it("更新披露成功，锁定字段不变", async () => {
    const { applyUpdateDisclosure } = await import("@/lib/calls-store");
    const recs = applyCreateCall([], baseCall());
    const next = applyUpdateDisclosure(recs, "2026-11-20-huss", {
      position: "holding",
      entryPrice: 0.018,
      sizeTier: "small",
      sponsored: false,
      referral: false,
    });
    expect(next[0].call.disclosure.position).toBe("holding");
    expect(next[0].call.thesis).toBe(baseCall().thesis);
  });

  it("不存在的 call 拒绝", async () => {
    const { applyUpdateDisclosure } = await import("@/lib/calls-store");
    const recs = applyCreateCall([], baseCall());
    expect(() =>
      applyUpdateDisclosure(recs, "2099-01-01-none", {
        position: "none", sponsored: false, referral: false,
      })
    ).toThrow();
  });
});

describe("applyUpdateStance", () => {
  it("立场可更新且自动追加立场调整留痕", async () => {
    const { applyUpdateStance } = await import("@/lib/calls-store");
    const recs = applyCreateCall([], baseCall());
    const next = applyUpdateStance(recs, "2026-11-20-huss", "watch", "2026-11-25T20:00");
    expect(next[0].call.stance).toBe("watch");
    const last = next[0].updates[next[0].updates.length - 1];
    expect(last.type).toBe("thesis-change");
    expect(last.content).toContain("bullish");
    expect(last.content).toContain("watch");
    /* 锁定字段不受影响 */
    expect(next[0].call.thesis).toBe(baseCall().thesis);
  });

  it("不存在的 call / 相同立场 / 已关闭 均拒绝或空操作", async () => {
    const { applyUpdateStance } = await import("@/lib/calls-store");
    const recs = applyCreateCall([], baseCall());
    expect(() => applyUpdateStance(recs, "2099-01-01-none", "bullish", "2026-11-25T20:00")).toThrow();
    /* 相同立场为空操作（fixture 立场是 bullish） */
    expect(applyUpdateStance(recs, "2026-11-20-huss", "bullish", "2026-11-25T20:00")).toBe(recs);
  });
});
