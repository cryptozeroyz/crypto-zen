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
      className="group flex h-full flex-col overflow-hidden rounded-[4px_18px_4px_22px] border-[1.5px] border-dashed border-[#2a2230] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-solid hover:border-[#ff5b3a] hover:shadow-[6px_8px_0_rgba(92,42,82,.12)] hover:rotate-0 rotate-[-0.4deg]"
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
          className="text-[10px] tracking-[.2em] tabular-nums text-[#ff5b3a] font-bold"
        >
          {formatDate(post.date, locale)}
        </time>

        <h3 className="mt-1.5 font-serif font-bold leading-snug tracking-tight text-[#5c2a52] line-clamp-2">
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
