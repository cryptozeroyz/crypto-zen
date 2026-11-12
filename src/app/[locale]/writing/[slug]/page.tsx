/**
 * [locale]/writing/[slug]/page.tsx —— 文章详情页
 * 研究报告：披露组件 + 封面图 + DexScreener K 线 + 正文；
 * 其他分类：披露组件 + 标题 + 正文。
 * 桌面端右侧悬浮目录；英文版缺失时展示提示并提供中文版链接。
 * OG 分享图由同目录 opengraph-image.tsx 自动生成。
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getPostBySlug, getAdjacentPosts } from "@/lib/posts";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import Container from "@/components/Container";
import DexChart from "@/components/DexChart";
import Toc from "@/components/Toc";
import Disclosure from "@/components/Disclosure";

/** 构建期生成全部文章路径（英文缺失的文章在渲染时给出提示页） */
export function generateStaticParams() {
  return getAllPosts("zh").map((post) => ({ slug: post.slug }));
}

/** 只允许访问已生成的文章，其余直接 404 */
export const dynamicParams = false;

/** 每篇文章独立的 SEO 元数据（og:image 由 opengraph-image.tsx 生成） */
export function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const post = getPostBySlug(params.slug, locale);
  if (!post) return { title: "404" };

  const zhUrl = `/zh/writing/${post.slug}`;
  const enUrl = `/en/writing/${post.slug}`;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/${locale}/writing/${post.slug}`,
      languages: { zh: zhUrl, en: enUrl },
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

export default function PostPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);

  const post = getPostBySlug(params.slug, locale);

  // 该语言版本不存在（尚未翻译）时，展示提示并提供中文版
  if (!post) {
    return (
      <Container size="content" className="py-24 text-center sm:py-32">
        <h1 className="text-2xl font-bold tracking-tight text-heading">
          {t.post.notTranslatedTitle}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          {t.post.notTranslatedBody}
        </p>
        <Link
          href={`/zh/writing/${params.slug}`}
          className="mt-8 inline-block font-medium text-accent underline-offset-4 hover:underline dark:text-accent-mint"
        >
          {t.post.readZhVersion}
        </Link>
      </Container>
    );
  }

  const { prev, next } = getAdjacentPosts(post.slug, locale);
  const isResearch = post.category === "research";

  // 文章结构化数据（供搜索引擎理解）
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    ...(post.updated ? { dateModified: post.updated } : {}),
    inLanguage: locale === "en" ? "en" : "zh-CN",
    author: { "@type": "Person", name: "Crypto Zen" },
    keywords: post.tags.join(","),
  };

  return (
    <article className="py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container size="site">
        <div className="flex justify-center gap-14">
          {/* 正文栏 */}
          <div className="w-full max-w-content">
            {/* 返回链接 */}
            <Link
              href={`/${locale}/writing`}
              className="text-sm text-muted underline-offset-4 transition-colors hover:text-heading hover:underline"
            >
              {t.post.back}
            </Link>

            {/* 文章头部 */}
            <header className="mt-8">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-accent px-2.5 py-1 font-medium text-white">
                  {t.category[post.category]}
                </span>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-line px-2.5 py-1 text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-[1.25] tracking-tight text-heading sm:text-4xl">
                {post.title}
              </h1>

              <p className="mt-4 text-xs tabular-nums text-muted">
                <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
                <span aria-hidden="true"> · </span>
                {t.post.minRead.replace("{n}", String(post.readingTime))}
                {post.updated && (
                  <>
                    <span aria-hidden="true"> · </span>
                    {t.post.updated}{" "}
                    <time dateTime={post.updated}>
                      {formatDate(post.updated, locale)}
                    </time>
                  </>
                )}
                <span aria-hidden="true"> · </span>
                Crypto Zen
              </p>
            </header>

            {/* 免责声明 */}
            <Disclosure t={t} />

            {/* 封面图（研究报告） */}
            {isResearch && post.cover && (
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-line">
                {/* 封面可能是 SVG 或用户上传的图片，用原生 img 渲染 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.cover}
                  alt={`${post.title} cover`}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* DexScreener K 线（研究报告） */}
            {isResearch && post.dexScreener && (
              <DexChart url={post.dexScreener} title={post.title} liveLabel={t.post.liveChart} />
            )}

            {/* 正文 */}
            <div
              className="prose mt-8"
              dangerouslySetInnerHTML={{ __html: post.html }}
            />

            {/* 上一篇 / 下一篇 */}
            <nav
              aria-label="prev/next"
              className="mt-16 grid gap-6 border-t border-line pt-8 sm:grid-cols-2"
            >
              {prev ? (
                <Link
                  href={`/${locale}/writing/${prev.slug}`}
                  className="group block no-underline"
                >
                  <span className="block text-xs text-muted">{t.post.prev}</span>
                  <span className="mt-1 block text-[15px] font-medium text-heading underline-offset-4 group-hover:underline">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <span aria-hidden="true" />
              )}
              {next ? (
                <Link
                  href={`/${locale}/writing/${next.slug}`}
                  className="group block text-right no-underline"
                >
                  <span className="block text-xs text-muted">{t.post.next}</span>
                  <span className="mt-1 block text-[15px] font-medium text-heading underline-offset-4 group-hover:underline">
                    {next.title}
                  </span>
                </Link>
              ) : (
                <span aria-hidden="true" />
              )}
            </nav>
          </div>

          {/* 桌面端悬浮目录 */}
          <div className="hidden xl:block">
            <div className="sticky top-24">
              <Toc items={post.toc} label={t.post.toc} />
            </div>
          </div>
        </div>
      </Container>
    </article>
  );
}
