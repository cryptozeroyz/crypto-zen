/**
 * /api/admin/posts
 * - GET：列出全部文章（含草稿）的元信息 + 原始 Markdown（后台表格用）
 * - POST：新建文章 { slug, markdown }
 *
 * 两个方法都需要后台登录（cz_admin cookie）。
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { listRawPosts, saveRawPost, POSTS_DIR } from "@/lib/storage";
import { parseMarkdown, isValidSlug } from "@/lib/frontmatter";

function isAuthed(): boolean {
  return verifySessionToken(cookies().get(COOKIE_NAME)?.value);
}

export async function GET() {
  if (!isAuthed()) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }

  const files = await listRawPosts(POSTS_DIR);
  const posts = files
    .map((f) => {
      const { fields } = parseMarkdown(f.content);
      return { slug: f.slug, ...fields };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return NextResponse.json({ ok: true, posts });
}

export async function POST(req: Request) {
  if (!isAuthed()) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }

  let slug = "";
  let markdown = "";
  try {
    const body = await req.json();
    slug = String(body.slug ?? "").trim();
    markdown = String(body.markdown ?? "");
  } catch {
    /* 下方统一校验 */
  }

  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { ok: false, message: "slug 只能包含小写字母、数字和连字符" },
      { status: 400 }
    );
  }
  if (!markdown.trim()) {
    return NextResponse.json(
      { ok: false, message: "内容不能为空" },
      { status: 400 }
    );
  }

  const existing = await listRawPosts(POSTS_DIR);
  if (existing.some((f) => f.slug === slug)) {
    return NextResponse.json(
      { ok: false, message: "该 slug 已存在，请换一个" },
      { status: 409 }
    );
  }

  try {
    await saveRawPost(POSTS_DIR, slug, markdown);
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: `保存失败：${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
