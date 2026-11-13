/**
 * [locale]/layout.tsx —— 公开站点的语言布局
 * 按语言渲染 Header / Footer 与 SEO 元数据，admin 与 api 路由不经过这里。
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, isLocale, getDictionary } from "@/lib/i18n";
import { siteConfig } from "@/lib/siteConfig";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FortuneDraw from "@/components/FortuneDraw";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: t.meta.defaultTitle,
      template: t.meta.titleTemplate,
    },
    description: t.meta.description,
    keywords: ["Crypto", "Memecoin", "On-chain", "DYOR", "Web3"],
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : "zh_CN",
      url: siteConfig.url,
      siteName: siteConfig.title,
      title: t.meta.defaultTitle,
      description: t.meta.description,
    },
    twitter: {
      card: "summary",
      title: t.meta.defaultTitle,
      description: t.meta.description,
      creator: siteConfig.social.twitterHandle,
    },
  };
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const t = getDictionary(locale);

  return (
    <>
      <Header locale={locale} t={t} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer t={t} />
      {/* 每日好运签（浮动入口） */}
      <FortuneDraw
        locale={locale}
        labels={{
          button: t.fortune.button,
          draw: t.fortune.draw,
          already: t.fortune.already,
          yi: t.fortune.yi,
          ji: t.fortune.ji,
          close: t.fortune.close,
          brand: t.fortune.brand,
        }}
      />
    </>
  );
}
