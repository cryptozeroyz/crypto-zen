/**
 * SectionHead.tsx —— 区块标题行
 * 左侧粗体标题，右侧可选的「查看全部」链接。
 */

import Link from "next/link";

interface SectionHeadProps {
  title: string;
  href?: string;
  linkText?: string;
}

export default function SectionHead({
  title,
  href,
  linkText = "查看全部 →",
}: SectionHeadProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-2xl font-bold tracking-tight text-heading">{title}</h2>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-sm text-muted underline-offset-4 transition-colors hover:text-heading hover:underline"
        >
          {linkText}
        </Link>
      )}
    </div>
  );
}
