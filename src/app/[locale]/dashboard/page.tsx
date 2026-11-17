/**
 * [locale]/dashboard —— 我的代币看板（独立页面）
 *
 * 页面是纯静态壳（构建期渲染，无 ISR），行情数据由客户端
 * 从 /api/market?type=watchlist 拉取并 120s 轮询——
 * 这样不新增 Vercel 函数（Hobby 12 上限已满），且访客浏览器
 * 只连本站域名（首尔服务器中转 DexScreener/GeckTerminal），国内可达。
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import DashboardClient from "@/components/dashboard/DashboardClient";
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
    title: t.dashboard.title,
    description: t.dashboard.sub,
    alternates: { canonical: `/${locale}/dashboard` },
  };
}

export default function DashboardPage({
  params,
}: {
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const t = getDictionary(locale);

  return (
    <Container size="site" className="py-10 sm:py-14">
      <DashboardClient locale={locale} t={t} />
    </Container>
  );
}
