"use client";

/**
 * ArticlesSection.tsx —— 首页文章区块（客户端）
 * - 全部文章统一为封面卡片，不再区分类型
 * - 初始展示 2 行（桌面 4 列 × 2 = 8 篇），「加载更多」每次追加 8 篇
 * - 支持按标题 / 摘要 / 标签实时搜索
 */

import { useEffect, useMemo, useState } from "react";
import type { PostMeta } from "@/lib/posts";
import type { Dictionary, Locale } from "@/lib/i18n";
import ArticleCard from "@/components/ArticleCard";

const PAGE_SIZE = 8;

interface ArticlesSectionProps {
  posts: PostMeta[];
  locale: Locale;
  t: Dictionary;
}

export default function ArticlesSection({ posts, locale, t }: ArticlesSectionProps) {
  const [shown, setShown] = useState(PAGE_SIZE);
  const [query, setQuery] = useState("");

  // 搜索条件变化时回到第一页
  useEffect(() => {
    setShown(PAGE_SIZE);
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) =>
      `${p.title} ${p.excerpt} ${p.tags.join(" ")}`.toLowerCase().includes(q)
    );
  }, [posts, query]);

  const visible = filtered.slice(0, shown);
  const remaining = filtered.length - visible.length;

  return (
    <div>
      {/* 搜索 */}
      <div className="mb-6 flex justify-end">
        <div className="relative w-full max-w-64">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.articles.searchPh}
            aria-label={t.articles.searchPh}
            className="w-full rounded-full border border-line bg-card py-2 pl-10 pr-4 text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </div>
      </div>

      {/* 卡片网格：桌面 4 列 → 初始正好 2 行 */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((post) => (
            <ArticleCard key={post.slug} post={post} locale={locale} t={t} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-muted">
          {t.articles.noResult}
        </p>
      )}

      {/* 加载更多 */}
      {remaining > 0 ? (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE_SIZE)}
            className="rounded-full border border-line bg-card px-6 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent dark:hover:text-accent-mint"
          >
            {t.articles.loadMore.replace("{n}", String(remaining))}
          </button>
        </div>
      ) : (
        filtered.length > PAGE_SIZE && (
          <p className="mt-8 text-center text-xs text-muted">
            {t.articles.noMore}
          </p>
        )
      )}
    </div>
  );
}
