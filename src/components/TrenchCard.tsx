/**
 * TrenchCard.tsx —— Trench Index 紧凑版
 * 单行布局：大分数 + 90 天走势 + 四个成分分位条，
 * 配色全部使用品牌青绿/灰阶，不再使用橙色等跳色。
 */

import type { TrenchData } from "@/lib/trench";
import type { Dictionary, Locale } from "@/lib/i18n";

function Sparkline({ history }: { history: TrenchData["history"] }) {
  const points = history.slice(-90);
  if (points.length < 2) return null;

  const W = 420;
  const H = 56;
  const PAD = 5;
  const max = Math.max(...points.map((p) => p.score), 100);
  const min = Math.min(...points.map((p) => p.score), 0);
  const range = Math.max(max - min, 1);

  const y50 = H - PAD - ((50 - min) / range) * (H - PAD * 2);
  const xy = points
    .map((p, i) => {
      const x = PAD + (i / (points.length - 1)) * (W - PAD * 2);
      const y = H - PAD - ((p.score - min) / range) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const last = points[points.length - 1];
  const lastY = H - PAD - ((last.score - min) / range) * (H - PAD * 2);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-14 w-full min-w-[200px] text-accent"
      role="img"
      aria-label="Trench Index trend"
    >
      <line
        x1={PAD}
        x2={W - PAD}
        y1={y50}
        y2={y50}
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeDasharray="4 4"
      />
      <polyline
        points={xy}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.75"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={W - PAD} cy={lastY} r="3.5" fill="currentColor" />
    </svg>
  );
}

export default function TrenchCard({
  data,
  locale,
  t,
}: {
  data: TrenchData;
  locale: Locale;
  t: Dictionary;
}) {
  const components = [
    { key: "pad_volume", label: t.watchlist.components.pad_volume, p: data.components.pad_volume.percentile },
    { key: "tokens_launched", label: t.watchlist.components.tokens_launched, p: data.components.tokens_launched.percentile },
    { key: "bot_volume", label: t.watchlist.components.bot_volume, p: data.components.bot_volume.percentile },
    { key: "bot_fees", label: t.watchlist.components.bot_fees, p: data.components.bot_fees.percentile },
  ] as const;

  return (
    <section
      aria-label="Trench Index"
      className="rounded-2xl border border-line bg-card"
    >
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-6 py-4">
        {/* 分数 */}
        <div className="flex shrink-0 items-baseline gap-3">
          <span className="text-[11px] text-muted">Trench Index</span>
          <span
            className={`text-3xl font-bold tabular-nums tracking-tight ${
              data.score >= 45 ? "text-accent dark:text-accent-mint" : "text-muted"
            }`}
          >
            {data.score}
          </span>
          <span className="text-[11px] text-muted">
            {locale === "en"
              ? data.band.charAt(0).toUpperCase() + data.band.slice(1)
              : t.watchlist.bandLabel[data.band as keyof typeof t.watchlist.bandLabel] ?? data.band}
            {data.day && (
              <>
                <span aria-hidden="true"> · </span>
                {data.day}
              </>
            )}
          </span>
        </div>

        {/* 走势 */}
        <div className="min-w-[200px] flex-1">
          <Sparkline history={data.history} />
        </div>

        {/* 成分分位条（紧凑横排） */}
        <ul className="flex shrink-0 flex-wrap gap-x-5 gap-y-2">
          {components.map(({ key, label, p }) => (
            <li key={key} className="w-24">
              <div className="flex justify-between text-[10px] leading-none text-muted">
                <span className="truncate">{label}</span>
                <span className="tabular-nums">{p}</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-codebg">
                <div
                  className="h-full rounded-full bg-accent/60 dark:bg-accent-mint/60"
                  style={{ width: `${Math.min(100, Math.max(0, p))}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="border-t border-line px-6 py-1.5 text-right text-[10px] text-muted">
        {t.watchlist.trenchSource}
      </p>
    </section>
  );
}
