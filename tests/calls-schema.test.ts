/**
 * calls.ts Zod schema 校验测试
 */
import { describe, it, expect } from "vitest";
import { CallSchema, makeCallId } from "@/lib/calls";

function validCall(over: Record<string, unknown> = {}) {
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
    catalysts: [],
    risks: [],
    narrativeType: "event-driven",
    horizon: "weeks",
    invalidation: "GTA VI 延期且社区热度跌破启动前水平",
    disclosure: { position: "none", sponsored: false, referral: false },
    isHistorical: false,
    ...over,
  };
}

describe("CallSchema", () => {
  it("合法 Call 通过", () => {
    expect(CallSchema.parse(validCall()).stance).toBe("bullish");
  });

  it("invalidation 为空被拒绝（必填）", () => {
    expect(() => CallSchema.parse(validCall({ invalidation: "" }))).toThrow();
  });

  it('position "unknown" 在非历史记录中被拒绝', () => {
    expect(() =>
      CallSchema.parse(
        validCall({ disclosure: { position: "unknown", sponsored: false, referral: false } })
      )
    ).toThrow(/unknown/);
  });

  it('position "unknown" 在历史记录中允许', () => {
    const c = CallSchema.parse(
      validCall({
        isHistorical: true,
        disclosure: { position: "unknown", sponsored: false, referral: false },
      })
    );
    expect(c.disclosure.position).toBe("unknown");
  });

  it("calledAt 必须是合法 ISO 且精确到分钟", () => {
    expect(() => CallSchema.parse(validCall({ calledAt: "昨天" }))).toThrow();
    expect(
      CallSchema.parse(validCall({ calledAt: "2026-11-20T14:30:00" })).calledAt
    ).toBe("2026-11-20T14:30:00");
  });

  it("披露必填： sponsored/referral 缺失被拒", () => {
    expect(() =>
      CallSchema.parse(
        validCall({ disclosure: { position: "none" } })
      )
    ).toThrow();
  });
});

describe("makeCallId", () => {
  it("生成 日期-slug 格式", () => {
    expect(makeCallId("2026-11-20T14:30", "Huss Coin!")).toBe("2026-11-20-huss-coin");
  });
});
