/**
 * TrenchCard.tsx —— Trench Index 面板 v2
 * 环形仪表盘（band 着色）+ 近 90 天面积走势 + 五个成分瓦片
 * （原始值 + 0–100 分位条）+ 日环比。
 * 数据口径见 src/lib/trench.ts 头部注释。
 */

import {
  bandColor,
  dayDelta,
  formatCount,
  formatUsdCompact,
  COMPONENT_ORDER,
  type TrenchData,
  type TrenchComponentKey,
} from "@/lib/trench";
import type { Dictionary, Locale } from "@/lib/i18n";

/* ---------- 半圆仪表盘 ---------- */

function Gauge({ score, color }: { score: number; color: string }) {
  const CX = 100;
  const CY = 104;
  const R = 76;
  const LEN = Math.PI * R; // 半圆弧长
  const frac = Math.min(100, Math.max(0, score)) / 100;

  const polar = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) };
  };

  const ticks = [0, 25, 50, 75, 100].map((t) => {
    const deg = 180 - (t / 100) * 180;
    const p1 = polar(deg, R - 2);
    const p2 = polar(deg, R - 9);
    return { t, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
  });

  return (
    <svg viewBox="0 0 200 118" className="w-full" role="img" aria-label={`Trench Index ${score}`}>
      {/* 轨道 */}
      <path
        d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
        fill="none"
        stroke="var(--code-bg)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* 进度 */}
      <path
        d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${(frac * LEN).toFixed(1)} ${LEN.toFixed(1)}`}
      />
      {/* 刻度 */}
      {ticks.map(({ t, x1, y1, x2, y2 }) => (
        <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--muted)" strokeOpacity="0.5" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

/* ---------- 面积走势 ---------- */

function AreaChart({ history, color }: { history: TrenchData["history"]; color: string }) {
  const points = history.slice(-90);
  if (points.length < 2) return null;

  const W = 560;
  const H = 110;
  const PAD = 4;
  const max = Math.max(...points.map((p) => p.score), 100);
  const min = Math.min(...points.map((p) => p.score), 0);
  const range = Math.max(max - min, 1);

  const xy = points.map((p, i) => {
    const x = PAD + (i / (points.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((p.score - min) / range) * (H - PAD * 2);
    return [x, y] as const;
  });
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${PAD},${H - PAD} ${line} ${W - PAD},${H - PAD}`;
  const last = xy[xy.length - 1];
  const y50 = H - PAD - ((50 - min) / range) * (H - PAD * 2);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-28 w-full"
      role="img"
      aria-label="Trench Index 90 day trend"
    >
      {/* 50 分参考线 */}
      <line x1={PAD} x2={W - PAD} y1={y50} y2={y50} stroke="var(--muted)" strokeOpacity="0.25" strokeDasharray="4 5" />
      {/* 面积 */}
      <polygon points={area} fill={color} opacity="0.12" />
      {/* 曲线 */}
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r="4" fill={color} />
      <circle cx={last[0]} cy={last[1]} r="8" fill={color} opacity="0.2" />
    </svg>
  );
}

/* ---------- 主组件 ---------- */

export default function TrenchCard({
  data,
  locale,
  t,
}: {
  data: TrenchData;
  locale: Locale;
  t: Dictionary;
}) {
  const color = bandColor(data.band);
  const delta = dayDelta(data);
  const bandLabel =
    (t.watchlist.bandLabel as Record<string, string>)[data.band] ??
    data.band.charAt(0).toUpperCase() + data.band.slice(1);

  const points = data.history.slice(-90);
  const hi = points.length ? Math.max(...points.map((p) => p.score)) : null;
  const lo = points.length ? Math.min(...points.map((p) => p.score)) : null;

  const formatValue = (key: TrenchComponentKey, value: number) =>
    key === "tokens_launched" ? formatCount(value) : formatUsdCompact(value);

  return (
    <section aria-label="Trench Index" className="rounded-2xl border border-line bg-card p-6 sm:p-8">
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-stretch lg:gap-12">
        {/* 左：仪表盘 */}
        <div className="flex w-full max-w-60 flex-col items-center">
          <div className="relative w-full">
            <Gauge score={data.score} color={color} />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-1">
              <span
                className="text-5xl font-bold tabular-nums tracking-tight"
                style={{ color }}
              >
                {data.score}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm font-semibold" style={{ color }}>
            {bandLabel}
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted">
            {data.day}
            {delta !== null && delta !== 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${
                  delta > 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                {delta > 0 ? `▲ ${delta}` : `▼ ${Math.abs(delta)}`}
              </span>
            )}
          </p>
        </div>

        {/* 右：走势 + 成分 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between text-xs text-muted">
            <span className="font-medium text-heading">{t.watchlist.trenchTitle}</span>
            {hi !== null && lo !== null && (
              <span className="tabular-nums">
                90d {lo}–{hi}
              </span>
            )}
          </div>

          <div className="mt-2">
            <AreaChart history={data.history} color={color} />
          </div>

          {/* 成分瓦片：原始值 + 分位条 */}
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {COMPONENT_ORDER.map((key) => {
              const comp = data.components[key];
              if (!comp) return null;
              return (
                <li
                  key={key}
                  className="rounded-xl bg-codebg/60 px-3.5 py-3 dark:bg-codebg/40"
                >
                  <p className="truncate text-[11px] text-muted">
                    {t.watchlist.components[key]}
                  </p>
                  <p className="mt-1 text-[15px] font-bold tabular-nums text-heading">
                    {formatValue(key, comp.value)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(0, comp.percentile))}%`,
                          background: color,
                          opacity: 0.75,
                        }}
                      />
                    </div>
                    <span className="text-[10px] tabular-nums text-muted">
                      P{Math.round(comp.percentile)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <p className="mt-5 text-right text-[10px] text-muted">
        {t.watchlist.method} · {t.watchlist.trenchSource}
      </p>
    </section>
  );
}
