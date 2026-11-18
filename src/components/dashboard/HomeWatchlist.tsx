import Link from "next/link";

/**
 * HomeWatchlist.tsx —— 首页「关注列表」精简区
 * 完整看板已独立为 /dashboard 页，这里只展示 Top4 + 入口卡片。
 * 每张卡片可点击直达看板。
 */

import CoinAvatar from "@/components/CoinAvatar";
import { avatarHue, formatPrice } from "@/lib/coin-format";
import type { WatchCoinWithData } from "@/lib/watchlist";
import type { Dictionary, Locale } from "@/lib/i18n";

const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

export default function HomeWatchlist({
  coins,
  locale,
  t,
  activities = {},
}: {
  coins: WatchCoinWithData[];
  locale: Locale;
  t: Dictionary;
  /** 投研活跃度：address → { 最近动态日期, 动态条数(日志+研报+事件) } */
  activities?: Record<string, { latest: string; newCount: number }>;
}) {
  /* 全部有行情的币按最近动态（含建立关注）排序 */
  const top = coins
    .filter((c) => c.data)
    .sort(
      (a, b) =>
        (activities[b.address]?.latest ?? "").localeCompare(
          activities[a.address]?.latest ?? ""
        )
    )
    .slice(0, 4);

  return (
    <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
      {top.map((c) => {
        const since =
          c.data?.priceUsd && c.followPrice
            ? (c.data.priceUsd / c.followPrice - 1) * 100
            : null;
        const up24 = (c.data?.change24h ?? 0) >= 0;
        const act = activities[c.address];
        return (
          <Link
            key={c.address}
            href={`/${locale}/dashboard?coin=${c.address}`}
            className="group relative rounded-2xl border border-line bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg"
          >
            {act && act.newCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 z-10 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                新 · {act.newCount}
              </span>
            )}
            {act && act.newCount === 0 &&
              Date.now() - new Date(act.latest).getTime() < 7 * 864e5 && (
              <span className="absolute -right-1.5 -top-1.5 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                新关注
              </span>
            )}
            <div className="flex items-center gap-2.5">
              <CoinAvatar
                imageUrl={c.data?.imageUrl}
                symbol={c.data?.symbol ?? c.address.slice(0, 4)}
                hue={avatarHue(c.address)}
                size={36}
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-heading">
                  {c.data?.name}
                </div>
                <div className="truncate text-xs text-muted">
                  {c.data?.symbol} · {c.data?.chainId}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between gap-2">
              <div>
                <div className="text-sm font-bold tabular-nums text-heading">
                  {formatPrice(c.data?.priceUsd ?? 0)}
                </div>
                <div
                  className={`text-xs tabular-nums ${
                    up24
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {fmtPct(c.data?.change24h ?? 0)} 24H
                </div>
              </div>
              {since !== null && (
                <span
                  className={`rounded-lg px-2 py-1 text-xs font-bold tabular-nums ${
                    since >= 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}
                >
                  {fmtPct(since)}
                </span>
              )}
            </div>
            {act && (
              <p className="mt-2 text-[11px] font-medium text-accent dark:text-accent-mint">
                更新于 {act.latest}
              </p>
            )}
            {c.comment && (
              <p className="mt-1 line-clamp-1 text-xs text-muted">{c.comment}</p>
            )}
          </Link>
        );
      })}

      {/* 看板入口卡片 */}
      <Link
        href={`/${locale}/dashboard`}
        className="group flex min-h-[118px] flex-col items-start justify-between rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-accent/10"
      >
        <div>
          <div className="text-sm font-semibold text-accent dark:text-accent-mint">
            {t.dashboard.title}
          </div>
          <div className="mt-1 text-xs text-muted">
            {t.watchlist.intro}
          </div>
        </div>
        <span className="text-sm font-medium text-accent transition-transform duration-200 group-hover:translate-x-1 dark:text-accent-mint">
          {t.watchlist.viewDashboard} →
        </span>
      </Link>
    </div>
  );
}
