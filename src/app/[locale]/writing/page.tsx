/**
 * [locale]/writing/page.tsx —— 文章列表页
 * 分类筛选（全部 / 研究报告 / 个人随笔 / 产品运营）+ 标签 + 搜索在客户端完成，
 * 页面保持静态生成。
 */

import type { Metadata } from "next";
import Container from "@/components/Container";
import WritingClient from "@/components/WritingClient";
import { getAllPosts } from "@/lib/posts";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

interface WritingPageProps {
  params: { locale: string };
}

export function generateMetadata({ params }: WritingPageProps): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);
  return {
    title: t.writing.title,
    description: t.meta.description,
    alternates: { canonical: `/${locale}/writing` },
  };
}

export default function WritingPage({ params }: WritingPageProps) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);

  const all = getAllPosts(locale);
  const research = all.filter((p) => p.category === "research");
  const essays = all.filter((p) => p.category === "essay");
  const ops = all.filter((p) => p.category === "ops");

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">
        {t.writing.title}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        {t.writing.intro}
      </p>

      <WritingClient research={research} essays={essays} ops={ops} locale={locale} t={t} />
    </Container>
  );
}
