/**
 * NewsList.tsx —— 快讯列表（服务端渲染）
 * 每条：来源 + 相对时间 / 标题 / 币种 chips，整行点击跳原文。
 * 首页区块与 /news 页共用。
 */

import type { EqnItem } from "@/lib/eqn";
import { timeAgo } from "@/lib/reading";
import type { Dictionary, Locale } from "@/lib/i18n";

export default function NewsList({
  items,
  locale,
  t,
  compact = false,
}: {
  items: EqnItem[];
  locale: Locale;
  t: Dictionary;
  /** 首页紧凑模式：标题单行截断 */
  compact?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <ul className={compact ? "space-y-1" : "space-y-1.5"}>
      {items.map((item) => (
        <li key={item.url}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-accent/5"
          >
            <div className="flex items-center gap-2 text-[11px] text-muted">
              {item.categories[0] && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent dark:text-accent-mint">
                  {item.categories[0]}
                </span>
              )}
              <time dateTime={new Date(item.ts).toISOString()} className="tabular-nums">
                {timeAgo(item.ts, locale)}
              </time>
              {item.coins.length > 0 && (
                <span className="ml-auto hidden gap-1 sm:flex">
                  {item.coins.map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-line px-1.5 py-px font-mono text-[10px]"
                    >
                      {c}
                    </span>
                  ))}
                </span>
              )}
            </div>
            <p
              className={`mt-1 text-[14px] font-medium leading-snug text-heading transition-colors duration-200 group-hover:text-accent dark:group-hover:text-accent-mint ${
                compact ? "truncate" : "line-clamp-2"
              }`}
            >
              {item.title}
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}
