/**
 * [locale]/page.tsx —— 首页（单页架构）
 * Hero + 统计 → Trench 市场温度（紧凑）→ 关注列表 → 文章（统一卡片 + 加载更多）
 * → 关于我 → 找到我。行情每 5 分钟增量再生成（ISR）。
 */

import Link from "next/link";
import Image from "next/image";
import Container from "@/components/Container";
import AsteriskMark from "@/components/AsteriskMark";
import SectionHead from "@/components/SectionHead";
import SocialLinks from "@/components/SocialLinks";
import TrenchCard from "@/components/TrenchCard";
import WatchlistSection from "@/components/WatchlistSection";
import ArticlesSection from "@/components/ArticlesSection";
import LinksSection from "@/components/LinksSection";
import { getAllPosts, getSiteStats } from "@/lib/posts";
import { getLinks } from "@/lib/links";
import { fetchWatchlistWithData } from "@/lib/watchlist";
import { fetchTrench } from "@/lib/trench";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export const revalidate = 300;

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);

  const posts = getAllPosts(locale);
  const stats = getSiteStats(locale);
  const links = getLinks();
  const [coins, trench] = await Promise.all([
    fetchWatchlistWithData(),
    fetchTrench(),
  ]);

  const statCells = [
    { label: t.home.stats.all, value: String(stats.total).padStart(2, "0"), href: "#articles" },
    { label: t.home.stats.watch, value: String(coins.length).padStart(2, "0"), href: "#watchlist" },
    { label: t.home.stats.trench, value: trench ? String(trench.score) : "—", href: "#market" },
  ];

  return (
    <>
      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="bg-dots absolute inset-0 opacity-70 [mask-image:radial-gradient(75%_80%_at_75%_35%,black,transparent)]"
        />
        <Container className="relative grid gap-14 py-14 sm:py-16 lg:grid-cols-[1fr_300px] lg:items-center">
          <div>
            <h1 className="text-4xl font-bold leading-[1.18] tracking-tight sm:text-5xl">
              <span className="block text-heading">{t.home.hero.line1}</span>
              <span className="relative mt-1 inline-block text-accent dark:text-accent-mint">
                {t.home.hero.line2}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 220 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-2 left-0 h-2.5 w-44"
                >
                  <path
                    d="M3 9 C 50 3, 140 12, 217 6"
                    stroke="#7dd3fc"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <div className="mt-7 space-y-1.5 text-[15px] leading-relaxed text-muted">
              {t.home.hero.sub.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <a
                href="#articles"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-deep hover:shadow-lg hover:shadow-accent/25"
              >
                {t.home.primaryCta}
                <span aria-hidden="true">↗</span>
              </a>
              <a
                href="#watchlist"
                className="text-sm font-medium text-heading transition-colors duration-200 hover:text-accent dark:hover:text-accent-mint"
              >
                {t.home.secondaryCta} <span aria-hidden="true">→</span>
              </a>
            </div>

            {/* 统计带 */}
            <div className="stats mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
              {statCells.map((cell) => (
                <a
                  key={cell.label}
                  href={cell.href}
                  className="bg-card p-5 transition-colors duration-200 hover:bg-accent/5"
                >
                  <p className="text-2xl font-bold tabular-nums tracking-tight text-heading">
                    {cell.value}
                  </p>
                  <p className="mt-1 text-xs text-muted">{cell.label}</p>
                </a>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <AsteriskMark className="mx-auto aspect-square w-full max-w-[280px]" />
          </div>
        </Container>
      </section>

      {/* ============ 市场温度 ============ */}
      {trench && (
        <section id="market" className="scroll-mt-24">
          <Container className="py-10">
            <TrenchCard data={trench} locale={locale} t={t} />
          </Container>
        </section>
      )}

      {/* ============ 关注列表（文章之前） ============ */}
      {coins.length > 0 && (
        <section id="watchlist" className="scroll-mt-24">
          <Container className="py-14">
            <SectionHead title={t.home.sections.watchlist} />
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              {t.watchlist.intro}
            </p>
            <div className="mt-7">
              <WatchlistSection coins={coins} locale={locale} t={t} />
            </div>
          </Container>
        </section>
      )}

      {/* ============ 文章 ============ */}
      <section id="articles" className="scroll-mt-24">
        <Container className="py-14">
          <SectionHead title={t.home.sections.articles} />
          <div className="mt-7">
            <ArticlesSection posts={posts} locale={locale} t={t} />
          </div>
        </Container>
      </section>

      {/* ============ 推荐（链接收藏） ============ */}
      {links.length > 0 && (
        <section id="links" className="scroll-mt-24">
          <Container className="py-14">
            <SectionHead title={t.home.sections.links} />
            <div className="mt-7">
              <LinksSection links={links} />
            </div>
          </Container>
        </section>
      )}

      {/* ============ 关于我 ============ */}
      <section id="about" className="scroll-mt-24">
        <Container className="py-14">
          <SectionHead title={t.home.sections.about} />
          <div className="mt-6 flex items-start gap-4">
            <Image
              src="/avatar.png"
              alt="Crypto Zen avatar"
              width={56}
              height={56}
              className="rounded-2xl border border-line"
            />
            <div className="prose max-w-2xl">
              {t.about.paragraphs.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ============ 找到我 ============ */}
      <section id="contact" className="scroll-mt-24">
        <Container className="py-14">
          <SectionHead title={t.home.sections.social} />
          <div className="mt-7">
            <SocialLinks t={t} />
          </div>
        </Container>
      </section>
    </>
  );
}
