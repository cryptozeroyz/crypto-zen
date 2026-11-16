/**
 * [locale]/news —— 链上快讯独立页（ISR 120 秒）
 * 数据源：EquationNews 公开 RSS（服务端拉取，HTML 直出）。
 */

import type { Metadata } from "next";
import Container from "@/components/Container";
import NewsList from "@/components/NewsList";
import { fetchEqnNews } from "@/lib/eqn";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export const revalidate = 120;

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);
  return {
    title: t.news.title,
    description: t.news.intro,
    alternates: { canonical: `/${locale}/news` },
  };
}

export default async function NewsPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);
  const items = await fetchEqnNews(60);

  return (
    <Container size="content" className="py-8 sm:py-10">
      <h1 className="flex items-center gap-2.5 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
        <span aria-hidden="true">⚡</span>
        {t.news.title}
      </h1>
      <p className="mt-3 text-sm text-muted">{t.news.intro}</p>

      <div className="mt-8">
        {items.length > 0 ? (
          <NewsList items={items} locale={locale} t={t} />
        ) : (
          <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
            {t.news.empty}
          </p>
        )}
      </div>

      <p className="mt-8 text-right text-xs text-muted">
        {t.news.source}
      </p>
    </Container>
  );
}
