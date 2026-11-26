/**
 * [locale]/about —— CryptoZen 品牌定位页（Operator · Trader · Observer）
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AboutClient from "@/components/AboutClient";
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
  const desc =
    locale === "zh"
      ? "CryptoZen：一个建设过产品、参与过市场，也持续观察 Crypto 世界的人。Stay curious. Stay skeptical."
      : "CryptoZen: an operator, a trader, an observer of the crypto world. Stay curious. Stay skeptical.";
  return {
    title: locale === "zh" ? "关于" : "About",
    description: desc,
    alternates: {
      canonical: `/${locale}/about`,
      languages: { zh: "/zh/about", en: "/en/about" },
    },
  };
}

export default function AboutPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  return <AboutClient locale={params.locale} />;
}
