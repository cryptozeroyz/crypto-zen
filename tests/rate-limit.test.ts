/**
 * rate-limit 令牌桶测试
 */
import { describe, it, expect } from "vitest";
import { takeToken, RateLimiter } from "@/lib/rate-limit";

describe("takeToken", () => {
  it("首次请求放行并扣减", () => {
    const [ok, b] = takeToken(undefined, 1000, 2, 1);
    expect(ok).toBe(true);
    expect(b.tokens).toBeCloseTo(1, 5);
  });

  it("桶空后拒绝并给出剩余秒数", () => {
    const [, b1] = takeToken(undefined, 0, 1, 0.5); // 0.5/s, cap 1 → 用掉后 0
    const [ok, b2, retry] = takeToken(b1, 0, 1, 0.5);
    expect(ok).toBe(false);
    expect(retry).toBeGreaterThan(0);
    void b2;
  });

  it("随时间回充", () => {
    const [, b1] = takeToken(undefined, 0, 1, 1);
    const [ok] = takeToken(b1, 2000, 1, 1); // 2s 后回满
    expect(ok).toBe(true);
  });
});

describe("RateLimiter", () => {
  it("按 key 独立限流", () => {
    const rl = new RateLimiter(1, 0.001);
    expect(rl.check("a", 0)).toBeNull();
    expect(rl.check("a", 0)).not.toBeNull();
    expect(rl.check("b", 0)).toBeNull(); // b 不受 a 影响
  });
});
