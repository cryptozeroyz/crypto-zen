"use client";

/**
 * BookmarkButton.tsx —— 收藏/取消收藏（localStorage）
 * 挂载后才渲染真实状态，避免 SSR 与客户端不一致。
 */

import { useEffect, useState } from "react";
import { isBookmarked, toggleBookmark } from "@/lib/reading";

interface BookmarkButtonProps {
  slug: string;
  labels: { bookmark: string; bookmarked: string; unbookmark: string };
}

export default function BookmarkButton({ slug, labels }: BookmarkButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isBookmarked(slug));
    setMounted(true);
  }, [slug]);

  if (!mounted) {
    // 占位，避免布局跳动
    return <span className="inline-flex h-7 w-16" aria-hidden="true" />;
  }

  const onClick = () => {
    setActive(toggleBookmark(slug));
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? labels.unbookmark : labels.bookmark}
      title={active ? labels.unbookmark : labels.bookmark}
      className={`inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs transition-all duration-200 ${
        active
          ? "border-accent/50 bg-accent/10 font-medium text-accent dark:text-accent-mint"
          : "border-line text-muted hover:border-heading hover:text-heading"
      }`}
    >
      <span aria-hidden="true">{active ? "★" : "☆"}</span>
      {active ? labels.bookmarked : labels.bookmark}
    </button>
  );
}
