/**
 * ArticleCard.tsx —— 统一的文章卡片（原研报卡片格式）
 * 有封面显示封面；无封面自动生成「渐变 + 标题」封面，不再区分文章类型。
 */

import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";

interface ArticleCardProps {
  post: PostMeta;
  locale: Locale;
  t: Dictionary;
}

export default function ArticleCard({ post, locale, t }: ArticleCardProps) {
  return (
    <Link
      href={`/${locale}/writing/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/40"
    >
      {/* 封面（16:9）；未上传封面时由 /api/cover 按标题自动生成 */}
      <div className="aspect-[16/9] overflow-hidden bg-codebg">
        {post.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover}
            alt={`${post.title} cover`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/cover/${post.slug}?locale=${locale}`}
            alt={`${post.title} cover`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <time
          dateTime={post.date}
          className="text-[11px] tabular-nums text-muted"
        >
          {formatDate(post.date, locale)}
        </time>

        <h3 className="mt-1.5 font-bold leading-snug tracking-tight text-heading transition-colors duration-200 group-hover:text-accent dark:group-hover:text-accent-mint line-clamp-2">
          {post.title}
        </h3>

        <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-relaxed text-muted">
          {post.excerpt}
        </p>

        <p className="mt-3 text-[11px] text-muted">
          {post.tags.length > 0 && <>{post.tags.join(" / ")} · </>}
          {t.post.minRead.replace("{n}", String(post.readingTime))}
        </p>
      </div>
    </Link>
  );
}
