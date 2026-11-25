"use client";

/**
 * CallKline.tsx —— 详情页 K 线（TradingView Lightweight Charts，DexScreener 同款内核）
 * 蜡烛图 + 标记打点：判断(珊瑚橙箭头↓) / 笔记(墨点) / 论点修正(橙点) /
 * 加仓(绿点)·减仓(黄点)·清仓(红点) / 复盘(紫箭头)。
 * 数据走 /api/market?type=ohlcv&withTs=1（GeckoTerminal 蜡烛，服务端缓存 30 分钟）。
 */

import { useEffect, useRef, useState } from "react";
import { createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";

type Range = "24H" | "7D" | "30D" | "ALL";
interface Candle {
  t: number; o: number; h: number; l: number; c: number; v?: number;
}

/** 按价格量级给价格轴设置精度，避免小价格币显示成 0.00 */
function priceFormatFor(prices: number[]): { precision: number; minMove: number } {
  const max = Math.max(...prices.map((p) => Math.abs(p)));
  if (max >= 1000) return { precision: 2, minMove: 0.01 };
  if (max >= 1) return { precision: 4, minMove: 0.0001 };
  if (max >= 0.01) return { precision: 6, minMove: 0.000001 };
  if (max >= 0.0001) return { precision: 8, minMove: 0.00000001 };
  return { precision: 10, minMove: 0.0000000001 };
}
interface Mark {
  time: number;
  kind: "call" | "note" | "thesis" | "add" | "reduce" | "exit" | "outcome";
}

/* 全部用 inBar：aboveBar/belowBar 会把价格轴拉伸出数据范围（产生负刻度），inBar 不会 */
const MARK_STYLE: Record<Mark["kind"], { color: string; shape: "arrowDown" | "arrowUp" | "circle"; text: string; position: "inBar" }> = {
  call: { color: "#ff5b3a", shape: "arrowDown", text: "判断", position: "inBar" },
  note: { color: "#2a2230", shape: "circle", text: "记", position: "inBar" },
  thesis: { color: "#d97706", shape: "circle", text: "修", position: "inBar" },
  add: { color: "#059669", shape: "circle", text: "加", position: "inBar" },
  reduce: { color: "#d97706", shape: "circle", text: "减", position: "inBar" },
  exit: { color: "#dc2626", shape: "circle", text: "清", position: "inBar" },
  outcome: { color: "#5c2a52", shape: "arrowUp", text: "复盘", position: "inBar" },
};

export default function CallKline({
  chain,
  pair,
  marks,
}: {
  chain: string;
  pair: string;
  /** 时间戳（秒）+ 标记类型 */
  marks: Mark[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [range, setRange] = useState<Range>("7D");
  const [candles, setCandles] = useState<Candle[] | null>(null);
  const [failed, setFailed] = useState(false);

  /* 拉蜡烛数据 */
  useEffect(() => {
    let cancelled = false;
    setCandles(null);
    fetch(
      `/api/market?type=ohlcv&chain=${encodeURIComponent(chain)}&pair=${encodeURIComponent(pair)}&range=${range}&withTs=1`
    )
      .then((r) => r.json())
      .then((j: { candles?: Candle[] }) => {
        if (cancelled) return;
        if (j.candles && j.candles.length >= 2) setCandles(j.candles);
        else setFailed(true);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [chain, pair, range]);

  /* 初始化图表（一次） */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const dark = document.documentElement.classList.contains("dark");
    const chart = createChart(el, {
      layout: {
        background: { color: "transparent" },
        textColor: dark ? "#a89fb0" : "#857a8a",
        fontSize: 10,
        fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
      },
      grid: {
        vertLines: { color: dark ? "rgba(232,226,234,.06)" : "rgba(42,34,48,.06)" },
        horzLines: { color: dark ? "rgba(232,226,234,.06)" : "rgba(42,34,48,.06)" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "rgba(255,91,58,.35)", labelBackgroundColor: "#ff5b3a" },
        horzLine: { color: "rgba(255,91,58,.35)", labelBackgroundColor: "#ff5b3a" },
      },
      rightPriceScale: { borderColor: dark ? "rgba(232,226,234,.12)" : "rgba(42,34,48,.12)" },
      timeScale: {
        borderColor: dark ? "rgba(232,226,234,.12)" : "rgba(42,34,48,.12)",
        timeVisible: true,
        secondsVisible: false,
      },
      width: el.clientWidth,
      height: 320,
    });
    const series = chart.addCandlestickSeries({
      upColor: "#059669",
      downColor: "#ff5b3a",
      borderUpColor: "#059669",
      borderDownColor: "#ff5b3a",
      wickUpColor: "#059669",
      wickDownColor: "#ff5b3a",
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth });
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  /* 数据 / 标点 更新 */
  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;
    if (!candles) return;

    /* 价格轴：按量级自适应精度（修小价格币显示 0.00）；负值刻度留白（启动期长下影线会把轴拉到 0 以下） */
    const pf = priceFormatFor(candles.flatMap((c) => [c.h, c.l]));
    series.applyOptions({
      priceFormat: {
        type: "custom",
        minMove: pf.minMove,
        formatter: (p: number) => (p < 0 ? "" : p.toFixed(pf.precision)),
      },
    });

    series.setData(
      candles.map((c) => ({
        time: c.t as UTCTimestamp,
        open: c.o,
        high: c.h,
        low: c.l,
        close: c.c,
      }))
    );


    /* 标记对齐到最近一根蜡烛的时间（lightweight-charts 要求 marker.time 命中数据点） */
    const times = candles.map((c) => c.t);
    const snap = (t: number) => {
      let best = times[0];
      for (const x of times) if (Math.abs(x - t) < Math.abs(best - t)) best = x;
      return best;
    };
    const markers = marks
      .filter((m) => m.time >= times[0] && m.time <= times[times.length - 1])
      .map((m) => {
        const st = MARK_STYLE[m.kind];
        return {
          time: snap(m.time) as UTCTimestamp,
          position: st.position,
          color: st.color,
          shape: st.shape,
          text: st.text,
        };
      })
      /* 同一时间多个标记去重（保留第一个） */
      .filter((m, i, arr) => arr.findIndex((x) => x.time === m.time) === i)
      .sort((a, b) => a.time - b.time);
    series.setMarkers(markers);
    chart.timeScale().fitContent();
  }, [candles, marks]);

  return (
    <div>
      {/* 周期切换 */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1">
          {(["24H", "7D", "30D", "ALL"] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setFailed(false); setRange(r); }}
              className={`rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] transition-colors ${
                range === r
                  ? "border-accent font-bold text-accent dark:text-accent-mint"
                  : "border-line text-muted hover:text-heading"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted">
          <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-0.5 bg-[#ff5b3a]" /> 判断</span>
          <span className="flex items-center gap-1"><i className="inline-block h-1.5 w-1.5 rounded-full bg-[#059669]" /> 加</span>
          <span className="flex items-center gap-1"><i className="inline-block h-1.5 w-1.5 rounded-full bg-[#d97706]" /> 减/修</span>
          <span className="flex items-center gap-1"><i className="inline-block h-1.5 w-1.5 rounded-full bg-[#2a2230]" /> 记</span>
          <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-0.5 bg-[#5c2a52]" /> 复盘</span>
        </div>
      </div>

      {failed ? (
        <p className="py-10 text-center text-xs text-muted">K 线数据暂不可用（可点上方 DexScreener ↗ 查看）</p>
      ) : (
        <div ref={containerRef} className="w-full" style={{ height: 320 }} aria-label="K 线走势图（标记为判断与更新时间点）" role="img" />
      )}
    </div>
  );
}
