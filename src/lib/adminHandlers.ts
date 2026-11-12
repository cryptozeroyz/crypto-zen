/**
 * adminHandlers.ts —— 后台 API 的全部业务逻辑
 *
 * 为什么集中到一个文件：Vercel Hobby 套餐限制每个部署最多 12 个
 * Serverless Function。把 7 个 admin API 路由合并为一个 catch-all
 * 函数（/api/admin/[...path]），客户端请求路径保持不变。
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifySessionToken,
  COOKIE_NAME,
  getAdminPassword,
  createSessionToken,
  SESSION_MS,
} from "@/lib/auth";
import {
  listRawPosts,
  saveRawPost,
  deleteRawPost,
  readTextFile,
  saveTextFile,
  saveUpload,
  POSTS_DIR,
  POSTS_EN_DIR,
  WATCHLIST_PATH,
} from "@/lib/storage";
import { parseMarkdown, isValidSlug } from "@/lib/frontmatter";
import { translateMarkdown } from "@/lib/translate";

function isAuthed(): boolean {
  return verifySessionToken(cookies().get(COOKIE_NAME)?.value);
}

function unauthorized() {
  return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

/* ---------------- 登录 / 退出 ---------------- */

export async function loginPOST(req: Request) {
  let password = "";
  try {
    const body = await req.json();
    password = String(body.password ?? "");
  } catch {
    /* 按密码错误处理 */
  }

  if (!password || password !== getAdminPassword()) {
    return NextResponse.json({ ok: false, message: "密码不正确" }, { status: 401 });
  }

  cookies().set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_MS / 1000),
  });

  return NextResponse.json({ ok: true });
}

export async function logoutPOST() {
  cookies().delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}

/* ---------------- 文章 CRUD ---------------- */

export async function postsGET() {
  if (!isAuthed()) return unauthorized();

  const files = await listRawPosts(POSTS_DIR);
  const posts = files
    .map((f) => ({ slug: f.slug, ...parseMarkdown(f.content).fields }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return NextResponse.json({ ok: true, posts });
}

export async function postsPOST(req: Request) {
  if (!isAuthed()) return unauthorized();

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
    return badRequest("slug 只能包含小写字母、数字和连字符");
  }
  if (!markdown.trim()) return badRequest("内容不能为空");

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

export async function postPUT(slug: string, req: Request) {
  if (!isAuthed()) return unauthorized();
  if (!isValidSlug(slug)) return badRequest("slug 非法");

  let markdown = "";
  try {
    const body = await req.json();
    markdown = String(body.markdown ?? "");
  } catch {
    /* 下方统一校验 */
  }
  if (!markdown.trim()) return badRequest("内容不能为空");

  const existing = await listRawPosts(POSTS_DIR);
  if (!existing.some((f) => f.slug === slug)) {
    return NextResponse.json({ ok: false, message: "文章不存在" }, { status: 404 });
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

export async function postDELETE(slug: string) {
  if (!isAuthed()) return unauthorized();
  if (!isValidSlug(slug)) return badRequest("slug 非法");

  try {
    await deleteRawPost(POSTS_DIR, slug);
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: `删除失败：${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}

/* ---------------- 自动翻译 ---------------- */

export async function translatePOST(req: Request) {
  if (!isAuthed()) return unauthorized();

  let slug = "";
  try {
    const body = await req.json();
    slug = String(body.slug ?? "").trim();
  } catch {
    /* 下方统一校验 */
  }
  if (!isValidSlug(slug)) return badRequest("slug 非法");

  const zhPosts = await listRawPosts(POSTS_DIR);
  const source = zhPosts.find((f) => f.slug === slug);
  if (!source) {
    return NextResponse.json({ ok: false, message: "中文原文不存在" }, { status: 404 });
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

/* ---------------- 图片上传 ---------------- */

const ALLOWED_UPLOAD: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};
const MAX_UPLOAD = 5 * 1024 * 1024;

export async function uploadPOST(req: Request) {
  if (!isAuthed()) return unauthorized();

  let buffer: Buffer | null = null;
  let ext = "";
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      // base64 上传（Word 导入内嵌图片等场景）
      const body = await req.json();
      const dataBase64 = String(body.dataBase64 ?? "");
      const mime = String(body.contentType ?? "image/png");
      ext = ALLOWED_UPLOAD[mime] ?? ".png";
      buffer = Buffer.from(dataBase64, "base64");
    } else {
      // multipart 表单上传（编辑器/封面的文件选择）
      const form = await req.formData();
      const f = form.get("file");
      if (!(f instanceof File)) throw new Error("缺少文件");
      ext = ALLOWED_UPLOAD[f.type] ?? "";
      if (!ext) return badRequest("仅支持 PNG / JPG / WebP / GIF / SVG 图片");
      buffer = Buffer.from(await f.arrayBuffer());
    }
  } catch {
    return badRequest("缺少文件或格式不正确");
  }

  if (!buffer || buffer.length === 0) return badRequest("文件内容为空");
  if (buffer.length > MAX_UPLOAD) return badRequest("图片不能超过 5MB");

  const filename = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}${ext}`;

  try {
    const url = await saveUpload(filename, buffer);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: `上传失败：${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }
}

/* ---------------- 关注列表 ---------------- */

interface WatchCoinEntry {
  ca: string;
  comment: string;
  addedAt: string;
  holding?: boolean;
}

async function readWatchlist(): Promise<WatchCoinEntry[]> {
  const raw = await readTextFile(WATCHLIST_PATH);
  if (!raw) return [];
  try {
    const json = JSON.parse(raw);
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

async function writeWatchlist(list: WatchCoinEntry[]): Promise<void> {
  await saveTextFile(WATCHLIST_PATH, JSON.stringify(list, null, 2) + "\n");
}

function isValidCa(ca: string): boolean {
  return /^[A-Za-z0-9]{8,80}$/.test(ca);
}

export async function watchlistGET() {
  if (!isAuthed()) return unauthorized();
  return NextResponse.json({ ok: true, coins: await readWatchlist() });
}

export async function watchlistPOST(req: Request) {
  if (!isAuthed()) return unauthorized();

  let ca = "";
  let comment = "";
  let holding = false;
  try {
    const body = await req.json();
    ca = String(body.ca ?? "").trim();
    comment = String(body.comment ?? "").trim();
    holding = body.holding === true;
  } catch {
    /* 下方统一校验 */
  }

  if (!isValidCa(ca)) return badRequest("合约地址（CA）格式不正确");

  const list = await readWatchlist();
  const existing = list.find((c) => c.ca.toLowerCase() === ca.toLowerCase());
  if (existing) {
    // 已存在则更新评价与持仓状态（upsert）
    existing.comment = comment;
    existing.holding = holding;
  } else {
    list.unshift({
      ca,
      comment,
      addedAt: new Date().toISOString().slice(0, 10),
      holding,
    });
  }

  try {
    await writeWatchlist(list);
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: `保存失败：${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, updated: Boolean(existing) });
}

export async function watchlistDELETE(req: Request) {
  if (!isAuthed()) return unauthorized();

  let ca = "";
  try {
    const body = await req.json();
    ca = String(body.ca ?? "").trim();
  } catch {
    /* 下方统一校验 */
  }
  if (!ca) return badRequest("缺少 ca");

  const list = await readWatchlist();
  const next = list.filter((c) => c.ca.toLowerCase() !== ca.toLowerCase());
  if (next.length === list.length) {
    return NextResponse.json({ ok: false, message: "未找到该代币" }, { status: 404 });
  }

  try {
    await writeWatchlist(next);
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: `保存失败：${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
