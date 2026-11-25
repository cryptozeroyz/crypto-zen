"use client";

/**
 * HomeTrackRecord.tsx —— 首页「Track Record」区块（calls 数据源）
 * 一排三张：最近 2 条判断的大卡片 + 「查看完整看板」入口卡。
 * 卡片突出「判断时间 + 判断以来表现」；24H 涨跌幅不再显眼。
 * 点击卡片任意处进入详情页（内部链接/按钮保持原行为）。
 */

import Link from "next/link";
import { useState } from "react";
import CoinAvatar from "@/components/CoinAvatar";
import { DisclosureBadges } from "@/components/dashboard/TrackRecordClient";
import { disclosureLabelsOf } from "@/components/dashboard/tr";
import { getTr, stanceLabel, verdictLabel, fmtCalledAt, STANCE_BADGE, VERDICT_BADGE, type Tr } from "@/components/dashboard/tr";
import { avatarHue, formatMcap, formatPrice } from "@/lib/coin-format";
import { statusOf } from "@/lib/calls-stats";
import type { CallRecord } from "@/lib/calls";
import type { Locale } from "@/lib/i18n";

export interface CurrentPrice {
  priceUsd?: number;
  mcap?: number;
  change24h?: number;
  imageUrl?: string;
}

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

export default function HomeTrackRecord({
  records,
  locale,
  currentMap = {},
  viewAllHref,
  boardTitle,
}: {
  records: CallRecord[];
  locale: Locale;
  /** CA → 现价（服务端预取） */
  currentMap?: Record<string, CurrentPrice>;
  viewAllHref: string;
  boardTitle: string;
}) {
  const tr: Tr = getTr(locale);

  /* 5 币 + 1 看板入口：桌面两排三个（3+3），卡片紧凑 */
  return (
    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {records.map(({ call, updates, outcome }) => {
        const cur = currentMap[call.contractAddress];
        const curPrice = outcome ? outcome.priceAtClose : cur?.priceUsd;
        const perf =
          curPrice !== undefined
            ? (curPrice / call.priceAtCall - 1) * 100
            : null;
        const curMcap = outcome ? outcome.mcapAtClose : cur?.mcap;
        const lastUpdate = updates[updates.length - 1] ?? null;
        const status = statusOf({ call, updates, outcome });
        const detailHref = `/${locale}/dashboard/${call.id}`;

        const card =
          "group relative flex flex-col rounded-[16px_20px_14px_22px] border-[1.5px] border-dashed border-[#2a2230] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-solid hover:border-[#ff5b3a] hover:shadow-[6px_8px_0_rgba(92,42,82,.12)]";

        return (
          <article
            key={call.id}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a,button")) return;
              window.location.href = detailHref;
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              if ((e.target as HTMLElement).closest("a,button")) return;
              window.location.href = detailHref;
            }}
            className={`${card} cursor-pointer !p-4`}
          >
            {/* 头部：头像 + 名称 + stance */}
            <div className="flex items-center gap-3">
              <CoinAvatar
                imageUrl={cur?.imageUrl}
                symbol={call.symbol}
                hue={avatarHue(call.contractAddress)}
                size={36}
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={detailHref}
                  className="block truncate text-[15px] font-semibold text-heading underline-offset-4 transition-colors hover:text-[#ff5b3a] hover:underline"
                >
                  {call.tokenName}
                </Link>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  <span className="font-mono font-semibold uppercase">{call.symbol}</span>
                  <span className="rounded-full border border-line px-1.5 py-px font-mono text-[10px]">{call.chain}</span>
                  <span className={`rounded-full border px-1.5 py-px text-[10px] font-semibold ${STANCE_BADGE[call.stance]}`}>
                    {stanceLabel(call.stance, tr)}
                  </span>
                </div>
              </div>
            </div>

            {/* 判断时间 + 判断以来表现（最醒目） */}
            <div className="mt-3 flex items-end justify-between gap-2">
              <div>
                <div className="text-[10px] tracking-wide text-muted">{tr.calledAt}</div>
                <div className="mt-0.5 text-[13px] font-semibold tabular-nums text-heading">
                  {fmtCalledAt(call.calledAt)}
                </div>
                <div className="mt-0.5 text-[10.5px] tabular-nums text-muted">
                  {formatPrice(call.priceAtCall)}
                  <span aria-hidden="true"> · </span>M{formatMcap(call.mcapAtCall)}
                </div>
              </div>
              <div className="text-right">
                {perf !== null ? (
                  <div
                    className={`text-[19px] font-bold leading-none tabular-nums ${
                      perf >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {perf >= 0 ? "+" : ""}
                    {perf.toFixed(1)}%
                  </div>
                ) : (
                  <div className="text-lg font-bold text-muted">—</div>
                )}
                <div className="mt-1 text-[10px] tracking-wide text-muted">{tr.performance}</div>
                {curPrice !== undefined && !outcome && (
                  <div className="mt-0.5 font-mono text-[10.5px] tabular-nums text-muted">
                    现价 {formatPrice(curPrice)}
                  </div>
                )}
              </div>
            </div>

            {/* 状态/结论 + 披露标签 */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {outcome ? (
                <span className={`rounded-full border px-2 py-px text-[10.5px] font-bold ${VERDICT_BADGE[outcome.verdict]}`}>
                  {verdictLabel(outcome.verdict, tr)}
                </span>
              ) : (
                <span className="rounded-full border border-line px-2 py-px text-[10.5px] font-semibold text-muted">
                  {status === "expired" ? tr["status.expired"] : tr["status.open"]}
                </span>
              )}
              <DisclosureBadges record={{ call, updates, outcome }} labels={disclosureLabelsOf(tr)} />
              {call.isHistorical && (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-px text-[10px] text-amber-700 dark:text-amber-400">
                  ⚑ {tr.historical}
                </span>
              )}
            </div>

            {/* 判断依据（=thesis） */}
            <div className="mt-3 border-t border-dashed border-[#2a2230]/25 pt-3">
              <div className="text-[10px] tracking-wide text-muted">✦ {tr.source}</div>
              <Link
                href={detailHref}
                className="mt-1 block text-[12.5px] leading-relaxed text-[#2a2230]/85 transition-colors hover:text-[#ff5b3a]"
              >
                <span className="line-clamp-2">{call.thesis}</span>
              </Link>
            </div>

            {/* 最新 Update（无则占位，保持结构统一） */}
            <div className="mt-3 border-t border-dashed border-[#2a2230]/25 pt-3">
              {lastUpdate ? (
                <>
                  <div className="text-[10px] tracking-wide text-muted">
                    ✎ {tr.updates} · {fmtCalledAt(lastUpdate.at)}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-[#2a2230]/85">
                    {lastUpdate.type === "thesis-change" ? `↺ ${tr.thesisChanged}：` : ""}
                    {plainSnippet(lastUpdate.content)}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-[10px] tracking-wide text-muted">✎ {tr.updates} · —</div>
                  <p className="mt-1 font-serif text-[12.5px] italic text-muted/80">
                    {tr.noUpdates}
                  </p>
                </>
              )}
            </div>

            {/* 弹性占位 + 底部操作 */}
            <div className="min-h-4 flex-1" aria-hidden="true" />
            <div className="flex items-center justify-between gap-2 border-t border-dashed border-[#2a2230]/25 pt-3">
              <CopyCa address={call.contractAddress} />
              <Link
                href={detailHref}
                className="font-mono text-[11px] text-[#2a2230]/70 underline-offset-4 transition-colors hover:text-[#ff5b3a] hover:underline"
              >
                {tr.viewDetail} →
              </Link>
            </div>
          </article>
        );
      })}

      {/* 看板入口卡片 */}
      <Link
        href={viewAllHref}
        className="group flex min-h-[220px] flex-col rounded-[16px_20px_14px_22px] border-[1.5px] border-dashed border-[#5c2a52] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-solid hover:border-[#ff5b3a] hover:shadow-[6px_8px_0_rgba(92,42,82,.12)]"
      >
        <div>
          <div className="font-serif text-[17px] font-bold text-[#5c2a52]">{boardTitle}</div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            {locale === "en"
              ? "Every call, update and outcome — the full log."
              : "每一次判断、更新与复盘，全部留痕。"}
          </p>
        </div>
        <div className="flex flex-1 items-center">
          <RisingTrend />
        </div>
        <div className="w-full border-t border-dashed border-[#2a2230]/25 pt-3">
          <span className="inline-block font-mono text-[12px] text-[#ff5b3a] transition-transform duration-200 group-hover:translate-x-1">
            {locale === "en" ? "View all" : "查看完整看板"} →
          </span>
        </div>
      </Link>
    </div>
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

/** 手绘「一路向上」装饰走势图 */
function RisingTrend() {
  const pts = "8,74 34,68 58,72 84,56 110,62 136,42 162,48 186,26 206,14";
  const area = `8,84 ${pts} 212,84`;
  return (
    <svg viewBox="0 0 220 88" className="dash-trend mt-4 w-full" role="img" aria-label="持续向上的走势示意">
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
