"use client";

/**
 * WatchlistSection.tsx —— 首页关注列表区块（客户端）
 * 卡片与文章卡同尺寸（16:9 头图 + 正文 + 底部栏）：
 * - 头图：渐变底 + 大头像；左上「持仓/观望」徽章；右上「市值」徽章
 * - 正文：名称、链 · 交易所、一句话评价（超长点击浮窗展开全文）
 * - 底部：CA 一键复制（带反馈）、关注日期、K 线链接
 */

import { useEffect, useState } from "react";
import type { WatchCoinWithData } from "@/lib/watchlist";
import { formatMcap, avatarHue } from "@/lib/coin-format";
import { formatDate } from "@/lib/utils";
import type { Dictionary, Locale } from "@/lib/i18n";
import CoinAvatar from "@/components/CoinAvatar";

interface WatchlistSectionProps {
  coins: WatchCoinWithData[];
  locale: Locale;
  t: Dictionary;
}

/** 复制文本（clipboard API + 兜底） */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export default function WatchlistSection({ coins, locale, t }: WatchlistSectionProps) {
  // 浮窗展开的评论对象
  const [expanded, setExpanded] = useState<WatchCoinWithData | null>(null);
  // 已复制的 CA（显示反馈用）
  const [copied, setCopied] = useState<string | null>(null);

  // Esc 关闭浮窗
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const onCopy = async (ca: string) => {
    const ok = await copyText(ca);
    if (ok) {
      setCopied(ca);
      window.setTimeout(() => setCopied((c) => (c === ca ? null : c)), 1600);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {coins.map((coin) => {
          const d = coin.data;
          const hue = avatarHue(coin.ca);
          const isLong = coin.comment.length > 72;
          return (
            <article
              key={coin.ca}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/40"
            >
              {/* 16:9 头图：渐变底 + 大头像 + 持仓/市值徽章 */}
              <div className="relative flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-accent to-accent-deep">
                <CoinAvatar
                  imageUrl={d?.imageUrl}
                  symbol={d?.symbol ?? coin.ca.slice(0, 4)}
                  hue={hue}
                  size={76}
                />
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    coin.holding
                      ? "bg-white text-accent-deep"
                      : "border border-white/50 text-white/90"
                  }`}
                >
                  {coin.holding ? t.watchlist.holding : t.watchlist.notHolding}
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-medium tabular-nums text-white backdrop-blur-sm">
                  {t.watchlist.mcap} {formatMcap(d?.fdv)}
                </span>
              </div>

              {/* 正文 */}
              <div className="flex flex-1 flex-col p-4">
                <div>
                  <span className="font-bold text-heading">
                    {d?.name ?? "…"}
                    {d?.symbol && (
                      <span className="ml-1.5 text-xs font-normal text-muted">
                        {d.symbol}
                      </span>
                    )}
                  </span>
                  <p className="mt-0.5 font-mono text-[11px] uppercase text-muted">
                    {d ? `${d.chainId} · ${d.dexId}` : coin.ca.slice(0, 12) + "…"}
                  </p>
                </div>

                {/* 一句话评价（超长可展开） */}
                <div className="mt-2.5 flex-1">
                  <p className="border-l-2 border-accent/40 pl-2.5 text-[13px] leading-relaxed text-muted dark:border-accent-mint/40 line-clamp-3">
                    {coin.comment}
                  </p>
                  {isLong && (
                    <button
                      type="button"
                      onClick={() => setExpanded(coin)}
                      className="mt-1.5 text-xs font-medium text-accent hover:underline dark:text-accent-mint"
                    >
                      {t.watchlist.expand} →
                    </button>
                  )}
                </div>

                {/* 底部：CA 复制 + 关注日期 + K 线 */}
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
                  <button
                    type="button"
                    onClick={() => void onCopy(coin.ca)}
                    title={coin.ca}
                    className="min-w-0 truncate font-mono text-[11px] text-muted transition-colors hover:text-accent dark:hover:text-accent-mint"
                  >
                    {copied === coin.ca
                      ? `✓ ${t.watchlist.copied}`
                      : `${coin.ca.slice(0, 6)}…${coin.ca.slice(-4)} ⧉`}
                  </button>
                  <span className="flex shrink-0 items-center gap-2 text-[11px] text-muted">
                    {coin.addedAt && (
                      <span className="hidden xl:inline">
                        {t.watchlist.watchedAt} {formatDate(coin.addedAt, locale)}
                      </span>
                    )}
                    {d?.url && (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-accent hover:underline dark:text-accent-mint"
                      >
                        {t.watchlist.chart} ↗
                      </a>
                    )}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* 浮窗：展开完整评价 */}
      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={expanded.data?.name ?? expanded.data?.symbol}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setExpanded(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <CoinAvatar
                imageUrl={expanded.data?.imageUrl}
                symbol={expanded.data?.symbol ?? "?"}
                hue={avatarHue(expanded.ca)}
                size={40}
              />
              <div>
                <p className="font-bold text-heading">
                  {expanded.data?.name ?? "…"}
                  {expanded.data?.symbol && (
                    <span className="ml-1.5 text-xs font-normal text-muted">
                      {expanded.data.symbol}
                    </span>
                  )}
                </p>
                <p className="font-mono text-[11px] uppercase text-muted">
                  {expanded.data
                    ? `${expanded.data.chainId} · ${expanded.data.dexId}`
                    : expanded.ca}
                </p>
              </div>
              <span
                className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  expanded.holding
                    ? "bg-accent/10 text-accent dark:text-accent-mint"
                    : "border border-line text-muted"
                }`}
              >
                {expanded.holding ? t.watchlist.holding : t.watchlist.notHolding}
              </span>
            </div>

            <p className="mt-5 border-l-2 border-accent/40 pl-3 text-[15px] leading-relaxed text-ink dark:border-accent-mint/40">
              {expanded.comment}
            </p>

            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs text-muted">
                {t.watchlist.watchedAt}{" "}
                {formatDate(expanded.addedAt, locale)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void onCopy(expanded.ca)}
                  className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-heading hover:text-heading"
                >
                  {copied === expanded.ca
                    ? `✓ ${t.watchlist.copied}`
                    : t.watchlist.copyCa}
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded(null)}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
                >
                  {t.watchlist.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
