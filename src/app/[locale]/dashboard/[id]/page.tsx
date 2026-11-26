/**
 * [locale]/dashboard/[id] —— Track Record 详情页
 * 时间线布局：判断快照 → 更新记录 → 复盘结论；
 * 固定侧栏：利益披露 / invalidation / 成功标准 / proofUrl；
 * 底部固定免责声明。价格走势图标出判断时间与各 Update。
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import CallKline from "@/components/dashboard/CallKline";
import CopyCaButton from "@/components/dashboard/CopyCaButton";
import ShareCallButton from "@/components/dashboard/ShareCallButton";
import { DisclosureBadges } from "@/components/dashboard/TrackRecordClient";
import { disclosureLabelsOf, fmtCalledAt, posActionLabel } from "@/components/dashboard/tr";
import {
  getTr,
  stanceLabel,
  verdictLabel,
  ntLabel,
  mistakeLabel,
  STANCE_BADGE,
  VERDICT_BADGE,
} from "@/components/dashboard/tr";
import { readCallRecords } from "@/lib/calls-store";
import { activityAt, statusOf } from "@/lib/calls-stats";
import { getAllPosts } from "@/lib/posts";
import { fetchCoinData } from "@/lib/watchlist";
import { formatMcap, formatPrice } from "@/lib/coin-format";
import { isLocale, locales, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  /* 构建期可能没有 calls.json，失败也不阻塞（ISR 按需生成） */
  let ids: string[] = [];
  try {
    const fs = require("fs");
    const raw = fs.readFileSync("content/calls.json", "utf8");
    ids = (JSON.parse(raw) as Array<{ call: { id: string } }>).map((r) => r.call.id);
  } catch {
    /* 空 */
  }
  return locales.flatMap((locale) => ids.map((id) => ({ locale, id })));
}

export const revalidate = 300;

export function generateMetadata({
  params,
}: {
  params: { locale: string; id: string };
}): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getTr(locale);
  return {
    title: `${t.title} · ${params.id}`,
    alternates: {
      canonical: `/${locale}/dashboard/${params.id}`,
      languages: {
        zh: `/zh/dashboard/${params.id}`,
        en: `/en/dashboard/${params.id}`,
        "x-default": `/zh/dashboard/${params.id}`,
      },
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function CallDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const tr = getTr(locale);

  const records = await readCallRecords();
  const record = records.find((r) => r.call.id === params.id);
  if (!record) notFound();

  const { call, outcome } = record;
  /* 更新记录倒序（最新在前） */
  const updates = [...record.updates].sort((a, b) => b.at.localeCompare(a.at));
  const status = statusOf(record);
  const data = await fetchCoinData(call.contractAddress, {
    pairAddress: call.pairAddress,
  }).catch(() => null);

  /* 关联研报：存储的 relatedReports + 按 tokens 动态匹配（后台新发研报自动出现） */
  const sym = call.symbol.toLowerCase();
  const addr = call.contractAddress.toLowerCase();
  const allPosts = getAllPosts(locale);
  const matchedSlugs = allPosts
    .filter((pt) =>
      (pt.tokens ?? []).some((tk) => {
        const t = tk.trim().toLowerCase();
        return t.length > 0 && (t === sym || t === addr);
      })
    )
    .map((pt) => pt.slug);
  const relatedSlugs = [...new Set([...call.relatedReports, ...matchedSlugs])];
  const relatedPosts = relatedSlugs
    .map((slug) => allPosts.find((pt) => pt.slug === slug))
    .filter((pt): pt is NonNullable<typeof pt> => Boolean(pt));

  const calledAtTs = Date.parse(call.calledAt);
  const curPrice = outcome ? outcome.priceAtClose : data?.priceUsd;
  const perf =
    curPrice !== null && curPrice !== undefined
      ? (curPrice / call.priceAtCall - 1) * 100
      : null;

  const dexUrl = data?.url ?? `https://dexscreener.com/${call.chain}/${call.contractAddress}`;

  return (
    <Container size="site" className="py-10 sm:py-14">
      {/* 头部 */}
      <Link
        href={`/${locale}/dashboard`}
        className="text-xs text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
      >
        {tr.back}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {data?.imageUrl ? (
              <img src={data.imageUrl} alt={`${call.tokenName} logo`} className="h-9 w-9 rounded-full border border-line object-cover" />
            ) : null}
            <h1 className="font-serif text-3xl font-bold text-[#5c2a52]">{call.tokenName}</h1>
            <CopyCaButton address={call.contractAddress} />
            <ShareCallButton id={call.id} symbol={call.symbol} />
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${STANCE_BADGE[call.stance]}`}>
              {stanceLabel(call.stance, tr)}
            </span>
            {outcome ? (
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${VERDICT_BADGE[outcome.verdict]}`}>
                {verdictLabel(outcome.verdict, tr)}
              </span>
            ) : (
              <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold text-muted">
                {status === "expired" ? tr["status.expired"] : tr["status.open"]}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="font-mono font-semibold uppercase">{call.symbol}</span>
            <span className="rounded-full border border-line px-1.5 py-px font-mono text-[10px]">{call.chain}</span>
            <span>{tr.calledAt}: <span className="tabular-nums text-heading">{fmtCalledAt(call.calledAt)}</span></span>
            <span>{locale === "en" ? "Last updated" : "最近更新"}: <span className="tabular-nums text-heading">{fmtCalledAt(activityAt(record))}</span></span>
            {call.isHistorical && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-px text-amber-700 dark:text-amber-400">
                ⚑ {tr.historical}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold tabular-nums text-heading">
            {curPrice ? formatPrice(curPrice) : "—"}
          </div>
          {perf !== null && (
            <div className={`text-sm font-semibold tabular-nums ${perf >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {perf >= 0 ? "+" : ""}{perf.toFixed(1)}% {tr.performance}
            </div>
          )}
        </div>
      </div>

      {/* K 线：DexScreener 同款内核，标出判断与每次更新的时间点 */}
      {data?.pairAddress && data.chainId && (
        <div className="mt-6 rounded-2xl border border-line bg-card p-4">
          <CallKline
            chain={data.chainId}
            pair={data.pairAddress}
            marks={[
              { time: Math.floor(calledAtTs / 1000), kind: "call" },
              ...updates.map((u) => ({
                time: Math.floor(Date.parse(u.at) / 1000),
                kind:
                  u.type === "thesis-change" ? ("thesis" as const)
                  : u.type === "position-change" ? u.positionAction === "add" ? ("add" as const) : u.positionAction === "exit" ? ("exit" as const) : ("reduce" as const)
                  : u.type === "closed" ? ("outcome" as const)
                  : ("note" as const),
              })),
              ...(outcome ? [{ time: Math.floor(Date.parse(outcome.closedAt) / 1000), kind: "outcome" as const }] : []),
            ]}
          />
          <p className="mt-2 text-[10px] text-muted">
            K 线数据来自 GeckoTerminal · 标记已对齐到最近时间粒度
          </p>
        </div>
      )}

      {/* 主体：时间线 + 固定侧栏 */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* 时间线 */}
        <div className="space-y-5">
          {/* 判断快照 */}
          <section className="rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#2a2230] bg-white p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              ◉ {tr.callSnapshot}
            </h2>
            {call.thesis !== call.narrative && (
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                <span className="font-semibold text-heading">{call.narrative}</span>
              </p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-heading">{call.thesis}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <Snapshot label={tr.atCall} value={formatPrice(call.priceAtCall)} />
              <Snapshot label="MCap" value={formatMcap(call.mcapAtCall)} />
              {call.liquidityAtCall && <Snapshot label="Liquidity" value={formatMcap(call.liquidityAtCall)} />}
              {call.holdersAtCall && <Snapshot label="Holders" value={String(call.holdersAtCall)} />}
            </div>
            {call.catalysts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {call.catalysts.map((c) => (
                  <span key={c} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-400">🧨 {c}</span>
                ))}
              </div>
            )}
            {call.risks.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {call.risks.map((r) => (
                  <span key={r} className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-700 dark:text-red-400">⚠️ {r}</span>
                ))}
              </div>
            )}
            <div className="mt-3 text-xs text-muted">
              <span>{ntLabel(call.narrativeType, tr)}</span>
              <span aria-hidden="true"> · </span>
              <span>{({ intraday: "⏱ 日内", days: "📅 数日", weeks: "🗓 数周", months: "🗓 数月" } as Record<string, string>)[call.horizon] ?? call.horizon}</span>
              {call.priceSource === "manual" && <span className="ml-2 rounded bg-amber-500/10 px-1.5 py-px text-amber-700 dark:text-amber-400">✋ {tr.dataManual}</span>}
            </div>
          </section>

          {/* 更新记录 */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              ✎ {tr.updates}（{updates.length}）
            </h2>
            {updates.length === 0 ? (
              <p className="text-xs text-muted">{tr.noUpdates}</p>
            ) : (
              <div className="relative space-y-3 pl-5">
                <span className="absolute bottom-2 left-[5px] top-2 w-0.5 bg-line" aria-hidden="true" />
                {updates.map((u, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
                    <div className="rounded-xl border border-line bg-card px-3.5 py-2.5">
                      <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted">
                        <span className="font-semibold text-heading">
                          {u.type === "thesis-change" ? `↺ ${tr.thesisChanged}` : u.type === "position-change" ? `⇄ ${tr.positionChanged}${u.positionAction ? ` · ${posActionLabel(u.positionAction, tr)}` : ""}` : u.type === "closed" ? `■ ${tr.closedNote}` : `✎ ${tr.note}`}
                        </span>
                        <span className="tabular-nums">{fmtCalledAt(u.at)}</span>
                        {u.priceAt && <span className="ml-auto font-mono tabular-nums">@{formatPrice(u.priceAt)}</span>}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-heading">{u.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 复盘结论 */}
          {outcome && (
            <section className="rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#5c2a52] bg-white p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                ⚖ {tr.outcome}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className={`rounded-full border px-3 py-1 text-sm font-bold ${VERDICT_BADGE[outcome.verdict]}`}>
                  {verdictLabel(outcome.verdict, tr)}
                </span>
                <span className={`text-sm font-semibold tabular-nums ${outcome.returnAtClose >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {outcome.returnAtClose >= 0 ? "+" : ""}{outcome.returnAtClose}%
                </span>
                <span className="text-xs tabular-nums text-muted">
                  {tr.closedAt}: {fmtCalledAt(outcome.closedAt)}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <Snapshot label={tr.maxMcap} value={formatMcap(outcome.maxMcapAfterCall)} />
                <Snapshot label={tr.minMcap} value={formatMcap(outcome.minMcapAfterCall)} />
                <Snapshot label={tr.maxDD} value={`-${outcome.maxDrawdown}%`} />
                <Snapshot
                  label={tr.mistakeType}
                  value={outcome.mistakeType ? mistakeLabel(outcome.mistakeType, locale) : "—"}
                />
              </div>
              <p className={`mt-3 inline-block rounded-full border px-2.5 py-0.5 text-[11px] ${outcome.invalidationTriggered ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400" : "border-line text-muted"}`}>
                {outcome.invalidationTriggered ? `⚠ ${tr.invalidationHit}` : tr.invalidationNo}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-heading">{outcome.lessons}</p>
            </section>
          )}
        </div>

        {/* 固定侧栏 */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#2a2230] bg-white p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">{tr.disclosure}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <DisclosureBadges record={record} labels={disclosureLabelsOf(tr)} />
            </div>
            <dl className="mt-3 space-y-1.5 text-xs">
              {call.disclosure.entryPrice && (
                <div className="flex justify-between"><dt className="text-muted">{tr.entryPrice}</dt><dd className="font-mono tabular-nums">{formatPrice(call.disclosure.entryPrice)}</dd></div>
              )}
              {call.disclosure.sizeTier && (
                <div className="flex justify-between"><dt className="text-muted">Size</dt><dd>{{ small: tr.sizeSmall, medium: tr.sizeMedium, large: tr.sizeLarge }[call.disclosure.sizeTier]}</dd></div>
              )}
              {call.disclosure.sourceOfIdea && (
                <div className="flex justify-between gap-2"><dt className="text-muted">来源</dt><dd className="text-right">{call.disclosure.sourceOfIdea}</dd></div>
              )}
            </dl>
          </div>

          <div className="rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#ff5b3a]/60 bg-white p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#ff5b3a]">⚠ {tr.invalidation}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-heading">{call.invalidation}</p>
          </div>

          {call.successCriteria && (
            <div className="rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#2a2230] bg-white p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">◎ {tr.successCriteria}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-heading">{call.successCriteria}</p>
            </div>
          )}

          {(call.targetMcap || call.stopMcap) && (
            <div className="rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#2a2230] bg-white p-4">
              <dl className="space-y-1.5 text-xs">
                {call.targetMcap && <div className="flex justify-between"><dt className="text-muted">🎯 {tr.targetMcap}</dt><dd className="font-mono tabular-nums">{formatMcap(call.targetMcap)}</dd></div>}
                {call.stopMcap && <div className="flex justify-between"><dt className="text-muted">🛑 {tr.stopMcap}</dt><dd className="font-mono tabular-nums">{formatMcap(call.stopMcap)}</dd></div>}
              </dl>
            </div>
          )}

          {call.proofUrl && (
            <a href={call.proofUrl} target="_blank" rel="noopener noreferrer"
              className="block rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#2a2230] bg-white p-4 text-xs text-accent transition-colors hover:border-accent dark:text-accent-mint">
              🔗 {tr.proof} ↗
            </a>
          )}

          {relatedPosts.length > 0 && (
            <div className="rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#2a2230] bg-white p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">📄 {tr.related}</h3>
              <ul className="mt-2 space-y-1.5 text-xs">
                {relatedPosts.map((pt) => (
                  <li key={pt.slug}>
                    <Link href={`/${locale}/writing/${pt.slug}`} className="text-accent underline-offset-2 hover:underline dark:text-accent-mint">
                      {pt.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <a href={dexUrl} target="_blank" rel="noopener noreferrer"
            className="block rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#5c2a52] bg-white p-4 text-xs text-[#5c2a52] transition-colors hover:border-[#ff5b3a]">
            📈 DexScreener ↗
          </a>
        </aside>
      </div>

      {/* 底部固定免责声明 */}
      <div className="sticky bottom-3 z-30 mt-10">
        <p className="mx-auto w-max max-w-full rounded-full border border-line bg-paper/95 px-4 py-1.5 text-center text-[11px] text-muted shadow-md backdrop-blur">
          ⚖️ {tr.disclaimer}
        </p>
      </div>
    </Container>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-codebg px-2.5 py-1.5">
      <div className="text-[9.5px] tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 font-mono text-[12px] font-semibold tabular-nums text-heading">{value}</div>
    </div>
  );
}
