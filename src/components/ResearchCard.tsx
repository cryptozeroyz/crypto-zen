/**
 * ResearchCard.tsx —— 研究报告卡片
 * 封面图（16:9）+ 分类徽章 + 标题 + 摘要 + 标签/阅读时长。
 */

import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";

interface ResearchCardProps {
  post: PostMeta;
  locale: Locale;
  t: Dictionary;
}

export default function ResearchCard({ post, locale, t }: ResearchCardProps) {
  return (
    <Link
      href={`/${locale}/writing/${post.slug}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-card transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/40"
    >
      {/* 封面图 */}
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
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent to-accent-deep">
            <span className="font-serif text-2xl font-bold text-white/90">
              Research
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2.5 text-xs text-muted">
          <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent dark:text-accent-mint">
            {t.category[post.category]}
          </span>
          <time dateTime={post.date} className="tabular-nums">
            {formatDate(post.date, locale)}
          </time>
        </div>

        <h3 className="mt-2.5 font-bold leading-snug tracking-tight text-heading transition-colors duration-200 group-hover:text-accent dark:group-hover:text-accent-mint">
          {post.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {post.excerpt}
        </p>

        <p className="mt-3.5 text-xs text-muted">
          {post.tags.length > 0 && <>{post.tags.join(" / ")} · </>}
          {t.post.minRead.replace("{n}", String(post.readingTime))}
        </p>
      </div>
    </Link>
  );
}
