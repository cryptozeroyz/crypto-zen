/**
 * LinksSection.tsx —— 首页「推荐」区块
 * 按分类分组的链接收藏：名称 + 一句话推荐 + 外链。
 */

import { groupLinks, type LinkItem } from "@/lib/links";

export default function LinksSection({ links }: { links: LinkItem[] }) {
  const groups = groupLinks(links);
  if (groups.length === 0) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {groups.map(({ category, items }) => (
        <section key={category} aria-label={category}>
          <h3 className="flex items-center gap-2.5 text-sm font-semibold text-heading">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            {category}
            <span className="text-xs font-normal text-muted">{items.length}</span>
          </h3>
          <ul className="mt-3">
            {items.map((l) => (
              <li key={l.url}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-baseline justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors duration-200 hover:bg-accent/5"
                >
                  <span className="min-w-0">
                    <span className="font-medium text-heading transition-colors duration-200 group-hover:text-accent dark:group-hover:text-accent-mint">
                      {l.title}
                    </span>
                    {l.comment && (
                      <span className="mt-0.5 block truncate text-[13px] text-muted">
                        {l.comment}
                      </span>
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-xs text-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-accent dark:group-hover:text-accent-mint"
                  >
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
