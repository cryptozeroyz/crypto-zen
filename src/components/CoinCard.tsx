/**
 * CoinCard.tsx —— 单个关注代币卡片
 * 头像 / 名称 / 链与交易所 / 价格与 24h 涨跌 / 一句话评价 / K 线链接。
 * 数据来自 DexScreener，按 CA 自动抓取。
 */

import CoinAvatar from "@/components/CoinAvatar";
import { formatPrice, avatarHue } from "@/lib/coin-format";
import type { WatchCoinWithData } from "@/lib/watchlist";
import type { Dictionary } from "@/lib/i18n";

export default function CoinCard({ coin, t }: { coin: WatchCoinWithData; t: Dictionary }) {
  const d = coin.data;
  const up = (d?.change24h ?? 0) >= 0;
  const hue = avatarHue(coin.ca);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/40">
      {/* 头部：头像 + 名称 + 链 */}
      <div className="flex items-center gap-3">
        <CoinAvatar
          imageUrl={d?.imageUrl}
          symbol={d?.symbol ?? coin.ca.slice(0, 4)}
          hue={hue}
        />
        <div className="min-w-0">
          <p className="truncate font-bold text-heading">
            {d?.name ?? "…"}
            {d?.symbol && (
              <span className="ml-1.5 text-xs font-medium text-muted">
                {d.symbol}
              </span>
            )}
          </p>
          <p className="mt-0.5 font-mono text-[11px] uppercase text-muted">
            {d ? `${d.chainId} · ${d.dexId}` : coin.ca.slice(0, 12) + "…"}
          </p>
        </div>
      </div>

      {/* 价格行 */}
      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-xl font-bold tabular-nums tracking-tight text-heading">
          {d ? formatPrice(d.priceUsd) : "—"}
        </span>
        {d && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
              up
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
          >
            {up ? "+" : ""}
            {d.change24h.toFixed(2)}% · 24h
          </span>
        )}
      </div>

      {/* 一句话评价（用户的关注理由） */}
      {coin.comment && (
        <p className="mt-3 flex-1 border-l-2 border-accent/40 pl-3 text-[13px] leading-relaxed text-muted dark:border-accent-mint/40">
          {coin.comment}
        </p>
      )}

      {/* 底部：CA + K 线链接 */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
        <span className="truncate font-mono text-[11px] text-muted" title={coin.ca}>
          {coin.ca.slice(0, 8)}…{coin.ca.slice(-6)}
        </span>
        {d?.url && (
          <a
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-medium text-accent hover:underline dark:text-accent-mint"
          >
            {t.watchlist.chart} ↗
          </a>
        )}
      </div>
    </article>
  );
}
