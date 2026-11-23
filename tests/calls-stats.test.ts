/**
 * calls-stats 派生统计测试：状态、中位数、胜率、错误类型占比
 */
import { describe, it, expect } from "vitest";
import { computeStats, median, statusOf } from "@/lib/calls-stats";
import type { Call, CallRecord } from "@/lib/calls";

function call(over: Partial<Call> = {}): Call {
  return {
    id: "2026-11-01-a",
    chain: "solana",
    tokenName: "A",
    symbol: "A",
    contractAddress: "9hjBLBrc7WZW2H8UQvBAvG5WiTZotXUv2Bdcn4f4pump",
    calledAt: "2026-11-01T10:00",
    stance: "bullish",
    priceAtCall: 0.01,
    mcapAtCall: 1_000_000,
    narrative: "n",
    thesis: "t",
    catalysts: [],
    risks: [],
    narrativeType: "other",
    horizon: "days",
    invalidation: "i",
    disclosure: { position: "none", sponsored: false, referral: false },
    relatedReports: [],
    tags: [],
    isHistorical: false,
    priceSource: "auto",
    ...over,
  } as Call;
}

function record(
  c: Call,
  outcome: CallRecord["outcome"] = null
): CallRecord {
  return { call: c, updates: [], outcome };
}

const NOW = Date.parse("2026-11-20T12:00");

describe("statusOf", () => {
  it("有 outcome → closed", () => {
    const r = record(call(), {
      callId: r0.call.id,
      closedAt: "2026-11-05T10:00",
      verdict: "correct",
      priceAtClose: 0.02,
      mcapAtClose: 2_000_000,
      maxMcapAfterCall: 2_500_000,
      minMcapAfterCall: 900_000,
      returnAtClose: 100,
      maxDrawdown: 10,
      invalidationTriggered: false,
      lessons: "l",
      priceSource: "auto",
    });
    function noop() {}
    void noop;
    expect(statusOf(r, NOW)).toBe("closed");
  });

  it("超 horizon 且无 outcome → expired（待复盘）", () => {
    /* days = 7 天；11-01 判断，11-20 已过期 */
    expect(statusOf(record(call()), NOW)).toBe("expired");
  });

  it("horizon 内 → open", () => {
    expect(
      statusOf(record(call({ calledAt: "2026-11-19T10:00", horizon: "weeks" })), NOW)
    ).toBe("open");
  });
});

const r0 = record(call());

describe("median", () => {
  it("空数组 null；奇偶取值正确", () => {
    expect(median([])).toBeNull();
    expect(median([3])).toBe(3);
    expect(median([1, 3, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe("computeStats", () => {
  function closedRecord(c: Call, verdict: "correct" | "wrong", ret: number, dd: number, mistake?: string): CallRecord {
    return record(c, {
      callId: c.id,
      closedAt: "2026-11-10T10:00",
      verdict,
      priceAtClose: c.priceAtCall * (1 + ret / 100),
      mcapAtClose: c.mcapAtCall,
      maxMcapAfterCall: c.mcapAtCall * 2,
      minMcapAfterCall: c.mcapAtCall / 2,
      returnAtClose: ret,
      maxDrawdown: dd,
      invalidationTriggered: verdict === "wrong",
      lessons: "l",
      mistakeType: mistake as never,
      priceSource: "auto",
    });
  }

  it("胜率/中位数/占比/小样本提示", () => {
    const records = [
      closedRecord(call({ id: "2026-11-01-a", calledAt: "2026-11-01T10:00" }), "correct", 50, 10, "late-entry"),
      closedRecord(call({ id: "2026-11-02-b", calledAt: "2026-11-02T10:00" }), "wrong", -20, 30, "late-entry"),
      closedRecord(call({ id: "2026-11-03-c", calledAt: "2026-11-03T10:00" }), "wrong", -80, 60, "rug"),
      closedRecord(call({ id: "2026-11-04-d", calledAt: "2026-11-04T10:00" }), "correct", 100, 5),
      /* unresolved：计入 closed 但不计入胜率分母 */
      closedRecord(call({ id: "2026-11-05-e", calledAt: "2026-11-05T10:00" }), "correct", 10, 5),
      record(call({ id: "2026-11-19-f", calledAt: "2026-11-19T10:00", horizon: "weeks" })),
    ];
    // 修正 e 的 verdict 为 unresolved（上面函数签名限制，直接覆写）
    records[4].outcome = { ...records[4].outcome!, verdict: "unresolved" };

    const s = computeStats(records, NOW);
    expect(s.total).toBe(6);
    expect(s.closed).toBe(5);
    expect(s.open).toBe(1);
    expect(s.winRate).toBe(50); // 2 correct / 4 resolved
    expect(s.medianReturn).toBe(10); // [50,-20,-80,100,10] sorted → 10（unresolved 也计入收益中位数，只排除在胜率分母外）
    expect(s.medianMaxDrawdown).toBe(10); // [10,30,60,5,5] sorted [5,5,10,30,60] → 10
    expect(s.mistakeShare["late-entry"]).toBe(66.7);
    expect(s.since).toBe("2026-11-01");
    expect(s.smallSample).toBe(true); // resolved=4 < 5
  });

  it("涨跌幅中位数不受极端值扭曲（对比平均数）", () => {
    const records = [
      closedRecord(call({ id: "2026-11-01-a" }), "correct", 10, 5),
      closedRecord(call({ id: "2026-11-02-b" }), "correct", 20, 5),
      closedRecord(call({ id: "2026-11-03-c" }), "wrong", -2000, 90),
    ];
    const s = computeStats(records, NOW);
    expect(s.medianReturn).toBe(10); // 中位数 [−2000,10,20] → 10；平均数会是 -656
    expect(s.smallSample).toBe(true);
  });
});

describe("activityAt", () => {
  it("取 判断/更新/复盘 的最大时间", async () => {
    const { activityAt } = await import("@/lib/calls-stats");
    const r = record(call({ calledAt: "2026-11-17T10:00" }));
    expect(activityAt(r)).toBe("2026-11-17T10:00");
    const withUpd = {
      ...r,
      updates: [
        { callId: "x", at: "2026-11-20T09:00", type: "note" as const, content: "a" },
        { callId: "x", at: "2026-11-23T07:40", type: "position-change" as const, content: "b" },
      ],
    };
    expect(activityAt(withUpd)).toBe("2026-11-23T07:40");
  });
});
