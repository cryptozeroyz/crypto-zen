/**
 * [locale]/topics/[topic] —— 叙事主题聚合页
 * 按 narrativeType 聚合该主题下的全部判断与关联研报，形成主题内链枢纽。
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import { getTr, ntLabel, fmtCalledAt, stanceLabel, STANCE_BADGE } from "@/components/dashboard/tr";
import { readCallRecords } from "@/lib/calls-store";
import { safeTokenSlug } from "@/lib/coin-format";
import { activityAt } from "@/lib/calls-stats";
import { getAllPosts } from "@/lib/posts";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { siteConfig } from "@/lib/siteConfig";

export const revalidate = 300;

function topicCalls(topic: string) {
  return readCallRecords().then((all) =>
    all
      .filter((r) => r.call.narrativeType === topic)
      .sort((a, b) => activityAt(b).localeCompare(activityAt(a)))
  );
}

export async function generateStaticParams() {
  let topics: string[] = [];
  try {
    const fs = require("fs");
    const raw = fs.readFileSync("content/calls.json", "utf8");
    const list = JSON.parse(raw) as Array<{ call: { narrativeType: string } }>;
    topics = [...new Set(list.map((r) => r.call.narrativeType))];
  } catch {
    /* 空 */
  }
  return locales.flatMap((locale) => topics.map((topic) => ({ locale, topic })));
}

export function generateMetadata({
  params,
}: {
  params: { locale: string; topic: string };
}): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const tr = getTr(locale);
  const label = ntLabel(params.topic, tr);
  return {
    title: locale === "en" ? `${label} — Memecoin Calls & Research` : `${label}叙事：研究判断与复盘`,
    description:
      locale === "en"
        ? `All ${label} narrative calls, updates and post-mortems on CryptoZen.`
        : `${label}叙事下的全部研究判断、更新与复盘，留痕可查。`,
    alternates: {
      canonical: `/${locale}/topics/${params.topic}`,
      languages: {
        zh: `/zh/topics/${params.topic}`,
        en: `/en/topics/${params.topic}`,
        "x-default": `/zh/topics/${params.topic}`,
      },
    },
  };
}

export default async function TopicPage({
  params,
}: {
  params: { locale: string; topic: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const tr = getTr(locale);

  const records = await topicCalls(params.topic);
  if (records.length === 0) notFound();
  const label = ntLabel(params.topic, tr);

  /* 关联研报：这些判断的 relatedReports + tokens 匹配 */
  const allPosts = getAllPosts(locale);
  const syms = new Set(records.map((r) => r.call.symbol.toLowerCase()));
  const addrs = new Set(records.map((r) => r.call.contractAddress.toLowerCase()));
  const matched = allPosts
    .filter((pt) =>
      (pt.tokens ?? []).some((tk) => {
        const t = tk.trim().toLowerCase();
        return t.length > 0 && (syms.has(t) || addrs.has(t));
      })
    )
    .map((pt) => pt.slug);
  const relatedSlugs = [
    ...new Set([...records.flatMap((r) => r.call.relatedReports), ...matched]),
  ];
  const relatedPosts = relatedSlugs
    .map((slug) => allPosts.find((pt) => pt.slug === slug))
    .filter((pt): pt is NonNullable<typeof pt> => Boolean(pt));

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "en" ? "Home" : "首页", item: `${siteConfig.url}/${locale}` },
      { "@type": "ListItem", position: 2, name: locale === "en" ? "Topics" : "主题", item: `${siteConfig.url}/${locale}/topics` },
      { "@type": "ListItem", position: 3, name: label, item: `${siteConfig.url}/${locale}/topics/${params.topic}` },
    ],
  };

  return (
    <Container size="site" className="py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <Link href={`/${locale}/topics`} className="text-xs text-muted underline-offset-4 transition-colors hover:text-accent hover:underline">
        ← {locale === "en" ? "All topics" : "全部主题"}
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-bold text-[#5c2a52]">
        {label}
        <span className="ml-3 align-middle font-mono text-sm font-normal text-muted">{params.topic}</span>
      </h1>
      <p className="mt-2 text-[13px] text-muted">
        {locale === "en"
          ? `${records.length} calls under the ${label} narrative — every judgment on the record.`
          : `${label}叙事下的 ${records.length} 条判断，全部留痕可查。`}
      </p>

      {/* 判断列表 */}
      <div className="mt-7 space-y-3">
        {records.map((r) => (
          <Link
            key={r.call.id}
            href={`/${locale}/token/${safeTokenSlug(r.call.symbol)}`}
            className="group flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#2a2230] bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-solid hover:border-[#ff5b3a] hover:shadow-[5px_7px_0_rgba(92,42,82,.12)]"
          >
            <span className="min-w-[160px] flex-1">
              <b className="block truncate text-sm text-heading">{r.call.tokenName}</b>
              <span className="text-xs text-muted">
                <span className="font-mono uppercase">{r.call.symbol}</span> · {r.call.chain}
              </span>
            </span>
            <span className="w-[120px] text-xs tabular-nums text-muted">{fmtCalledAt(r.call.calledAt)}</span>
            <span className={`rounded-full border px-2 py-px text-[10.5px] font-semibold ${STANCE_BADGE[r.call.stance]}`}>
              {stanceLabel(r.call.stance, tr)}
            </span>
            <span className="font-mono text-[11px] text-[#2a2230]/70 transition-colors group-hover:text-[#ff5b3a]">
              {locale === "en" ? "View" : "查看"} →
            </span>
          </Link>
        ))}
      </div>

      {/* 关联研报 */}
      {relatedPosts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">📄 {tr.related}</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {relatedPosts.map((pt) => (
              <li key={pt.slug}>
                <Link
                  href={`/${locale}/writing/${pt.slug}`}
                  className="block rounded-xl border border-line bg-card px-4 py-3 text-[13px] font-medium text-heading transition-colors hover:border-accent hover:text-accent"
                >
                  {pt.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}
