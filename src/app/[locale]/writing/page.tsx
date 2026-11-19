import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticlesSection from "@/components/ArticlesSection";
import { getAllPosts } from "@/lib/posts";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }
export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);
  return { title: t.home.sections.articles, alternates: { canonical: `/${locale}/writing`, languages: { zh: "/zh/writing", en: "/en/writing" } } };
}
export default function WritingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const t = getDictionary(locale);
  const posts = getAllPosts(locale);
  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 py-14">
      <div className="home-sh"><span className="no">★ /</span> All Writings</div>
      <ArticlesSection posts={posts} locale={locale} t={t} />
    </div>
  );
}
