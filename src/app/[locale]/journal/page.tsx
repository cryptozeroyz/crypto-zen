/**
 * [locale]/journal —— 公开研究日志页
 * 碎片研究记录对外可见；AI 快速研报同步在此（带 AI 标识）。
 * 代币 chips 跳看板，文章类内容仍走 /writing。
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import Container from "@/components/Container";
import { getJournal } from "@/lib/journal";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);
  return {
    title: locale === "zh" ? "研究日志" : "Research Journal",
    description: locale === "zh" ? "碎片研究记录与 AI 快速研报" : "Research fragments and AI quick reports",
    alternates: { canonical: `/${locale}/journal` },
  };
}

export default function JournalPage({
  params,
}: {
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const entries = getJournal();

  return (
    <Container size="content" className="py-10 sm:py-14">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent dark:text-accent-mint">
        RESEARCH JOURNAL
      </div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
        {locale === "zh" ? "研究日志" : "Research Journal"}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {locale === "zh"
          ? "碎片观察、待验证假设与 AI 快速研报。时间线视角见代币看板。"
          : "Fragments, hypotheses and AI quick reports. Timeline view lives on the dashboard."}
      </p>

      <div className="mt-8 space-y-4">
        {entries.map((j) => (
          <article key={j.id} className="rounded-2xl border border-line bg-card px-5 py-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="tabular-nums">{j.date}</span>
              {j.tags.includes("AI") && (
                <span className="rounded bg-accent px-1.5 py-px text-[10px] font-bold text-white">AI</span>
              )}
              {j.tokens.map((tk) => (
                <Link
                  key={tk}
                  href={`/${locale}/dashboard`}
                  className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent dark:text-accent-mint"
                >
                  ${tk}
                </Link>
              ))}
              {j.tags.filter((tg) => tg !== "AI").map((tg) => (
                <span key={tg} className="rounded-full bg-codebg px-2 py-0.5">{tg}</span>
              ))}
            </div>
            {j.title && <h2 className="mt-2 font-semibold text-heading">{j.title}</h2>}
            <div
              className="prose-journal mt-2 text-sm leading-relaxed text-muted [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-heading [&_blockquote]:border-l-2 [&_blockquote]:border-accent/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted"
              dangerouslySetInnerHTML={{ __html: marked.parse(j.body) as string }}
            />
          </article>
        ))}
        {entries.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line px-4 py-12 text-center text-sm text-muted">
            {locale === "zh" ? "还没有公开的研究日志。" : "No public journal entries yet."}
          </p>
        )}
      </div>
    </Container>
  );
}
