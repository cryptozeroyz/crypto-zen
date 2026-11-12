/**
 * /api/admin/posts/[slug]
 * - PUT：更新文章 { markdown }（整文件覆盖）
 * - DELETE：删除文章
 *
 * 两个方法都需要后台登录（cz_admin cookie）。
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { saveRawPost, deleteRawPost, listRawPosts, POSTS_DIR } from "@/lib/storage";
import { isValidSlug } from "@/lib/frontmatter";

function isAuthed(): boolean {
  return verifySessionToken(cookies().get(COOKIE_NAME)?.value);
}

interface Params {
  params: { slug: string };
}

export async function PUT(req: Request, { params }: Params) {
  if (!isAuthed()) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }
  if (!isValidSlug(params.slug)) {
    return NextResponse.json({ ok: false, message: "slug 非法" }, { status: 400 });
  }

  let markdown = "";
  try {
    const body = await req.json();
    markdown = String(body.markdown ?? "");
  } catch {
    /* 下方统一校验 */
  }
  if (!markdown.trim()) {
    return NextResponse.json(
      { ok: false, message: "内容不能为空" },
      { status: 400 }
    );
  }

  const existing = await listRawPosts(POSTS_DIR);
  if (!existing.some((f) => f.slug === params.slug)) {
    return NextResponse.json(
      { ok: false, message: "文章不存在" },
      { status: 404 }
    );
  }

  try {
    await saveRawPost(POSTS_DIR, params.slug, markdown);
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: `保存失败：${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!isAuthed()) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }
  if (!isValidSlug(params.slug)) {
    return NextResponse.json({ ok: false, message: "slug 非法" }, { status: 400 });
  }

  try {
    await deleteRawPost(POSTS_DIR, params.slug);
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: `删除失败：${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
