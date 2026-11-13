/**
 * [locale]/page.tsx —— 首页（单页架构）
 * Hero（+实时行情/最近在听）→ 关注列表 → 文章 → 继续阅读 → 好物精选
 * → 关于我 → 找到我。
 */

import Link from "next/link";
import Image from "next/image";
import Container from "@/components/Container";
import MemeHeroArt from "@/components/MemeHeroArt";
import MemeTape from "@/components/MemeTape";
import SectionHead from "@/components/SectionHead";
import SocialLinks from "@/components/SocialLinks";
import WatchlistSection from "@/components/WatchlistSection";
import ArticlesSection from "@/components/ArticlesSection";
import ContinueReading from "@/components/ContinueReading";
import RandomPostButton from "@/components/RandomPostButton";
import NowPlaying from "@/components/NowPlaying";
import { getAllPosts } from "@/lib/posts";
import { getLinks } from "@/lib/links";
import { fetchWatchlistWithData } from "@/lib/watchlist";
import { siteConfig } from "@/lib/siteConfig";
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
  const links = getLinks();
  const coins = await fetchWatchlistWithData();

  return (
    <>
      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="bg-dots absolute inset-0 opacity-70 [mask-image:radial-gradient(75%_80%_at_75%_35%,black,transparent)]"
        />
        <Container className="relative grid gap-10 py-10 sm:py-12 lg:grid-cols-[1fr_320px] lg:items-center">
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

            {/* 最近在听 / 现在在做什么（实时） */}
            <NowPlaying
              lastfm={siteConfig.lastfm}
              labels={{
                listening: t.nowPlaying.listening,
                recent: t.nowPlaying.recent,
                now: t.nowPlaying.now,
              }}
            />

            <div className="mt-7 flex flex-wrap items-center gap-6">
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
          </div>

          {/* Meme 币漂浮元素（桌面端） */}
          <div className="relative hidden h-64 lg:block">
            <MemeHeroArt className="h-full w-full max-w-[320px]" />
          </div>
        </Container>

        {/* 币名滚动带 */}
        <MemeTape />
      </section>

      {/* ============ 关注列表 ============ */}
      {coins.length > 0 && (
        <section id="watchlist" className="scroll-mt-24">
          <Container className="py-7 sm:py-8">
            <SectionHead title={t.home.sections.watchlist} />
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              {t.watchlist.intro}
            </p>
            <div className="mt-5">
              <WatchlistSection coins={coins} locale={locale} t={t} />
            </div>
          </Container>
        </section>
      )}

      {/* ============ 文章 ============ */}
      <section id="articles" className="scroll-mt-24">
        <Container className="py-7 sm:py-8">
          <SectionHead
            title={t.home.sections.articles}
            action={
              <RandomPostButton
                slugs={posts.map((p) => p.slug)}
                locale={locale}
                variant="primary"
                labels={{
                  idle: t.articles.random,
                  drawing: t.articles.randomDrawing,
                  aria: t.articles.randomAria,
                }}
              />
            }
          />
          <div className="mt-5">
            <ArticlesSection posts={posts} locale={locale} t={t} />
          </div>
        </Container>
      </section>

      {/* ============ 继续阅读 / 我的收藏（localStorage，客户端） ============ */}
      <section id="reading" className="scroll-mt-24">
        <Container className="py-7 sm:py-8">
          <ContinueReading
            posts={posts.map((p) => ({ slug: p.slug, title: p.title, cover: p.cover }))}
            locale={locale}
            t={t}
          />
        </Container>
      </section>

      {/* ============ 好物精选（全集见 /resources） ============ */}
      {links.length > 0 && (
        <section id="links" className="scroll-mt-24">
          <Container className="py-7 sm:py-8">
            <SectionHead
              title={t.home.sections.links}
              href={`/${locale}/resources`}
              linkText={`${t.home.viewAll ?? "查看全部 →"}`}
            />
            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {links.slice(0, 4).map((l) => (
                <Link
                  key={l.url}
                  href={`/${locale}/resources`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/40"
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
            </div>
          </Container>
        </section>
      )}

      {/* ============ 关于我 ============ */}
      <section id="about" className="scroll-mt-24">
        <Container className="py-7 sm:py-8">
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
        <Container className="py-7 sm:py-8">
          <SectionHead title={t.home.sections.social} />
          <div className="mt-5">
            <SocialLinks t={t} />
          </div>
        </Container>
      </section>
    </>
  );
}
