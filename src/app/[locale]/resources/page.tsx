/**
 * [locale]/resources —— 好物推荐页（静态）
 * 图书 / 物品 / 工具 / 资料 四类，客户端筛选与一键复制。
 */

import type { Metadata } from "next";
import Container from "@/components/Container";
import ResourcesClient from "@/components/ResourcesClient";
import { getLinks } from "@/lib/links";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);
  return {
    title: t.resources.title,
    description: t.resources.intro,
    alternates: { canonical: `/${locale}/resources` },
  };
}

export default function ResourcesPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);
  const links = getLinks();

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">
        {t.resources.title}
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
        {t.resources.intro}
      </p>
      <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-3.5 py-1.5 text-xs text-muted">
        🛈 {t.resources.note}
      </p>

      <ResourcesClient links={links} t={t} />
    </Container>
  );
}
