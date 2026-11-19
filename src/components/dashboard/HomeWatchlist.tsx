"use client";

/**
 * HomeWatchlist.tsx —— 首页「Track Record」区块
 * 一排三张：最新 2 个关注币的大卡片（行情/市值/24H 走势/最新研究日志/复制 CA）
 * + 第 3 张「查看完整看板」入口卡。大卡可点标题进看板详情，K线 ↗ 跳 DexScreener。
 */

import Link from "next/link";
import { useState } from "react";
import CoinAvatar from "@/components/CoinAvatar";
import { avatarHue, formatMcap, formatPrice } from "@/lib/coin-format";
import type { WatchCoinWithData } from "@/lib/watchlist";
import type { Dictionary, Locale } from "@/lib/i18n";

const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

/** 日志正文去 Markdown 记号的纯文本摘要 */
function plainSnippet(md: string, max = 72) {
  const text = md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*`_|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** 24H 收盘序列 → SVG 折线（手绘风：墨色折线 + 珊瑚橙淡填充） */
function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (!data || data.length < 2)
    return <div className="h-[52px] text-[11px] text-muted">24H 走势暂不可用</div>;
  const w = 260;
  const h = 52;
  const pad = 3;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = (w - pad * 2) / (data.length - 1);
  const pts = data.map(
    (v, i) =>
      `${(pad + i * step).toFixed(1)},${(h - pad - ((v - min) / range) * (h - pad * 2)).toFixed(1)}`
  );
  const stroke = up ? "#16a34a" : "#ff5b3a";
  const area = `${pad},${h - pad} ${pts.join(" ")} ${w - pad},${h - pad}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-[52px] w-full"
      role="img"
      aria-label={up ? "24 小时上涨走势" : "24 小时下跌走势"}
    >
      <polygon points={area} fill={up ? "rgba(22,163,74,.10)" : "rgba(255,91,58,.10)"} />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** 手绘「一路向上」装饰走势图：绿色折线爬到右上角 + 珊瑚橙箭头，描线动画 */
function RisingTrend() {
  const pts =
    "8,74 34,68 58,72 84,56 110,62 136,42 162,48 186,26 206,14";
  const area = `8,84 ${pts} 212,84`;
  return (
    <svg
      viewBox="0 0 220 88"
      className="dash-trend mt-4 w-full"
      role="img"
      aria-label="持续向上的走势示意"
    >
      {/* 淡网格点，手绘纸感 */}
      <g fill="#2a2230" opacity=".18">
        <circle cx="34" cy="80" r="1.3" /><circle cx="84" cy="80" r="1.3" />
        <circle cx="136" cy="80" r="1.3" /><circle cx="186" cy="80" r="1.3" />
      </g>
      <polygon points={area} fill="rgba(22,163,74,.10)" />
      <polyline
        className="line"
        points={pts}
        fill="none"
        stroke="#16a34a"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* 末端箭头：指向右上方 */}
      <path
        d="M196 22 L212 10 M212 10 h-8 M212 10 v8"
        fill="none"
        stroke="#ff5b3a"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 复制 CA 按钮：点击复制，1.6s 后恢复 */
function CopyCa({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      /* 剪贴板不可用时退化为选中文本 */
      const ta = document.createElement("textarea");
      ta.value = address;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className={`rounded-[6px_10px_6px_12px] border-[1.5px] px-3 py-1.5 font-mono text-[11px] transition-all duration-200 ${
        copied
          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-dashed border-[#2a2230]/60 text-[#2a2230]/80 hover:border-solid hover:border-[#ff5b3a] hover:text-[#ff5b3a]"
      }`}
      aria-live="polite"
    >
      {copied ? "✓ 已复制" : "📋 复制 CA"}
    </button>
  );
}

export default function HomeWatchlist({
  coins,
  locale,
  t,
  activities = {},
  logs = {},
  sparks = {},
}: {
  coins: WatchCoinWithData[];
  locale: Locale;
  t: Dictionary;
  /** 投研活跃度：address → { 最近动态日期, 动态条数(日志+研报+事件) } */
  activities?: Record<string, { latest: string; newCount: number }>;
  /** 每个币最新一条研究日志 */
  logs?: Record<string, { date: string; title: string; body: string } | null>;
  /** 24H 收盘价序列（GeckoTerminal），时间正序 */
  sparks?: Record<string, number[]>;
}) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
      {coins.map((c) => {
        const since =
          c.data?.priceUsd && c.followPrice
            ? (c.data.priceUsd / c.followPrice - 1) * 100
            : null;
        const chg = c.data?.change24h ?? 0;
        const up24 = chg >= 0;
        const act = activities[c.address];
        const log = logs[c.address];
        const spark = sparks[c.address] ?? [];
        return (
          <article
            key={c.address}
            className="group relative flex flex-col rounded-[16px_20px_14px_22px] border-[1.5px] border-dashed border-[#2a2230] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-solid hover:border-[#ff5b3a] hover:shadow-[6px_8px_0_rgba(92,42,82,.12)]"
          >
            {/* 动态角标 */}
            {act && act.newCount > 0 && (
              <span className="absolute -right-2 -top-2 z-10 flex items-center gap-1 rounded-full bg-[#ff5b3a] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                新 · {act.newCount}
              </span>
            )}
            {act && act.newCount === 0 &&
              Date.now() - new Date(act.latest).getTime() < 7 * 864e5 && (
                <span className="absolute -right-2 -top-2 z-10 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                  新关注
                </span>
              )}

            {/* 头部：头像 + 名称 + 链 */}
            <div className="flex items-center gap-3">
              <CoinAvatar
                imageUrl={c.data?.imageUrl}
                symbol={c.data?.symbol ?? c.address.slice(0, 4)}
                hue={avatarHue(c.address)}
                size={44}
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/${locale}/dashboard?coin=${c.address}`}
                  className="block truncate text-[15px] font-semibold text-heading underline-offset-4 transition-colors hover:text-[#ff5b3a] hover:underline"
                >
                  {c.data?.name}
                </Link>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                  <span className="font-mono font-semibold uppercase">{c.data?.symbol}</span>
                  <span aria-hidden="true">·</span>
                  <span className="rounded-full border border-[#2a2230]/25 px-1.5 py-px font-mono text-[10px]">
                    {c.data?.chainId}
                  </span>
                </div>
              </div>
            </div>

            {/* 行情行：价格 / 24H / 关注以来 */}
            <div className="mt-4 flex flex-wrap items-end justify-between gap-x-2 gap-y-2">
              <div>
                <div className="text-xl font-bold tabular-nums tracking-tight text-heading">
                  {formatPrice(c.data?.priceUsd ?? 0)}
                </div>
                <div
                  className={`mt-0.5 text-xs tabular-nums ${
                    up24
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {fmtPct(chg)} 24H
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] tracking-wide text-muted">市值</div>
                <div className="text-sm font-semibold tabular-nums text-heading">
                  {formatMcap(c.data?.marketCap)}
                </div>
              </div>
              {since !== null && (
                <span
                  className={`rounded-lg px-2 py-1 text-xs font-bold tabular-nums ${
                    since >= 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}
                  title="关注以来涨跌幅"
                >
                  {fmtPct(since)}
                </span>
              )}
            </div>

            {/* 24H 走势 */}
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[10px] tracking-wide text-muted">
                <span>24H 走势</span>
                {act && <span>更新于 {act.latest}</span>}
              </div>
              <Sparkline data={spark} up={up24} />
            </div>

            {/* 最新研究日志 */}
            {log && (
              <div className="mt-3 border-t border-dashed border-[#2a2230]/25 pt-3">
                <div className="text-[10px] tracking-wide text-muted">
                  ✎ 最新日志 · {log.date}
                </div>
                <Link
                  href={`/${locale}/dashboard?coin=${c.address}`}
                  className="mt-1 block text-[12.5px] leading-relaxed text-[#2a2230]/85 transition-colors hover:text-[#ff5b3a]"
                >
                  {log.title ? (
                    <span className="font-medium">「{log.title}」 </span>
                  ) : null}
                  {plainSnippet(log.body)}
                </Link>
              </div>
            )}

            {/* 底部操作 */}
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-dashed border-[#2a2230]/25 pt-3">
              <CopyCa address={c.address} />
              {c.data?.url && (
                <a
                  href={c.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] text-[#2a2230]/70 underline-offset-4 transition-colors hover:text-[#ff5b3a] hover:underline"
                >
                  K线 ↗
                </a>
              )}
            </div>
          </article>
        );
      })}

      {/* 看板入口卡片 */}
      <Link
        href={`/${locale}/dashboard`}
        className="group flex min-h-[280px] flex-col rounded-[16px_20px_14px_22px] border-[1.5px] border-dashed border-[#5c2a52] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-solid hover:border-[#ff5b3a] hover:shadow-[6px_8px_0_rgba(92,42,82,.12)]"
      >
        <div>
          <div className="font-serif text-[17px] font-bold text-[#5c2a52]">
            {t.dashboard.title}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            {t.watchlist.intro}
          </p>
        </div>
        <div className="flex flex-1 items-center">
          <RisingTrend />
        </div>
        <div className="w-full border-t border-dashed border-[#2a2230]/25 pt-3">
          <span className="inline-block font-mono text-[12px] text-[#ff5b3a] transition-transform duration-200 group-hover:translate-x-1">
            {t.watchlist.viewDashboard} →
          </span>
        </div>
      </Link>
    </div>
  );
}
