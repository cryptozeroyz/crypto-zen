/**
 * [locale]/page.tsx —— 首页
 * Hero → 统计带 → 研究报告卡片 → 随笔/产品运营列表 → 联系方式。
 */

import Link from "next/link";
import Container from "@/components/Container";
import AsteriskMark from "@/components/AsteriskMark";
import SectionHead from "@/components/SectionHead";
import ResearchCard from "@/components/ResearchCard";
import BlogRow from "@/components/BlogRow";
import SocialLinks from "@/components/SocialLinks";
import { getAllPosts, getSiteStats } from "@/lib/posts";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

interface HomePageProps {
  params: { locale: string };
}

export default function HomePage({ params }: HomePageProps) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);

  const posts = getAllPosts(locale);
  const research = posts.filter((p) => p.category === "research").slice(0, 3);
  const essays = posts.filter((p) => p.category === "essay").slice(0, 4);
  const ops = posts.filter((p) => p.category === "ops").slice(0, 4);
  const stats = getSiteStats(locale);

  const statCells = [
    { label: t.home.stats.all, value: stats.total, href: `/${locale}/writing` },
    { label: t.home.stats.research, value: stats.research, href: `/${locale}/writing?category=research` },
    { label: t.home.stats.essay, value: stats.essay, href: `/${locale}/writing?category=essay` },
    { label: t.home.stats.ops, value: stats.ops, href: `/${locale}/writing?category=ops` },
  ];

  return (
    <>
      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden="true"
          className="bg-dots absolute inset-0 opacity-70 [mask-image:radial-gradient(75%_80%_at_75%_35%,black,transparent)]"
        />
        <Container className="relative grid gap-14 py-16 sm:py-20 lg:grid-cols-[1fr_340px] lg:items-center lg:py-24">
          <div>
            <h1 className="text-4xl font-bold leading-[1.18] tracking-tight sm:text-5xl lg:text-[3.3rem]">
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
                    stroke="#81d8d0"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <div className="mt-8 space-y-1.5 text-[15px] leading-relaxed text-muted">
              {t.home.hero.sub.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>

            {/* 行动按钮 */}
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Link
                href={`/${locale}/writing?category=research`}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-deep hover:shadow-lg hover:shadow-accent/25"
              >
                {t.home.primaryCta}
                <span aria-hidden="true">↗</span>
              </Link>
              <Link
                href={`/${locale}/writing?category=essay`}
                className="text-sm font-medium text-heading transition-colors duration-200 hover:text-accent dark:hover:text-accent-mint"
              >
                {t.home.secondaryCta} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* 星芒装饰（桌面端） */}
          <div className="relative hidden lg:block">
            <AsteriskMark className="mx-auto aspect-square w-full max-w-[320px]" />
          </div>
        </Container>
      </section>

      {/* ============ 统计带 ============ */}
      <section className="border-b border-line">
        <Container className="py-12">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
            {statCells.map((cell) => (
              <Link
                key={cell.label}
                href={cell.href}
                className="group bg-card p-6 transition-colors duration-200 hover:bg-accent/5"
              >
                <p className="text-xs text-muted">{cell.label}</p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums tracking-tight text-heading">
                    {String(cell.value).padStart(2, "0")}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-sm text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-accent-mint"
                  >
                    ↗
                  </span>
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ============ 研究报告 ============ */}
      {research.length > 0 && (
        <section className="border-b border-line">
          <Container className="py-14">
            <SectionHead
              title={t.home.sections.research}
              href={`/${locale}/writing?category=research`}
              linkText={t.home.viewAll}
            />
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {research.map((post) => (
                <ResearchCard key={post.slug} post={post} locale={locale} t={t} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ============ 随笔 ============ */}
      {essays.length > 0 && (
        <section className="border-b border-line">
          <Container className="py-14">
            <SectionHead
              title={t.home.sections.essay}
              href={`/${locale}/writing?category=essay`}
              linkText={t.home.viewAll}
            />
            <div className="mt-6 border-t border-line">
              {essays.map((post) => (
                <BlogRow key={post.slug} post={post} locale={locale} t={t} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ============ 产品运营 ============ */}
      {ops.length > 0 && (
        <section className="border-b border-line">
          <Container className="py-14">
            <SectionHead
              title={t.home.sections.ops}
              href={`/${locale}/writing?category=ops`}
              linkText={t.home.viewAll}
            />
            <div className="mt-6 border-t border-line">
              {ops.map((post) => (
                <BlogRow key={post.slug} post={post} locale={locale} t={t} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ============ 联系方式 ============ */}
      <section>
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
