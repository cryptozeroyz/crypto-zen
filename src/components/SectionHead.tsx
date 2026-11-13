/**
 * SectionHead.tsx —— 区块标题行
 * 左侧粗体标题，右侧可选的自定义动作（如「随便看看」按钮）或「查看全部」链接。
 */

import Link from "next/link";
import type { ReactNode } from "react";

interface SectionHeadProps {
  title: string;
  href?: string;
  linkText?: string;
  /** 标题行右侧的自定义内容（优先级高于 href 链接） */
  action?: ReactNode;
}

export default function SectionHead({
  title,
  href,
  linkText = "查看全部 →",
  action,
}: SectionHeadProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-bold tracking-tight text-heading">{title}</h2>
      {action ?? (
        href ? (
          <Link
            href={href}
            className="shrink-0 text-sm text-muted underline-offset-4 transition-colors hover:text-heading hover:underline"
          >
            {linkText}
          </Link>
        ) : null
      )}
    </div>
  );
}
