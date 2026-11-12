/**
 * Toc.tsx —— 文章目录（桌面端右侧悬浮栏）
 * 锚点跳转对应 .prose 里生成的 h2/h3 id。
 */

import type { TocItem } from "@/lib/posts";

export default function Toc({ items, label }: { items: TocItem[]; label: string }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label={label} className="w-44 shrink-0">
      <p className="text-xs font-medium text-muted">{label}</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li key={item.id} className={item.depth === 3 ? "ml-3" : ""}>
            <a
              href={`#${item.id}`}
              className="block border-l-2 border-transparent pl-3 text-[13px] leading-snug text-muted transition-colors duration-200 hover:border-accent hover:text-heading"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
