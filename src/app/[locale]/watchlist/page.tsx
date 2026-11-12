/**
 * [locale]/watchlist/page.tsx —— 关注列表页
 * 顶部：Trench Index 卡片（市场热度指数，含 90 天走势）
 * 下方：正在关注的 Memecoin 卡片（头像/价格/24h 涨跌/一句话评价）
 * 行情来自 DexScreener，按 CA 自动抓取；页面每 5 分钟增量再生成（ISR）。
 */

import type { Metadata } from "next";
import Container from "@/components/Container";
import CoinCard from "@/components/CoinCard";
import TrenchCard from "@/components/TrenchCard";
import { fetchWatchlistWithData } from "@/lib/watchlist";
import { fetchTrench } from "@/lib/trench";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export const revalidate = 300;

interface WatchlistPageProps {
  params: { locale: string };
}

export function generateMetadata({ params }: WatchlistPageProps): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);
  return {
    title: t.watchlist.title,
    description: t.watchlist.intro,
    alternates: { canonical: `/${locale}/watchlist` },
  };
}

export default async function WatchlistPage({ params }: WatchlistPageProps) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);

  // 并行抓行情与指数；任一失败都不影响页面渲染
  const [coins, trench] = await Promise.all([
    fetchWatchlistWithData(),
    fetchTrench(),
  ]);

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">
        {t.watchlist.title}
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
        {t.watchlist.intro}
      </p>

      {/* Trench Index */}
      {trench && (
        <div className="mt-10">
          <TrenchCard data={trench} locale={locale} t={t} />
        </div>
      )}

      {/* 关注代币 */}
      {coins.length > 0 ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {coins.map((coin) => (
            <CoinCard key={coin.ca} coin={coin} t={t} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-sm text-muted">—</p>
      )}
    </Container>
  );
}
