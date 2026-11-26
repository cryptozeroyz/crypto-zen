/**
 * [locale]/topics —— 叙事主题索引页（内链枢纽）
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import { getTr, ntLabel } from "@/components/dashboard/tr";
import { readCallRecords } from "@/lib/calls-store";
import { isLocale, locales, type Locale } from "@/lib/i18n";

export const revalidate = 300;

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  return {
    title: locale === "en" ? "Research Topics — Memecoin Narratives" : "研究主题 · Memecoin 叙事聚合",
    description:
      locale === "en"
        ? "Memecoin research organized by narrative: meme culture, event-driven, AI, utility and more."
        : "按叙事主题组织的 Memecoin 研究：Meme 文化、事件驱动、AI、应用叙事等。",
    alternates: {
      canonical: `/${locale}/topics`,
      languages: { zh: "/zh/topics", en: "/en/topics", "x-default": "/zh/topics" },
    },
  };
}

export default async function TopicsPage({
  params,
}: {
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const tr = getTr(locale);

  const records = await readCallRecords();
  const counts = new Map<string, number>();
  for (const r of records) {
    counts.set(r.call.narrativeType, (counts.get(r.call.narrativeType) ?? 0) + 1);
  }
  const topics = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <Container size="site" className="py-10 sm:py-14">
      <h1 className="font-serif text-3xl font-bold text-[#5c2a52]">
        {locale === "en" ? "Research Topics" : "研究主题"}
      </h1>
      <p className="mt-2 text-[13px] text-muted">
        {locale === "en"
          ? "Calls grouped by narrative — pick a theme to see every judgment on the record."
          : "按叙事主题浏览全部判断，每个主题下都是留痕可查的研究记录。"}
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map(([topic, n]) => (
          <Link
            key={topic}
            href={`/${locale}/topics/${topic}`}
            className="group rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#2a2230] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-solid hover:border-[#ff5b3a] hover:shadow-[6px_8px_0_rgba(92,42,82,.12)]"
          >
            <div className="font-serif text-lg font-bold text-[#5c2a52] transition-colors group-hover:text-[#ff5b3a]">
              {ntLabel(topic, tr)}
            </div>
            <div className="mt-1 font-mono text-[11px] text-muted">{topic}</div>
            <div className="mt-3 text-xs text-muted">
              {n} {locale === "en" ? "calls" : "条判断"} →
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
