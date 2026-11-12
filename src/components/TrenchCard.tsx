/**
 * TrenchCard.tsx —— Trench Index 卡片
 * 今日评分（大数字 + 情绪带）+ 历史走势折线（近 90 天 SVG sparkline）
 * + 四个成分的分位条。数据来自 tehcscreener 公开 API。
 */

import { scoreColor, type TrenchData } from "@/lib/trench";
import type { Dictionary } from "@/lib/i18n";

const BAND_LABEL: Record<string, { zh: string; en: string }> = {
  cold: { zh: "冷清", en: "Cold" },
  active: { zh: "活跃", en: "Active" },
  hot: { zh: "火热", en: "Hot" },
  euphoric: { zh: "狂热", en: "Euphoric" },
};

function Sparkline({ history, color }: { history: TrenchData["history"]; color: string }) {
  const points = history.slice(-90);
  if (points.length < 2) return null;

  const W = 560;
  const H = 120;
  const PAD = 6;
  const max = Math.max(...points.map((p) => p.score), 100);
  const min = Math.min(...points.map((p) => p.score), 0);
  const range = Math.max(max - min, 1);

  const xy = points.map((p, i) => {
    const x = PAD + (i / (points.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((p.score - min) / range) * (H - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-28 w-full"
      role="img"
      aria-label={`Trench Index trend, last ${points.length} days`}
    >
      {/* 中位参考线 */}
      <line
        x1={PAD}
        x2={W - PAD}
        y1={H - PAD - ((50 - min) / range) * (H - PAD * 2)}
        y2={H - PAD - ((50 - min) / range) * (H - PAD * 2)}
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeDasharray="4 4"
      />
      <polyline
        points={xy.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* 末端点 */}
      {last && (
        <circle
          cx={W - PAD}
          cy={H - PAD - ((last.score - min) / range) * (H - PAD * 2)}
          r="4"
          fill={color}
        />
      )}
    </svg>
  );
}

export default function TrenchCard({
  data,
  locale,
  t,
}: {
  data: TrenchData;
  locale: "zh" | "en";
  t: Dictionary;
}) {
  const color = scoreColor(data.score);
  const band = BAND_LABEL[data.band] ?? {
    zh: data.band,
    en: data.band,
  };

  const components = [
    { key: "pad_volume", label: t.watchlist.components.pad_volume },
    { key: "tokens_launched", label: t.watchlist.components.tokens_launched },
    { key: "bot_volume", label: t.watchlist.components.bot_volume },
    { key: "bot_fees", label: t.watchlist.components.bot_fees },
  ] as const;

  return (
    <section
      aria-label="Trench Index"
      className="overflow-hidden rounded-2xl border border-line bg-card"
    >
      <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:gap-10">
        {/* 左：今日评分 */}
        <div className="flex items-center gap-5">
          <div>
            <p className="text-xs text-muted">{t.watchlist.trenchTitle}</p>
            <p
              className="mt-1 text-6xl font-bold tabular-nums tracking-tight"
              style={{ color }}
            >
              {data.score}
            </p>
            <p className="mt-1 text-xs text-muted">
              {locale === "en" ? band.en : band.zh}
              {data.day && (
                <>
                  <span aria-hidden="true"> · </span>
                  {data.day}
                </>
              )}
            </p>
          </div>
        </div>

        {/* 右：走势 + 成分 */}
        <div className="min-w-0">
          <div className="text-muted">
            <Sparkline history={data.history} color={color} />
          </div>
          <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {components.map(({ key, label }) => {
              const comp = data.components[key];
              return (
                <li key={key}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-muted">{label}</span>
                    <span className="tabular-nums text-muted">
                      {comp.percentile}
                      <span className="text-muted/60">th</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-codebg">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, comp.percentile))}%`,
                        background: color,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <p className="border-t border-line px-6 py-2.5 text-right text-[11px] text-muted">
        {t.watchlist.trenchSource}
      </p>
    </section>
  );
}
