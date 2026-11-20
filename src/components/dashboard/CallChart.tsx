"use client";

/**
 * CallChart.tsx —— 详情页价格走势（SVG 折线，标出判断时间 + 各 Update 时间点）
 * 数据走 /api/market?type=ohlcv&withTs=1（带时间戳收盘序列）。
 */

import { useEffect, useState } from "react";

type Pt = [number, number];

export default function CallChart({
  chain,
  pair,
  calledAtTs,
  markerTs,
}: {
  chain: string;
  pair: string;
  calledAtTs: number;
  markerTs: number[];
}) {
  const [series, setSeries] = useState<Pt[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(
      `/api/market?type=ohlcv&chain=${encodeURIComponent(chain)}&pair=${encodeURIComponent(pair)}&range=ALL&withTs=1`
    )
      .then((r) => r.json())
      .then((j: { series?: Pt[] }) => {
        if (cancelled) return;
        if (j.series && j.series.length >= 2) setSeries(j.series);
        else setFailed(true);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [chain, pair]);

  if (failed)
    return <p className="py-8 text-center text-xs text-muted">K 线数据暂不可用</p>;
  if (!series)
    return <div className="h-[220px] animate-pulse rounded-xl bg-codebg" aria-hidden="true" />;

  const w = 640;
  const h = 220;
  const pad = { l: 8, r: 8, t: 14, b: 18 };
  const min = Math.min(...series.map((p) => p[1]));
  const max = Math.max(...series.map((p) => p[1]));
  const range = max - min || 1;
  const t0 = series[0][0];
  const t1 = series[series.length - 1][0];
  const span = t1 - t0 || 1;
  const x = (t: number) => pad.l + ((t - t0) / span) * (w - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / range) * (h - pad.t - pad.b);
  const pts = series.map(([t, c]) => `${x(t).toFixed(1)},${y(c).toFixed(1)}`).join(" ");

  const inRange = (t: number) => t >= t0 && t <= t1;
  const callX = inRange(calledAtTs) ? x(calledAtTs) : null;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      role="img"
      aria-label="价格走势图（竖线为判断与更新时间点）"
    >
      <polygon
        points={`${pad.l},${h - pad.b} ${pts} ${w - pad.r},${h - pad.b}`}
        fill="rgba(92,42,82,.07)"
      />
      <polyline
        points={pts}
        fill="none"
        stroke="#5c2a52"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* 判断时间：珊瑚橙实线 */}
      {callX !== null && (
        <g>
          <line x1={callX} y1={pad.t - 4} x2={callX} y2={h - pad.b} stroke="#ff5b3a" strokeWidth="2" />
          <circle cx={callX} cy={pad.t - 4} r="3.5" fill="#ff5b3a" />
        </g>
      )}
      {/* Update 时间点：墨色虚线 */}
      {markerTs.filter(inRange).map((t, i) => (
        <line
          key={i}
          x1={x(t)}
          y1={pad.t}
          x2={x(t)}
          y2={h - pad.b}
          stroke="#2a2230"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity=".45"
        />
      ))}
      {/* 价格极值标注 */}
      <text x={pad.l} y={pad.t - 3} fontSize="9" fill="#857a8a" fontFamily="monospace">
        {max.toPrecision(4)}
      </text>
      <text x={pad.l} y={h - 5} fontSize="9" fill="#857a8a" fontFamily="monospace">
        {min.toPrecision(4)}
      </text>
    </svg>
  );
}
