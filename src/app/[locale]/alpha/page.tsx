/**
 * [locale]/alpha —— Daily Alpha · 每日好运签
 * 黑金仪式感的独立空间（不受站点亮暗主题影响），ISR 每小时重生成，
 * 服务端计算 UTC+8 今日日期传给客户端做每日一次的判定（防改本地时间）。
 */

import type { Metadata } from "next";
import DailyAlphaClient from "@/components/alpha/DailyAlphaClient";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export const revalidate = 3600;

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);
  return {
    title: t.alpha.title,
    description: t.alpha.sub,
    alternates: {
      canonical: `/${locale}/alpha`,
      languages: { zh: "/zh/alpha", en: "/en/alpha", "x-default": "/zh/alpha" },
    },
  };
}

/** 服务端 UTC+8 今日（YYYY-MM-DD） */
function todayUtc8(): string {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

export default function AlphaPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);

  return (
    <section
      style={{ background: "#0B0D12" }}
      className="min-h-[80vh] text-[#F5F5F5]"
    >
      <DailyAlphaClient
        locale={locale}
        todayKey={todayUtc8()}
        labels={{
          eyebrow: t.alpha.eyebrow,
          title: t.alpha.title,
          sub: t.alpha.sub,
          draw: t.alpha.draw,
          drawing: t.alpha.drawing,
          rule: t.alpha.rule,
          todayLuck: t.alpha.todayLuck,
          reading: t.alpha.reading,
          share: t.alpha.share,
          download: t.alpha.download,
          copy: t.alpha.copy,
          copied: t.alpha.copied,
          history: t.alpha.history,
          historyEmpty: t.alpha.historyEmpty,
          tomorrow: t.alpha.tomorrow,
          no: t.alpha.no,
        }}
      />
    </section>
  );
}
