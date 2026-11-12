/**
 * BlogRow.tsx —— 随笔/运营列表行
 * 标题在左、日期在右，下方一行小号元信息（标签 / 阅读时长），行间细分隔线。
 */

import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";

interface BlogRowProps {
  post: PostMeta;
  locale: Locale;
  t: Dictionary;
}

export default function BlogRow({ post, locale, t }: BlogRowProps) {
  return (
    <Link
      href={`/${locale}/writing/${post.slug}`}
      className="group grid grid-cols-[1fr_auto] items-baseline gap-x-5 border-b border-line py-4 no-underline"
    >
      <span className="text-[15px] font-medium leading-snug text-heading underline-offset-4 transition-colors duration-200 group-hover:text-accent group-hover:underline dark:group-hover:text-accent-mint">
        {post.title}
      </span>
      <time
        dateTime={post.date}
        className="shrink-0 text-sm tabular-nums text-muted"
      >
        {formatDate(post.date, locale)}
      </time>
      <span className="col-span-2 mt-1 text-xs text-muted">
        <span className="mr-2 rounded-full border border-line px-2 py-0.5">
          {t.category[post.category]}
        </span>
        {post.tags.length > 0 && <>{post.tags.join(" / ")} · </>}
        {t.post.minRead.replace("{n}", String(post.readingTime))}
      </span>
    </Link>
  );
}
