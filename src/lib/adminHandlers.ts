/**
 * adminHandlers.ts —— 后台 API 的全部业务逻辑
 *
 * 为什么集中到一个文件：Vercel Hobby 套餐限制每个部署最多 12 个
 * Serverless Function。把 7 个 admin API 路由合并为一个 catch-all
 * 函数（/api/admin/[...path]），客户端请求路径保持不变。
 */

import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import {
  verifySessionToken,
  COOKIE_NAME,
  getAdminPassword,
  createSessionToken,
  SESSION_MS,
  assertSecretConfigured,
} from "@/lib/auth";
import {
  clientIp,
  loginAllowed,
  recordLoginFail,
  clearLoginFails,
} from "@/lib/loginRateLimit";
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
  LINKS_PATH,
} from "@/lib/storage";
import { parseMarkdown, isValidSlug } from "@/lib/frontmatter";
import { translateMarkdown } from "@/lib/translate";
import { fetchCoinData } from "@/lib/watchlist";

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
  /* 1. 登录限流：同 IP 10 分钟内失败 5 次锁定 10 分钟 */
  const ip = clientIp(req);
  const gate = loginAllowed(ip);
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, message: `尝试次数过多，请 ${Math.ceil(gate.retryAfterSec / 60)} 分钟后再试` },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } }
    );
  }

  /* 2. 读取密码 */
  let password = "";
  try {
    const body = await req.json();
    password = String(body.password ?? "");
  } catch {
    /* 按密码错误处理 */
  }

  /* 3. 环境变量自检（生产环境缺失 ADMIN_PASSWORD/SECRET 时 fail-closed） */
  let expected: string;
  try {
    expected = getAdminPassword();
    assertSecretConfigured();
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "认证配置错误" },
      { status: 500 }
    );
  }

  /* 4. 恒定时间比较，防时序侧信道 */
  const a = Buffer.from(String(password));
  const b = Buffer.from(expected);
  const match =
    a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!password || !match) {
    const locked = recordLoginFail(ip);
    return NextResponse.json(
      {
        ok: false,
        message: locked > 0 ? `尝试次数过多，已锁定 10 分钟` : "密码不正确",
      },
      { status: 401, headers: locked > 0 ? { "Retry-After": String(locked) } : undefined }
    );
  }

  clearLoginFails(ip);

  /* 5. 写会话 Cookie：HTTPS 下加 Secure（Caddy/Vercel 都会传 X-Forwarded-Proto） */
  const isHttps =
    req.headers.get("x-forwarded-proto") === "https" ||
    new URL(req.url).protocol === "https:";
  cookies().set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge: Math.floor(SESSION_MS / 1000),
  });

  return NextResponse.json({ ok: true });
}

export async function logoutPOST(req: Request) {
  /* 退出也需是已登录状态（防CSRF构造请求清cookie的语义混乱；无会话直接 401） */
  if (!isAuthed()) return unauthorized();
  /* Secure 属性与登录时一致，确保浏览器能精确删除 */
  const isHttps =
    req.headers.get("x-forwarded-proto") === "https" ||
    new URL(req.url).protocol === "https:";
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge: 0,
  });
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
  /** 首次关注时记录（新增时自动抓取） */
  followPrice?: number;
  followMcap?: number;
  /** 持仓数量 / 买入均价（后台维护） */
  holdAmount?: number;
  avgCost?: number;
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
  let holdAmount: number | undefined;
  let avgCost: number | undefined;
  try {
    const body = await req.json();
    ca = String(body.ca ?? "").trim();
    comment = String(body.comment ?? "").trim();
    holding = body.holding === true;
    // 持仓字段：允许 undefined（不修改）/ null（清除）/ 正数
    const parseNum = (v: unknown): number | undefined | null => {
      if (v === undefined) return undefined;
      if (v === null || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    };
    const amt = parseNum(body.holdAmount);
    const cost = parseNum(body.avgCost);
    if (amt !== undefined) holdAmount = amt === null ? undefined : amt;
    if (cost !== undefined) avgCost = cost === null ? undefined : cost;
  } catch {
    /* 下方统一校验 */
  }

  if (!isValidCa(ca)) return badRequest("合约地址（CA）格式不正确");

  const list = await readWatchlist();
  const existing = list.find((c) => c.ca.toLowerCase() === ca.toLowerCase());
  if (existing) {
    // 已存在则更新评价、持仓状态与持仓明细（关注时价格/市值永远保留，不重置）
    existing.comment = comment;
    existing.holding = holding;
    if (holdAmount !== undefined) existing.holdAmount = holdAmount;
    if (avgCost !== undefined) existing.avgCost = avgCost;
    // 兜底：历史数据缺关注基准（如添加时网络抖动）时，在下次编辑自动补录
    if (existing.followPrice === undefined) {
      try {
        const d = await fetchCoinData(ca);
        if (d) {
          existing.followPrice = d.priceUsd || undefined;
          existing.followMcap = d.marketCap ?? d.fdv;
        }
      } catch {
        /* 仍抓不到就下次再说 */
      }
    }
  } else {
    const entry: WatchCoinEntry = {
      ca,
      comment,
      addedAt: new Date().toISOString().slice(0, 10),
      holding,
    };
    if (holdAmount !== undefined) entry.holdAmount = holdAmount;
    if (avgCost !== undefined) entry.avgCost = avgCost;
    // 关注瞬间自动记录价格/市值，作为「关注以来」的基准（失败不阻塞保存）
    try {
      const d = await fetchCoinData(ca);
      if (d) {
        entry.followPrice = d.priceUsd || undefined;
        entry.followMcap = d.marketCap ?? d.fdv;
      }
    } catch {
      /* 抓不到就留空，看板显示 — */
    }
    list.unshift(entry);
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

/* ---------------- 链接收藏（好物推荐） ---------------- */

interface LinkEntry {
  title: string;
  url: string;
  type: "book" | "goods" | "tool" | "file";
  author?: string;
  comment: string;
  tags: string[];
  copyText?: string;
  fileUrl?: string;
  cover?: string;
  addedAt: string;
}

const LINK_TYPES = ["book", "goods", "tool", "file"] as const;

async function readLinks(): Promise<LinkEntry[]> {
  const raw = await readTextFile(LINKS_PATH);
  if (!raw) return [];
  try {
    const json = JSON.parse(raw);
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

async function writeLinks(list: LinkEntry[]): Promise<void> {
  await saveTextFile(LINKS_PATH, JSON.stringify(list, null, 2) + "\n");
}

function isValidUrl(url: string): boolean {
  return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(url) && url.length <= 500;
}

export async function linksGET() {
  if (!isAuthed()) return unauthorized();
  return NextResponse.json({ ok: true, links: await readLinks() });
}

export async function linksPOST(req: Request) {
  if (!isAuthed()) return unauthorized();

  let title = "";
  let url = "";
  let type: LinkEntry["type"] = "tool";
  let author = "";
  let comment = "";
  let tags: string[] = [];
  let copyText = "";
  let fileUrl = "";
  let cover = "";
  try {
    const body = await req.json();
    title = String(body.title ?? "").trim();
    url = String(body.url ?? "").trim();
    type = LINK_TYPES.includes(body.type) ? (body.type as LinkEntry["type"]) : "tool";
    author = String(body.author ?? "").trim();
    comment = String(body.comment ?? "").trim();
    tags = Array.isArray(body.tags)
      ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
      : [];
    copyText = String(body.copyText ?? "").trim();
    fileUrl = String(body.fileUrl ?? "").trim();
    cover = String(body.cover ?? "").trim();
  } catch {
    /* 下方统一校验 */
  }

  if (!title) return badRequest("请填写名称");
  if (!isValidUrl(url)) return badRequest("链接格式不正确（需以 http(s):// 开头）");
  if (type === "file" && !copyText && !fileUrl) {
    return badRequest("资料类条目请至少填写可复制文本或上传文件");
  }

  const list = await readLinks();
  const existing = list.find((l) => l.url === url);
  if (existing) {
    // 同 URL 视为更新
    Object.assign(existing, {
      title,
      type,
      author: author || undefined,
      comment,
      tags,
      copyText: copyText || undefined,
      fileUrl: fileUrl || undefined,
      cover: cover || undefined,
    });
  } else {
    list.unshift({
      title,
      url,
      type,
      author: author || undefined,
      comment,
      tags,
      copyText: copyText || undefined,
      fileUrl: fileUrl || undefined,
      cover: cover || undefined,
      addedAt: new Date().toISOString().slice(0, 10),
    });
  }

  try {
    await writeLinks(list);
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: `保存失败：${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, updated: Boolean(existing) });
}

export async function linksDELETE(req: Request) {
  if (!isAuthed()) return unauthorized();

  let url = "";
  try {
    const body = await req.json();
    url = String(body.url ?? "").trim();
  } catch {
    /* 下方统一校验 */
  }
  if (!url) return badRequest("缺少 url");

  const list = await readLinks();
  const next = list.filter((l) => l.url !== url);
  if (next.length === list.length) {
    return NextResponse.json({ ok: false, message: "未找到该链接" }, { status: 404 });
  }

  try {
    await writeLinks(next);
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: `保存失败：${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
