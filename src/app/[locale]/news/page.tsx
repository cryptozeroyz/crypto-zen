/**
 * [locale]/news —— 方程式新闻全频道独立页（静态壳 + 客户端数据）
 *
 * v2：接入 EquationNews 全部 15 个频道（MCP 协议，经 /api/market 代理），
 * 支持关键词搜索（近 30 天）与币种匹配 chips；120s 轮询。
 * 页面静态化，不新增 Vercel 函数；首页跑马灯仍走服务端 RSS（eqn.ts）。
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import NewsBoard from "@/components/NewsBoard";
import NewsList from "@/components/NewsList";
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
    title: t.news.title,
    description: t.news.intro,
    alternates: { canonical: `/${locale}/news` },
  };
}

export const revalidate = 120;

export default async function NewsPage({
  params,
}: {
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const t = getDictionary(locale);
  const { fetchEqnNews } = await import("@/lib/eqn");
  const mainItems = await fetchEqnNews(40);

  return (
    <Container size="content" className="py-8 sm:py-10">
      <h1 className="flex items-center gap-2.5 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
        <span aria-hidden="true">⚡</span>
        {t.news.title}
      </h1>
      <p className="mt-3 text-sm text-muted">{t.news.intro}</p>

      <div className="mt-6">
      <div className="mt-6 rounded-2xl border border-line bg-card p-3">
        <NewsList items={mainItems} locale={locale} t={t} />
        <p className="mt-2 text-right text-[11px] text-muted">以上为综合频道直出内容 · 全部 15 频道与搜索见下方</p>
      </div>
        <NewsBoard locale={locale} t={t} />
      </div>

      <p className="mt-8 text-right text-xs text-muted">{t.news.source}</p>
    </Container>
  );
}
