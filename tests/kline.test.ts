/**
 * K 线小周期合成测试（15m → 30m）
 */
import { describe, it, expect } from "vitest";
import { aggregateCandles } from "@/components/dashboard/CallKline";

const c = (t: number, o: number, h: number, l: number, cl: number, v = 1) => ({ t, o, h, l, c: cl, v });

describe("aggregateCandles", () => {
  it("两个 15m 桶合成一根 30m：首开/最高/最低/末收/量和", () => {
    const out = aggregateCandles(
      [c(900, 1, 2, 0.5, 1.5, 10), c(1800, 1.5, 3, 1, 2.5, 20), c(2700, 2.5, 4, 2, 3, 5)],
      1800
    );
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ t: 0, o: 1, h: 3, l: 0.5, c: 2.5, v: 30 });
    expect(out[1]).toMatchObject({ t: 1800, o: 2.5, h: 4, l: 2, c: 3, v: 5 });
  });

  it("乱序输入也能正确分桶排序", () => {
    const out = aggregateCandles([c(1900, 1, 1, 1, 1), c(100, 2, 2, 2, 2)], 1800);
    expect(out.map((x) => x.t)).toEqual([0, 1800]);
  });
});
