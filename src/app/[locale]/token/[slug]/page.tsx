/**
 * [locale]/token/[slug] —— 代币研究聚合页（稳定 URL，权重累积）
 * 按 symbol 聚合该代币的全部判断：最新判断为主视图（快照/K线/披露/证伪），
 * 历次判断与更新收在同一页；旧 /dashboard/[id] 已 308 到此。
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import CallKline from "@/components/dashboard/CallKline";
import CopyCaButton from "@/components/dashboard/CopyCaButton";
import ShareCallButton from "@/components/dashboard/ShareCallButton";
import { DisclosureBadges } from "@/components/dashboard/TrackRecordClient";
import {
  getTr,
  stanceLabel,
  verdictLabel,
  ntLabel,
  fmtCalledAt,
  posActionLabel,
  disclosureLabelsOf,
  STANCE_BADGE,
  VERDICT_BADGE,
} from "@/components/dashboard/tr";
import { readCallRecords } from "@/lib/calls-store";
import { activityAt, statusOf } from "@/lib/calls-stats";
import { fetchCoinData } from "@/lib/watchlist";
import { getAllPosts } from "@/lib/posts";
import { formatMcap, formatPrice, safeTokenSlug } from "@/lib/coin-format";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { siteConfig } from "@/lib/siteConfig";
import type { CallRecord } from "@/lib/calls";

export const revalidate = 300;

function recordsFor(slug: string, all: CallRecord[]): CallRecord[] {
  const s = slug.toLowerCase();
  return all
    .filter((r) => safeTokenSlug(r.call.symbol) === s)
    .sort((a, b) => activityAt(b).localeCompare(activityAt(a)));
}

export function generateStaticParams() {
  let symbols: string[] = [];
  try {
    const fs = require("fs");
    const raw = fs.readFileSync("content/calls.json", "utf8");
    const list = JSON.parse(raw) as Array<{ call: { symbol: string } }>;
    symbols = [...new Set(list.map((r) => safeTokenSlug(r.call.symbol)))];
  } catch {
    /* 空 */
  }
  return locales.flatMap((locale) => symbols.map((slug) => ({ locale, slug })));
}

export function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getTr(locale);
  const name = params.slug;
  const title =
    locale === "en"
      ? `${name.toUpperCase()} Research, Calls & Post-mortems`
      : `${name.toUpperCase()} 研究判断与复盘`;
  void t;
  return {
    title,
    description:
      locale === "en"
        ? `All research calls, updates and post-mortems for ${name.toUpperCase()} — logged and verifiable on CryptoZen.`
        : `${name.toUpperCase()} 的全部研究判断、更新与复盘记录，留痕可查。`,
    alternates: {
      canonical: `/${locale}/token/${params.slug}`,
      languages: {
        zh: `/zh/token/${params.slug}`,
        en: `/en/token/${params.slug}`,
        "x-default": `/zh/token/${params.slug}`,
      },
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function TokenPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const tr = getTr(locale);

  const all = await readCallRecords();
  const records = recordsFor(params.slug, all);
  if (records.length === 0) notFound();

  const latest = records[0];
  const { call } = latest;
  const status = statusOf(latest);
  const data = await fetchCoinData(call.contractAddress, {
    pairAddress: call.pairAddress,
  }).catch(() => null);

  /* 关联研报：全部判断的 relatedReports + tokens 动态匹配 */
  const sym = call.symbol.toLowerCase();
  const addrSet = new Set(records.map((r) => r.call.contractAddress.toLowerCase()));
  const allPosts = getAllPosts(locale);
  const matched = allPosts
    .filter((pt) =>
      (pt.tokens ?? []).some((tk) => {
        const t = tk.trim().toLowerCase();
        return t.length > 0 && (t === sym || addrSet.has(t));
      })
    )
    .map((pt) => pt.slug);
  const relatedSlugs = [
    ...new Set([...records.flatMap((r) => r.call.relatedReports), ...matched]),
  ];
  const relatedPosts = relatedSlugs
    .map((slug) => allPosts.find((pt) => pt.slug === slug))
    .filter((pt): pt is NonNullable<typeof pt> => Boolean(pt));

  const curPrice = latest.outcome ? latest.outcome.priceAtClose : data?.priceUsd;
  const perf =
    curPrice !== undefined
      ? latest.outcome
        ? latest.outcome.returnAtClose
        : (curPrice / call.priceAtCall - 1) * 100
      : null;

  /* K 线标记：全部判断 + 更新 */
  const marks = records.flatMap((r) => [
    { time: Math.floor(Date.parse(r.call.calledAt) / 1000), kind: "call" as const },
    ...r.updates.map((u) => ({
      time: Math.floor(Date.parse(u.at) / 1000),
      kind:
        u.type === "thesis-change" ? ("thesis" as const)
        : u.type === "position-change" ? u.positionAction === "add" ? ("add" as const) : u.positionAction === "exit" ? ("exit" as const) : ("reduce" as const)
        : u.type === "closed" ? ("outcome" as const)
        : ("note" as const),
    })),
    ...(r.outcome ? [{ time: Math.floor(Date.parse(r.outcome.closedAt) / 1000), kind: "outcome" as const }] : []),
  ]);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "en" ? "Home" : "首页", item: `${siteConfig.url}/${locale}` },
      { "@type": "ListItem", position: 2, name: tr.title, item: `${siteConfig.url}/${locale}/dashboard` },
      { "@type": "ListItem", position: 3, name: call.tokenName, item: `${siteConfig.url}/${locale}/token/${params.slug}` },
    ],
  };

  const dexUrl = data?.url ?? `https://dexscreener.com/${call.chain}/${call.contractAddress}`;

  return (
    <Container size="site" className="py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <Link href={`/${locale}/dashboard`} className="text-xs text-muted underline-offset-4 transition-colors hover:text-accent hover:underline">
        {tr.back}
      </Link>

      {/* 头部 */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            {data?.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.imageUrl} alt={`${call.tokenName} logo`} className="h-9 w-9 rounded-full border border-line object-cover" />
            )}
            <h1 className="font-serif text-3xl font-bold text-[#5c2a52]">{call.tokenName}</h1>
            <CopyCaButton address={call.contractAddress} />
            <ShareCallButton id={latest.call.id} symbol={call.symbol} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="font-mono font-semibold uppercase">{call.symbol}</span>
            <span className="rounded-full border border-line px-1.5 py-px font-mono text-[10px]">{call.chain}</span>
            <span className={`rounded-full border px-2 py-px text-[10.5px] font-semibold ${STANCE_BADGE[call.stance]}`}>
              {stanceLabel(call.stance, tr)}
            </span>
            <span>{tr.calledAt}: <span className="tabular-nums text-heading">{fmtCalledAt(call.calledAt)}</span></span>
            <span>{locale === "en" ? "Last updated" : "最近更新"}: <span className="tabular-nums text-heading">{fmtCalledAt(activityAt(latest))}</span></span>
            <Link href={`/${locale}/topics/${call.narrativeType}`} className="rounded-full border border-line px-2 py-px text-[10.5px] text-muted transition-colors hover:border-accent hover:text-accent">
              {ntLabel(call.narrativeType, tr)}
            </Link>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold tabular-nums text-heading">{curPrice ? formatPrice(curPrice) : "—"}</div>
          {perf !== null && (
            <div className={`text-sm font-semibold tabular-nums ${perf >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {perf >= 0 ? "+" : ""}{perf.toFixed(1)}% {tr.performance}
            </div>
          )}
        </div>
      </div>

      {/* K 线 */}
      {data?.pairAddress && data.chainId && (
        <div className="mt-6 rounded-2xl border border-line bg-card p-4">
          <CallKline chain={data.chainId} pair={data.pairAddress} marks={marks} />
          <p className="mt-2 text-[10px] text-muted">K 线数据来自 GeckoTerminal · 标记已对齐到最近时间粒度</p>
        </div>
      )}

      {/* 主体：判断列表 + 侧栏 */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          {records.map((record, ri) => {
            const c = record.call;
            const o = record.outcome;
            const updates = [...record.updates].sort((a, b) => b.at.localeCompare(a.at));
            return (
              <article key={c.id} className="rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#2a2230] bg-white p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="font-semibold text-heading">◉ {tr.callSnapshot}</span>
                  <span className="tabular-nums">{fmtCalledAt(c.calledAt)}</span>
                  <span className={`rounded-full border px-2 py-px text-[10px] font-semibold ${STANCE_BADGE[c.stance]}`}>{stanceLabel(c.stance, tr)}</span>
                  {o ? (
                    <span className={`rounded-full border px-2 py-px text-[10px] font-bold ${VERDICT_BADGE[o.verdict]}`}>{verdictLabel(o.verdict, tr)}</span>
                  ) : (
                    <span className="rounded-full border border-line px-2 py-px text-[10px] text-muted">{statusOf(record) === "expired" ? tr["status.expired"] : tr["status.open"]}</span>
                  )}
                  {c.isHistorical && <span className="text-amber-600 dark:text-amber-400">⚑ {tr.historical}</span>}
                  {ri > 0 && <span className="ml-auto font-mono text-[10px]">{c.id}</span>}
                </div>

                {c.thesis !== c.narrative && (
                  <p className="mt-2 text-[13px] font-semibold text-muted">{c.narrative}</p>
                )}
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-heading">{c.thesis}</p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <KV k={tr.atCall} v={formatPrice(c.priceAtCall)} />
                  <KV k="MCap" v={formatMcap(c.mcapAtCall)} />
                  {c.liquidityAtCall && <KV k="Liquidity" v={formatMcap(c.liquidityAtCall)} />}
                  {o && <KV k={tr.closedAt} v={`${o.returnAtClose >= 0 ? "+" : ""}${o.returnAtClose}%`} />}
                </div>

                <p className="mt-3 rounded-lg border border-dashed border-[#ff5b3a]/50 px-3 py-2 text-[12.5px] text-heading">
                  <span className="font-semibold text-[#ff5b3a]">⚠ {tr.invalidation}：</span>{c.invalidation}
                </p>

                {/* 更新（倒序） */}
                {updates.length > 0 && (
                  <div className="relative mt-4 space-y-2.5 pl-5">
                    <span className="absolute bottom-2 left-[5px] top-2 w-0.5 bg-line" aria-hidden="true" />
                    {updates.map((u, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
                        <div className="rounded-lg border border-line px-3 py-2">
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

                {o && (
                  <div className="mt-4 rounded-xl border border-dashed border-[#5c2a52] bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${VERDICT_BADGE[o.verdict]}`}>{verdictLabel(o.verdict, tr)}</span>
                      <span className={`text-sm font-semibold tabular-nums ${o.returnAtClose >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {o.returnAtClose >= 0 ? "+" : ""}{o.returnAtClose}%
                      </span>
                      <span className="text-xs tabular-nums text-muted">{fmtCalledAt(o.closedAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-heading">{o.lessons}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* 侧栏 */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#2a2230] bg-white p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">{tr.disclosure}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <DisclosureBadges record={latest} labels={disclosureLabelsOf(tr)} />
            </div>
            {call.disclosure.entryPrice && (
              <p className="mt-2 text-xs text-muted">{tr.entryPrice}: <span className="font-mono tabular-nums text-heading">{formatPrice(call.disclosure.entryPrice)}</span></p>
            )}
          </div>

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

      <div className="sticky bottom-3 z-30 mt-10">
        <p className="mx-auto w-max max-w-full rounded-full border border-line bg-paper/95 px-4 py-1.5 text-center text-[11px] text-muted shadow-md backdrop-blur">
          ⚖️ {tr.disclaimer}
        </p>
      </div>
    </Container>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-codebg px-2.5 py-1.5">
      <div className="text-[9.5px] tracking-wide text-muted">{k}</div>
      <div className="mt-0.5 font-mono text-[12px] font-semibold tabular-nums text-heading">{v}</div>
    </div>
  );
}
