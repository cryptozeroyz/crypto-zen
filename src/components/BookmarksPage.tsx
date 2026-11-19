"use client";

/**
 * BookmarksPage —— 我的收藏（localStorage）
 * 文章页星标收藏的文章在此列出；浏览历史功能已下线。
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";

interface Saved {
  slug: string;
  title: string;
}

export default function BookmarksPage({ locale, posts }: { locale: Locale; posts: Array<{ slug: string; title: string }> }) {
  const [saved, setSaved] = useState<Saved[] | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("cz_bookmarks");
      const list: Saved[] = raw ? JSON.parse(raw) : [];
      const map = new Map(posts.map((p) => [p.slug, p.title]));
      setSaved(
        list
          .map((s) => ({ slug: s.slug, title: map.get(s.slug) ?? s.title }))
          .filter((s) => map.has(s.slug))
      );
    } catch {
      setSaved([]);
    }
  }, [locale]);

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 py-14">
      <div className="home-sh">
        <span className="no">★ /</span> Saved
      </div>
      {saved === null ? null : saved.length === 0 ? (
        <p className="rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#2a2230] bg-white px-5 py-10 text-center font-mono text-[13px] text-[#2a2230]/70">
          {locale === "zh" ? "还没有收藏。读文章时点星标即可收进来。" : "No saved articles yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {saved.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/${locale}/writing/${s.slug}`}
                className="block rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#2a2230] bg-white px-5 py-3.5 font-serif text-[15px] font-bold text-[#5c2a52] transition-all hover:-translate-y-0.5 hover:border-solid hover:border-[#ff5b3a]"
              >
                {s.title} <span className="ml-2 font-mono text-[11px] font-normal text-[#ff5b3a]">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
