/**
 * [locale]/page.tsx —— 首页（sabanna 手绘风单页）
 * 打字机 Hero → 方程式跑马灯 → 01/Track Record（calls 数据源） → 02/Writing 文章
 * → 03/Resources 推荐 → 理念区。
 */

import Link from "next/link";
import Image from "next/image";
import Container from "@/components/Container";
import NewsMarquee from "@/components/NewsMarquee";
import HomeTrackRecord from "@/components/dashboard/HomeTrackRecord";
import ArticlesSection from "@/components/ArticlesSection";
import TypewriterHero from "@/components/TypewriterHero";
import { getAllPosts } from "@/lib/posts";
import { getLinks } from "@/lib/links";
import { readCallRecords } from "@/lib/calls-store";
import { activityAt } from "@/lib/calls-stats";
import { fetchCoinData } from "@/lib/watchlist";
import { fetchEqnNews } from "@/lib/eqn";
import { HERO_LOGOS } from "@/lib/coin-images";
import { siteConfig } from "@/lib/siteConfig";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export const revalidate = 300;

/** 首页 SEO：canonical + 中英 hreflang 互指 */
export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): import("next").Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  return {
    alternates: {
      canonical: `/${locale}`,
      languages: { zh: "/zh", en: "/en", "x-default": "/zh" },
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);

  const posts = getAllPosts(locale);
  const links = getLinks();
  const [callRecords, news] = await Promise.all([
    readCallRecords(),
    fetchEqnNews(3),
  ]);

  /* Track Record：最近最活跃的 5 条判断（更新会顶上来），并预取现价 */
  const latestCalls = [...callRecords]
    .sort((a, b) => activityAt(b).localeCompare(activityAt(a)))
    .slice(0, 5);
  const currentMap: Record<
    string,
    { priceUsd?: number; mcap?: number; imageUrl?: string }
  > = {};
  await Promise.all(
    latestCalls.map(async (r) => {
      if (r.outcome) return; // 已复盘的不需要现价
      const d = await fetchCoinData(r.call.contractAddress, {
        pairAddress: r.call.pairAddress,
      }).catch(() => null);
      if (d) {
        currentMap[r.call.contractAddress] = {
          priceUsd: d.priceUsd || undefined,
          mcap: d.marketCap ?? d.fdv,
          imageUrl: d.imageUrl,
        };
      }
    })
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Crypto Zen",
        url: siteConfig.url,
        inLanguage: ["zh-CN", "en"],
        description:
          locale === "en"
            ? "Memecoin research and on-chain analysis hub with a public track record."
            : "Memecoin 研究与链上分析空间，公开投研 Track Record。",
      },
      {
        "@type": "Person",
        name: "Crypto Zen",
        url: siteConfig.url,
        sameAs: [siteConfig.social.twitter],
        jobTitle: locale === "en" ? "Memecoin Researcher" : "Memecoin 研究员",
      },
    ],
  };

  return (
    <div className="home-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TypewriterHero locale={locale} />
        {/* 快讯跑马灯（点击进入 /news） */}
        <Container>
          <NewsMarquee items={news} href={`/${locale}/news`} />
        </Container>

      {/* ============ Track Record（最近 2 条判断 + 看板入口，完整看板见 /dashboard） ============ */}
      {latestCalls.length > 0 && (
        <section id="watchlist" className="scroll-mt-24">
          <Container className="py-7 sm:py-8">
            <div className="home-sh"><span className="no">01 / </span>Track Record</div>
            <div className="mt-5">
              <HomeTrackRecord
                records={latestCalls}
                locale={locale}
                currentMap={currentMap}
                viewAllHref={`/${locale}/dashboard`}
                boardTitle={t.dashboard.title}
              />
            </div>
          </Container>
        </section>
      )}


      {/* ============ 文章 ============ */}
      <section id="articles" className="scroll-mt-24">
        <Container className="py-7 sm:py-8">
          <div className="home-sh"><span className="no">02 / </span>Writing</div>
          <div className="mt-5">
            <ArticlesSection posts={posts.slice(0, 2)} locale={locale} t={t} />
          <div className="mt-6 flex justify-center gap-4">
            <a href={`/${locale}/writing`} className="rounded-full border-2 border-dashed border-[#2a2230] bg-white px-6 py-2.5 font-mono text-[13px] text-[#2a2230] transition-all hover:border-solid hover:border-[#ff5b3a] hover:text-[#ff5b3a]">More writings →</a>
          </div>
          </div>
        </Container>
      </section>

      {/* ============ 好物精选（首页 3+1，全集见 /resources） ============ */}
      {links.length > 0 && (
        <section id="links" className="scroll-mt-24">
          <Container className="py-7 sm:py-8">
            <div className="home-sh"><span className="no">03 / </span>Resources</div>
            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {links.slice(0, 3).map((l) => (
                <Link
                  key={l.url}
                  href={`/${locale}/resources`}
                  className="group flex flex-col overflow-hidden rounded-[4px_18px_4px_22px] border-[1.5px] border-dashed border-[#2a2230] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-solid hover:border-[#ff5b3a] hover:shadow-[6px_8px_0_rgba(92,42,82,.12)]"
                >
                  <div className="flex aspect-[16/9] items-center justify-center bg-codebg px-4">
                    <span className="min-w-0 truncate text-sm font-semibold text-heading transition-colors group-hover:text-accent dark:group-hover:text-accent-mint">
                      {l.type === "file" ? "📄 " : l.type === "book" ? "📖 " : l.type === "goods" ? "🎒 " : "🔧 "}
                      {l.title}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">
                      {l.comment}
                    </p>
                  </div>
                </Link>
              ))}

              {/* 第 4 张：查看全部（Track Record 3+1 同款入口卡） */}
              <Link
                href={`/${locale}/resources`}
                className="group flex min-h-[180px] flex-col rounded-[16px_20px_14px_22px] border-[1.5px] border-dashed border-[#5c2a52] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-solid hover:border-[#ff5b3a] hover:shadow-[6px_8px_0_rgba(92,42,82,.12)]"
              >
                <div className="font-serif text-[17px] font-bold text-[#5c2a52]">
                  {locale === "zh" ? "好物推荐" : "Resources"}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  {locale === "zh"
                    ? "读过的书、用过的工具、踩过的坑。"
                    : "Books, tools and hard-earned lessons."}
                </p>
                <div className="mt-auto w-full border-t border-dashed border-[#2a2230]/25 pt-3">
                  <span className="inline-block font-mono text-[12px] text-[#ff5b3a] transition-transform duration-200 group-hover:translate-x-1">
                    {locale === "zh" ? "查看全部" : "View all"} →
                  </span>
                </div>
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* ============ 关于我 ============ */}

      <section className="home-philo"><div className="mx-auto max-w-[860px] px-6 py-20 text-center"><div className="font-serif text-[clamp(30px,5vw,48px)] font-bold leading-[1.3] text-[#5c2a52]">Stay curious.<br/>Stay skeptical.</div><p className="mt-5 text-[13px] tracking-[.1em] text-[#2a2230]/70">保持好奇 · 保持怀疑 · An Operator. A Trader. An Observer.</p></div></section>
    </div>
  );
}
