/**
 * GET /api/cover/[slug]?locale=zh|en —— 自动生成文章封面 PNG（1200×675）
 * 文章未设置封面时，文章卡片用此地址作为封面图：
 * 按「标题 + 分类渐变 + 日期」实时渲染，输出长缓存。
 */

import { Resvg } from "@resvg/resvg-js";
import { getPostBySlug } from "@/lib/posts";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { renderCoverSvg, COVER_SIZE } from "../cover-template";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const locale: Locale = isLocale(
    new URL(req.url).searchParams.get("locale") ?? ""
  )
    ? (new URL(req.url).searchParams.get("locale") as Locale)
    : "zh";

  // 优先取对应语言版本，缺失回退中文版
  const post =
    getPostBySlug(params.slug, locale) ?? getPostBySlug(params.slug, "zh");
  if (!post) return new Response("Not Found", { status: 404 });

  const t = getDictionary(locale);

  try {
    const svg = await renderCoverSvg({
      title: post.title,
      category: post.category,
      date: post.date,
      label: t.category[post.category],
    });
    const png = new Resvg(svg, {
      fitTo: { mode: "width", value: COVER_SIZE.width },
    }).render().asPng();

    return new Response(new Uint8Array(png), {
      headers: {
        "content-type": "image/png",
        "cache-control":
          process.env.NODE_ENV === "development"
            ? "no-cache, no-store"
            : "public, immutable, no-transform, max-age=31536000",
      },
    });
  } catch {
    return new Response("Cover generation failed", { status: 500 });
  }
}
