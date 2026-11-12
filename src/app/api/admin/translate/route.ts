/**
 * POST /api/admin/translate —— 把指定中文文章自动翻译为英文版
 * body: { slug }
 * 生成/更新 content/posts-en/<slug>.md。需要后台登录。
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { listRawPosts, saveRawPost, POSTS_DIR, POSTS_EN_DIR } from "@/lib/storage";
import { translateMarkdown } from "@/lib/translate";
import { isValidSlug } from "@/lib/frontmatter";

export async function POST(req: Request) {
  if (!verifySessionToken(cookies().get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }

  let slug = "";
  try {
    const body = await req.json();
    slug = String(body.slug ?? "").trim();
  } catch {
    /* 下方统一校验 */
  }
  if (!isValidSlug(slug)) {
    return NextResponse.json({ ok: false, message: "slug 非法" }, { status: 400 });
  }

  const zhPosts = await listRawPosts(POSTS_DIR);
  const source = zhPosts.find((f) => f.slug === slug);
  if (!source) {
    return NextResponse.json(
      { ok: false, message: "中文原文不存在" },
      { status: 404 }
    );
  }

  try {
    const enMarkdown = await translateMarkdown(source.content);
    await saveRawPost(POSTS_EN_DIR, slug, enMarkdown);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: `翻译失败：${e instanceof Error ? e.message : e}（可稍后重试，或换用付费翻译 API）`,
      },
      { status: 500 }
    );
  }
}
