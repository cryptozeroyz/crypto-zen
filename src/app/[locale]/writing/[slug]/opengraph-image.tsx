/**
 * opengraph-image.tsx —— 文章 OG 分享图自动生成（Next.js 约定式文件）
 * 1200×630 PNG，青绿品牌底 + 分类徽章 + 标题 + 站点署名。
 *
 * 直接用 satori + resvg 渲染（不用 next/og 的 Node 版——它在 Windows
 * 路径上读取内置字体会崩溃），Node 运行时读 Markdown 原文。
 * 中文字体在请求时从 Google Fonts 拉取（旧 UA 返回 TTF，带缓存）。
 */

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { getPostBySlug } from "@/lib/posts";
import { siteConfig } from "@/lib/siteConfig";

export const runtime = "nodejs";
export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* ---------- 中文字体加载 ---------- */

interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
}

const fontCache = new Map<number, OgFont | null>();

async function loadFont(weight: 400 | 700): Promise<OgFont | null> {
  if (fontCache.has(weight)) return fontCache.get(weight) ?? null;
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap",
      { headers: { "User-Agent": "Mozilla/4.0" } }
    ).then((r) => r.text());
    const re = new RegExp(
      `@font-face\\s*{[^}]*font-weight:\\s*${weight}[^}]*url\\((https:[^)]+?\\.ttf)\\)`
    );
    let url: string | null = css.match(re)?.[1] ?? null;
    if (!url) url = css.match(/url\((https:[^)]+?\.ttf)\)/)?.[1] ?? null;
    if (!url) throw new Error("no ttf url");
    const data = await fetch(url).then((r) => r.arrayBuffer());
    const font: OgFont = { name: "NotoSansSC", data, weight, style: "normal" };
    fontCache.set(weight, font);
    return font;
  } catch {
    fontCache.set(weight, null);
    return null;
  }
}

/* ---------- 组件 ---------- */

export default async function OgImage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const locale = params.locale === "en" ? "en" : "zh";
  const post = getPostBySlug(params.slug, locale);
  if (!post) return new Response("Not Found", { status: 404 });

  const [regular, bold] = await Promise.all([loadFont(400), loadFont(700)]);
  const fonts = [regular, bold].filter((f): f is OgFont => f !== null);
  if (fonts.length === 0) {
    return new Response("Font unavailable", { status: 500 });
  }

  // 注意：satori 的 padding + space-between / margin auto 组合存在布局 bug，
  // 这里全部使用绝对定位（根节点不设 padding）。
  const svg = await satori(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "linear-gradient(135deg, #0d3f3b 0%, #176f68 60%, #1b7a72 100%)",
          color: "#f2f7f6",
          fontFamily: "NotoSansSC",
          position: "relative",
        }}
      >
        {/* 左上：星芒 + 站点名 */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 72,
            top: 78,
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              position: "relative",
              width: 44,
              height: 44,
            }}
          >
            {[0, 30, 60, 90, 120, 150].map((deg) => (
              <div
                key={deg}
                style={{
                  position: "absolute",
                  left: 20,
                  top: 0,
                  width: 4,
                  height: 44,
                  borderRadius: 4,
                  background: "#81d8d0",
                  transform: `rotate(${deg}deg)`,
                  opacity: deg % 60 === 0 ? 1 : 0.55,
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 30, fontWeight: 700, marginLeft: 20 }}>
            {siteConfig.title}
          </span>
        </div>

        {/* 右上：分类徽章 */}
        <span
          style={{
            display: "flex",
            position: "absolute",
            top: 88,
            right: 72,
            fontSize: 22,
            fontWeight: 700,
            padding: "10px 24px",
            borderRadius: 12,
            background: "#81d8d0",
            color: "#0d3f3b",
          }}
        >
          {locale === "en"
            ? post.category === "research"
              ? "Research"
              : post.category === "ops"
                ? "Product & Ops"
                : "Essay"
            : post.category === "research"
              ? "研究报告"
              : post.category === "ops"
                ? "产品运营"
                : "随笔"}
        </span>

        {/* 标签 */}
        <span
          style={{
            display: "flex",
            position: "absolute",
            left: 72,
            top: 250,
            fontSize: 24,
            color: "#81d8d0",
            letterSpacing: 4,
          }}
        >
          {post.tags.slice(0, 3).join("  /  ") || "Crypto Zen"}
        </span>

        {/* 标题 */}
        <span
          style={{
            display: "flex",
            position: "absolute",
            left: 72,
            top: 305,
            width: 1050,
            fontSize: 58,
            fontWeight: 700,
            lineHeight: 1.3,
          }}
        >
          {post.title}
        </span>

        {/* 左下：署名 */}
        <span
          style={{
            display: "flex",
            position: "absolute",
            left: 72,
            bottom: 72,
            fontSize: 24,
            color: "#a7ccc7",
          }}
        >
          {siteConfig.title}
        </span>

        {/* 右下：日期 */}
        <span
          style={{
            display: "flex",
            position: "absolute",
            right: 72,
            bottom: 72,
            fontSize: 24,
            color: "#a7ccc7",
          }}
        >
          {post.date}
        </span>
      </div>
    ),
    { ...size, fonts }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size.width },
  });

  return new Response(new Uint8Array(resvg.render().asPng()), {
    headers: {
      "content-type": "image/png",
      "cache-control":
        process.env.NODE_ENV === "development"
          ? "no-cache, no-store"
          : "public, immutable, no-transform, max-age=31536000",
    },
  });
}
