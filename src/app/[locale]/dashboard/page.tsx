/**
 * [locale]/dashboard —— Track Record 列表页
 * 数据源 content/calls.json（Zod 校验）；统计面板服务端渲染，
 * 列表与筛选为客户端组件，进行中记录现价 120s 轮询。
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import TrackRecordClient from "@/components/dashboard/TrackRecordClient";
import { getTr } from "@/components/dashboard/tr";
import { readCallRecords } from "@/lib/calls-store";
import { computeStats } from "@/lib/calls-stats";
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
    alternates: {
      canonical: `/${locale}/dashboard`,
      languages: { zh: "/zh/dashboard", en: "/en/dashboard", "x-default": "/zh/dashboard" },
    },
    twitter: { card: "summary_large_image" },
  };
}

export const revalidate = 300;

export default async function DashboardPage({
  params,
}: {
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const tr = getTr(locale);

  const records = await readCallRecords();
  const stats = computeStats(records);

  return (
    <Container size="site" className="py-10 sm:py-14">
      <h1 className="font-serif text-3xl font-bold text-[#5c2a52]">{tr.title}</h1>
      <p className="mt-2 max-w-[640px] text-[13px] leading-relaxed text-muted">
        {tr.subtitle}
      </p>

      {/* 统计面板 */}
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <StatCard label={tr.statTotal} value={String(stats.total)} />
        <StatCard label={tr.statClosed} value={String(stats.closed)} />
        <StatCard label={tr.statOpen} value={String(stats.open)} />
        <StatCard label={tr.statExpired} value={String(stats.expired)} />
        <StatCard
          label={tr.statWinRate}
          value={stats.winRate === null ? "—" : `${stats.winRate}%`}
          tone={stats.winRate !== null && stats.winRate >= 50 ? "up" : stats.winRate !== null ? "down" : undefined}
        />
        <StatCard
          label={tr.statMedianReturn}
          value={stats.medianReturn === null ? "—" : `${stats.medianReturn >= 0 ? "+" : ""}${stats.medianReturn}%`}
          tone={stats.medianReturn !== null && stats.medianReturn >= 0 ? "up" : "down"}
        />
        <StatCard label={tr.statMedianDD} value={stats.medianMaxDrawdown === null ? "—" : `-${stats.medianMaxDrawdown}%`} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        {stats.since && <span>{tr.since.replace("{d}", stats.since)}</span>}
        {stats.smallSample && (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-px text-amber-700 dark:text-amber-400">
            ⚠ {tr.smallSample}
          </span>
        )}
      </div>

      <TrackRecordClient records={records} locale={locale} />
    </Container>
  );
}

function StatCard({
  label, value, tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="rounded-[12px_16px_10px_18px] border-[1.5px] border-dashed border-[#2a2230] bg-white px-4 py-3">
      <div className="text-[10px] tracking-wide text-muted">{label}</div>
      <div
        className={`mt-1 text-lg font-bold tabular-nums ${
          tone === "up"
            ? "text-emerald-600 dark:text-emerald-400"
            : tone === "down"
              ? "text-red-600 dark:text-red-400"
              : "text-heading"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
