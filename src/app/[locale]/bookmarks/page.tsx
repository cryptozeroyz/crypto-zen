import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookmarksPage from "@/components/BookmarksPage";
import { getAllPosts } from "@/lib/posts";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }
export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  return { title: locale === "zh" ? "收藏" : "Saved", alternates: { canonical: `/${locale}/bookmarks` } };
}
export default function Page({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const posts = getAllPosts(locale).map((p) => ({ slug: p.slug, title: p.title }));
  return <BookmarksPage locale={locale} posts={posts} />;
}
