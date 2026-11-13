"use client";

/**
 * BookmarkButton.tsx —— 收藏/取消收藏（localStorage）
 * SVG 星标 + 切换时的弹跳动画；挂载后才渲染真实状态避免水合不一致。
 */

import { useEffect, useState } from "react";
import { isBookmarked, toggleBookmark } from "@/lib/reading";

interface BookmarkButtonProps {
  slug: string;
  labels: { bookmark: string; bookmarked: string; unbookmark: string };
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-3.5 w-3.5 transition-all duration-200 ${
        filled ? "scale-110 text-accent" : "text-muted"
      }`}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    >
      <path d="m12 2.8 2.83 5.86 6.42.9-4.66 4.5 1.13 6.38L12 17.3l-5.72 3.14 1.13-6.38-4.66-4.5 6.42-.9L12 2.8Z" />
    </svg>
  );
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
    return <span className="inline-flex h-7 w-20" aria-hidden="true" />;
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
      className={`group inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs transition-all duration-200 ${
        active
          ? "border-accent/40 bg-accent/10 font-medium text-accent dark:text-accent-mint"
          : "border-line text-muted hover:-translate-y-px hover:border-heading/40 hover:text-heading"
      }`}
    >
      <span className={active ? "animate-[bookmark-pop_.25s_ease-out]" : ""}>
        <StarIcon filled={active} />
      </span>
      {active ? labels.bookmarked : labels.bookmark}
    </button>
  );
}
