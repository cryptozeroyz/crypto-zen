"use client";

/**
 * ContinueReading.tsx —— 首页「继续阅读 + 我的收藏」区块
 * 数据源是访客浏览器的 localStorage（阅读历史 + 收藏），
 * 挂载后才渲染，SSR 输出为空，两种记录都没有时整个区块不出现。
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getHistory, getBookmarks, clearHistory, timeAgo } from "@/lib/reading";
import type { Locale, Dictionary } from "@/lib/i18n";

export interface ReadingPostLite {
  slug: string;
  title: string;
  cover?: string;
}

interface ContinueReadingProps {
  /** slug → 文章元信息的映射（由服务端注入，用于渲染卡片） */
  posts: ReadingPostLite[];
  locale: Locale;
  t: Dictionary;
}

export default function ContinueReading({ posts, locale, t }: ContinueReadingProps) {
  const [mounted, setMounted] = useState(false);
  const [, force] = useState(0);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  const history = getHistory()
    .filter((r) => bySlug.has(r.slug))
    .slice(0, 4);
  const bookmarks = getBookmarks()
    .filter((r) => bySlug.has(r.slug))
    .slice(0, 6);

  if (history.length === 0 && bookmarks.length === 0) {
    // 都没数据时也渲染收藏区块（导航「收藏」需要锚点目标），给空态提示
    return (
      <section id="bookmarks" aria-label={t.reading.bookmarkedList}>
        <h2 className="text-2xl font-bold tracking-tight text-heading">
          {t.reading.bookmarkedList}
        </h2>
        <p className="mt-3 max-w-xl rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">
          {t.reading.emptyBookmarks}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {/* 继续阅读 */}
      {history.length > 0 && (
        <section aria-label={t.reading.continue}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-heading">
              {t.reading.continue}
            </h2>
            <button
              type="button"
              onClick={() => {
                clearHistory();
                force((n) => n + 1);
              }}
              className="text-xs text-muted underline-offset-4 transition-colors hover:text-heading hover:underline"
            >
              {t.reading.clearHistory}
            </button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {history.map((r) => {
              const p = bySlug.get(r.slug)!;
              return (
                <Link
                  key={r.slug}
                  href={`/${locale}/writing/${r.slug}`}
                  className="group overflow-hidden rounded-xl border border-line bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/40"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-codebg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.cover ?? `/api/cover/${p.slug}?locale=${locale}`}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-[13px] font-medium text-heading group-hover:text-accent dark:group-hover:text-accent-mint">
                      {p.title}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {timeAgo(r.at, locale)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 我的收藏 */}
      {bookmarks.length > 0 && (
        <section aria-label={t.reading.bookmarkedList}>
          <h2 className="text-2xl font-bold tracking-tight text-heading">
            {t.reading.bookmarkedList}
          </h2>
          <ul className="mt-4 border-t border-line">
            {bookmarks.map((r) => {
              const p = bySlug.get(r.slug)!;
              return (
                <li key={r.slug}>
                  <Link
                    href={`/${locale}/writing/${r.slug}`}
                    className="group flex items-baseline justify-between gap-4 border-b border-line py-3"
                  >
                    <span className="truncate text-[15px] font-medium text-heading transition-colors group-hover:text-accent dark:group-hover:text-accent-mint">
                      <span aria-hidden="true" className="mr-2 text-accent dark:text-accent-mint">★</span>
                      {p.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {timeAgo(r.at, locale)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
