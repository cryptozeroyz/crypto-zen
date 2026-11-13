"use client";

/**
 * RandomPostButton.tsx —— 「随便看看」随机跳转按钮（纯客户端逻辑）
 *
 * - 从 props 传入的全量 slug 列表里随机抽取（不在服务端随机，避免缓存问题）
 * - 可排除当前文章（详情页场景）；只有 1 篇文章时禁用
 * - 点击后文字短暂变为「正在抽取…」（300ms）再跳转，加点仪式感
 * - 原生 <button>，键盘回车/空格即可触发
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getRandomPostSlug } from "@/lib/random";
import type { Locale } from "@/lib/i18n";

function DiceIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className={className}
    >
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <circle cx="9" cy="9" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="9" cy="15" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

interface RandomPostButtonProps {
  /** 全部已发布文章的 slug 列表 */
  slugs: string[];
  locale: Locale;
  /** 当前所在文章的 slug（详情页传入以排除） */
  excludeSlug?: string;
  /** primary：低饱和蓝描边胶囊（区块标题旁）；ghost：弱化文字态（详情页） */
  variant?: "primary" | "ghost";
  labels: {
    /** 按钮文案，如「随便看看」 */
    idle: string;
    /** 抽取中文案，如「正在抽取…」 */
    drawing: string;
    /** aria 描述 */
    aria: string;
  };
}

export default function RandomPostButton({
  slugs,
  locale,
  excludeSlug,
  variant = "primary",
  labels,
}: RandomPostButtonProps) {
  const router = useRouter();
  const [drawing, setDrawing] = useState(false);

  // 只有 1 篇文章时无处可去，禁用
  const disabled = slugs.length < 2 || drawing;

  const handleClick = () => {
    if (disabled) return;
    const slug = getRandomPostSlug(slugs, excludeSlug);
    if (!slug) return;
    setDrawing(true);
    window.setTimeout(() => {
      router.push(`/${locale}/writing/${slug}`);
    }, 300);
  };

  const base =
    "inline-flex select-none items-center gap-1.5 rounded-full text-sm transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "border border-accent/35 bg-card px-4 py-1.5 text-accent hover:border-accent/60 hover:shadow-[0_0_18px_rgba(37,99,235,0.22)] dark:border-accent-mint/35 dark:text-accent-mint dark:hover:border-accent-mint/60 dark:hover:shadow-[0_0_18px_rgba(56,189,248,0.18)] disabled:opacity-40 disabled:hover:border-accent/35 disabled:hover:shadow-none"
      : "px-2 py-1 text-muted hover:text-heading disabled:opacity-40";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={labels.aria}
      className={`${base} ${styles}`}
    >
      <DiceIcon />
      <span className={variant === "ghost" && !drawing ? "underline-offset-4 hover:underline" : ""}>
        {drawing ? labels.drawing : labels.idle}
      </span>
    </button>
  );
}
