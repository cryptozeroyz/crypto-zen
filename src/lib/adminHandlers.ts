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
import { fetchGeckoSpark } from "@/lib/gecko";

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

/* ---------------- 关注列表（投研成绩单） ---------------- */

const WHY_TAGS_PATH = "content/why-tags.json";

interface WatchCoinEntry {
  chain?: string;
  address: string; // 兼容读取：v1 数据可能只有 ca
  ca?: string;
  symbol?: string;
  name?: string;
  dex?: string;
  pairAddress?: string;
  pairLiquidity?: number;
  pairVolume24h?: number;
  status?: "watching" | "holding" | "exited";
  why?: string[];
  comment: string;
  addedAt: string;
  holding?: boolean; // v1 遗留，读取时映射 status
  followPrice?: number;
  followMcap?: number;
  holdAmount?: number;
  avgCost?: number;
  image?: string;
  /** 研究档案 */
  profile?: { narrative?: string; risks?: string; catalysts?: string; invalidate?: string };
  events?: Array<{
    type: string;
    date: string;
    price?: number;
    note: string;
    why?: string[];
  }>;
}

type WatchStatusV = "watching" | "holding" | "exited";
type EventTypeV =
  | "follow"
  | "open_position"
  | "add"
  | "reduce"
  | "close_position"
  | "unfollow";

const EVENT_STATUS: Record<EventTypeV, WatchStatusV> = {
  follow: "watching",
  open_position: "holding",
  add: "holding",
  reduce: "holding",
  close_position: "watching",
  unfollow: "exited",
};

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

async function readTags() {
  const raw = await readTextFile(WHY_TAGS_PATH);
  if (!raw) return [];
  try {
    const json = JSON.parse(raw);
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

function isValidCa(ca: string): boolean {
  return /^[A-Za-z0-9]{8,80}$/.test(ca);
}

export async function watchlistGET() {
  if (!isAuthed()) return unauthorized();
  return NextResponse.json({ ok: true, coins: await readWatchlist(), tags: await readTags() });
}

/** 保存标签体系（整体覆盖） */
export async function tagsPOST(req: Request) {
  if (!isAuthed()) return unauthorized();
  try {
    const body = await req.json();
    const tags = Array.isArray(body.tags) ? body.tags : [];
    const clean = tags
      .filter((t: { id?: string }) => t && typeof t.id === "string" && /^[a-z0-9_]{2,20}$/.test(t.id))
      .map((t: { id: string; zh?: string; en?: string }) => ({
        id: t.id,
        zh: String(t.zh ?? t.id),
        en: String(t.en ?? t.zh ?? t.id),
      }));
    if (clean.length === 0) return badRequest("至少保留一个标签");
    await saveTextFile(WHY_TAGS_PATH, JSON.stringify(clean, null, 2) + "\n");
    return NextResponse.json({ ok: true });
  } catch {
    return badRequest("格式不正确");
  }
}

/**
 * 追加投研时间线事件：行为 + 理由（不记数量）。
 * 自动携带当时价格（抓不到则留空），并按事件类型更新 status。
 */
export async function watchlistEventPOST(req: Request) {
  if (!isAuthed()) return unauthorized();
  let ca = "";
  let type = "";
  let note = "";
  let date = "";
  try {
    const body = await req.json();
    ca = String(body.ca ?? "").trim();
    type = String(body.type ?? "").trim();
    note = String(body.note ?? "").trim().slice(0, 500);
    date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.date ?? ""))
      ? String(body.date)
      : new Date().toISOString().slice(0, 10);
  } catch {
    /* 下方统一校验 */
  }
  if (!isValidCa(ca)) return badRequest("合约地址格式不正确");
  if (!(type in EVENT_STATUS)) return badRequest("未知事件类型");

  const list = await readWatchlist();
  const coin = list.find((c) => (c.address ?? c.ca ?? "").toLowerCase() === ca.toLowerCase());
  if (!coin) return badRequest("该代币不在关注列表");

  let price: number | undefined;
  try {
    const d = await fetchCoinData(coin.address ?? coin.ca!);
    if (d?.priceUsd) price = d.priceUsd;
  } catch {
    /* 价格缺失不阻塞记录 */
  }

  coin.events = Array.isArray(coin.events) ? coin.events : [];
  coin.events.push({ type, date, price, note });
  coin.status = EVENT_STATUS[type as EventTypeV];
  if (type === "unfollow" && note) coin.comment = coin.comment; // 不动原论点

  try {
    await writeWatchlist(list);
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: `保存失败：${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}

export async function watchlistPOST(req: Request) {
  if (!isAuthed()) return unauthorized();

  let ca = "";
  let comment = "";
  let holding = false;
  let why: string[] = [];
  let holdAmount: number | undefined;
  let avgCost: number | undefined;
  let pairAddress: string | null | undefined;
  let image: string | null | undefined;
  let profile: WatchCoinEntry["profile"];
  try {
    const body = await req.json();
    ca = String(body.ca ?? "").trim();
    comment = String(body.comment ?? "").trim();
    holding = body.holding === true;
    why = Array.isArray(body.why) ? body.why.map(String).slice(0, 6) : [];
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
    pairAddress =
      body.pairAddress === undefined ? undefined : body.pairAddress === null ? null : String(body.pairAddress);
    if (typeof body.image === "string") image = body.image.trim().slice(0, 200) || null;
    if (body.profile && typeof body.profile === "object") {
      const p = body.profile as Record<string, unknown>;
      profile = {
        narrative: String(p.narrative ?? "").trim().slice(0, 800) || undefined,
        risks: String(p.risks ?? "").trim().slice(0, 800) || undefined,
        catalysts: String(p.catalysts ?? "").trim().slice(0, 800) || undefined,
        invalidate: String(p.invalidate ?? "").trim().slice(0, 800) || undefined,
      };
    }
  } catch {
    /* 下方统一校验 */
  }

  if (!isValidCa(ca)) return badRequest("合约地址（CA）格式不正确");

  const list = await readWatchlist();
  const existing = list.find(
    (c) => (c.address ?? c.ca ?? "").toLowerCase() === ca.toLowerCase()
  );
  if (existing) {
    // 更新评价、标签、持仓明细、交易对覆盖（关注时价格/市值永远保留，不重置）
    existing.comment = comment;
    existing.why = why;
    existing.holding = holding;
    existing.status = holding ? "holding" : existing.status === "exited" ? "exited" : "watching";
    if (holdAmount !== undefined) existing.holdAmount = holdAmount;
    if (avgCost !== undefined) existing.avgCost = avgCost;
    if (pairAddress !== undefined) existing.pairAddress = pairAddress ?? undefined;
    if (image !== undefined) existing.image = image ?? undefined;
    if (profile) existing.profile = profile;
    // 同步更新首条 follow 事件的标签与论点
    const evs = Array.isArray(existing.events) ? existing.events : [];
    if (evs.length > 0 && evs[0].type === "follow") {
      evs[0].why = why;
      evs[0].note = comment;
    }
    existing.events = evs;
    /* 兜底：历史数据缺关注基准时在下次编辑自动补录 */
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
      address: ca,
      ca,
      status: holding ? "holding" : "watching",
      why,
      comment,
      addedAt: new Date().toISOString().slice(0, 10),
      holding,
      events: [
        {
          type: "follow",
          date: new Date().toISOString().slice(0, 10),
          note: comment,
          why,
        },
      ],
    };
    if (holdAmount !== undefined) entry.holdAmount = holdAmount;
    if (avgCost !== undefined) entry.avgCost = avgCost;
    if (image) entry.image = image;
    // 关注瞬间自动记录价格/市值 + 链/交易对信息，作为基准（失败不阻塞保存）
    try {
      const d = await fetchCoinData(ca);
      if (d) {
        entry.followPrice = d.priceUsd || undefined;
        entry.followMcap = d.marketCap ?? d.fdv;
        entry.chain = d.chainId;
        entry.symbol = d.symbol;
        entry.name = d.name;
        entry.dex = d.dexId;
        entry.pairAddress = d.pairAddress;
        entry.pairLiquidity = d.liquidity;
        entry.pairVolume24h = d.volume24h;
        entry.events![0].price = d.priceUsd || undefined;
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
  const next = list.filter((c) => (c.address ?? c.ca ?? "").toLowerCase() !== ca.toLowerCase());
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

/* ---------------- 研究日志（Research Journal） ---------------- */

const JOURNAL_PATH = "content/journal.json";

async function readJournal(): Promise<
  Array<Record<string, unknown> & { id: string }>
> {
  const raw = await readTextFile(JOURNAL_PATH);
  if (!raw) return [];
  try {
    const json = JSON.parse(raw);
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

export async function journalGET() {
  if (!isAuthed()) return unauthorized();
  return NextResponse.json({ ok: true, entries: await readJournal() });
}

export async function journalPOST(req: Request) {
  if (!isAuthed()) return unauthorized();
  try {
    const body = await req.json();
    const id = String(body.id ?? "").trim();
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.date ?? ""))
      ? String(body.date)
      : new Date().toISOString().slice(0, 10);
    const entry = {
      id: id || `j-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      date,
      tokens: (Array.isArray(body.tokens) ? body.tokens : [])
        .map(String)
        .map((s: string) => s.trim())
        .filter(Boolean)
        .slice(0, 8),
      tags: (Array.isArray(body.tags) ? body.tags : [])
        .map(String)
        .map((s: string) => s.trim())
        .filter(Boolean)
        .slice(0, 8),
      title: String(body.title ?? "").trim().slice(0, 120),
      body: String(body.body ?? "").trim(),
      thesis: String(body.thesis ?? "").trim().slice(0, 500) || undefined,
      risks: String(body.risks ?? "").trim().slice(0, 500) || undefined,
    };
    if (!entry.body && !entry.title) return badRequest("正文或标题至少填一项");
    const list = await readJournal();
    const now = new Date().toISOString();
    const existing = list.find((j) => j.id === entry.id);
    if (existing) {
      Object.assign(existing, entry, { updatedAt: now });
    } else {
      list.unshift({ ...entry, createdAt: now, updatedAt: now });
    }
    await saveTextFile(JOURNAL_PATH, JSON.stringify(list, null, 2) + "\n");
    return NextResponse.json({ ok: true, id: entry.id });
  } catch {
    return badRequest("格式不正确");
  }
}

export async function journalDELETE(req: Request) {
  if (!isAuthed()) return unauthorized();
  let id = "";
  try {
    id = String((await req.json()).id ?? "").trim();
  } catch {
    /* 下方校验 */
  }
  if (!id) return badRequest("缺少 id");
  const list = await readJournal();
  const next = list.filter((j) => j.id !== id);
  if (next.length === list.length)
    return NextResponse.json({ ok: false, message: "未找到该记录" }, { status: 404 });
  await saveTextFile(JOURNAL_PATH, JSON.stringify(next, null, 2) + "\n");
  return NextResponse.json({ ok: true });
}

/* ---------------- AI 快速研报 ---------------- */

export async function aiReportPOST(req: Request) {
  if (!isAuthed()) return unauthorized();
  let ca = "";
  try {
    ca = String((await req.json()).ca ?? "").trim();
  } catch { /* 校验 */ }
  if (!isValidCa(ca)) return badRequest("CA 格式不正确");

  const data = await fetchCoinData(ca).catch(() => null);
  if (!data) return badRequest("抓不到该代币的行情数据，无法生成研报");

  const spark = await fetchGeckoSpark(data.chainId, data.pairAddress).catch(() => null);
  const chg7d = spark && spark.length >= 2 ? ((spark[spark.length - 1] / spark[0] - 1) * 100).toFixed(1) : "—";
  const date = new Date().toISOString().slice(0, 10);
  const models: string[] = [];

  const dataBlock = `代币：${data.name}（$${data.symbol}）\n链/交易对：${data.chainId} / ${data.dexId}\n价格：$${data.priceUsd}｜24H涨跌：${data.change24h}%｜近7日：${chg7d}%\n市值：${data.marketCap ?? data.fdv ?? "未知"}｜流动性：${data.liquidity ?? "未知"}｜24H成交量：${data.volume24h ?? "未知"}\nDexScreener：${data.url}`;

  /* 阶段一：Grok 采集 X 叙事素材（未配置则跳过） */
  let narrative = "";
  if (process.env.GROK_API_KEY) {
    try {
      const gres = await fetch((process.env.GROK_BASE_URL || "https://api.xai.com/v1") + "/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROK_API_KEY}` },
        body: JSON.stringify({
          model: process.env.GROK_MODEL || "grok-3",
          temperature: 0.4,
          messages: [{ role: "user", content: `搜索 X（Twitter）上关于 ${data.name}（$${data.symbol}，${data.chainId} 链，合约 ${ca}）的讨论。输出中文要点清单（不要成文）：1) 主流叙事/梗是什么 2) 哪些 KOL 在讨论（给账号名）3) 社区情绪（狂热/质疑/撕裂）4) 主要争议点与质疑 5) 相关事件时间线。若讨论极少，直说"讨论极少"。` }],
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (gres.ok) {
        const gj = await gres.json();
        narrative = gj?.choices?.[0]?.message?.content ?? "";
        if (narrative) models.push("grok");
      }
    } catch { /* Grok 失败则仅用链上数据 */ }
  }

  const preamble = narrative
    ? `> ⚠️ 本文由 Grok（X 实时数据）+ DeepSeek 双模型基于公开信息自动生成（${date}），叙事部分来自社区讨论、未经证实；非投资建议，请自行 DYOR。\n\n`
    : `> ⚠️ 本文由 AI 基于公开链上数据自动生成（${date}），仅供快速了解，非投资建议；关键结论请自行 DYOR。\n\n`;

  /* 未配置 DeepSeek Key → 模板兜底 */
  if (!process.env.DEEPSEEK_API_KEY) {
    const tpl = `> 📋 模板速览（未配置 AI Key，由规则引擎基于公开数据生成）。\n\n## ${data.name}（$${data.symbol}）快速速览\n\n${dataBlock.replace(/\n/g, "\n- ")}\n\n### 待验证清单\n- [ ] 合约权限（黑名单/增发/暂停交易）\n- [ ] Dev 钱包历史\n- [ ] 前 10 持仓集中度\n- [ ] 池子年龄与流动性撤出风险\n`;
    return NextResponse.json({ ok: true, markdown: preamble.replace(/AI 基于公开链上数据自动生成|Grok（X 实时数据）\+ DeepSeek 双模型基于公开信息自动生成/, "模板基于公开数据自动生成") + tpl, ai: false, models: [] });
  }

  const prompt = `你是一位专业的 Memecoin 研究员和社区分析师，擅长快速梳理代币基本面、叙事来源、链上数据和社区氛围。请根据以下信息，生成一份结构清晰、客观中立的研报。

【代币基本信息】
- 代币名称：${data.name}
- Ticker：$${data.symbol}
- 合约地址：${ca}
- 链：${data.chainId}
- 发射平台/交易对：${data.dexId}
- 数据快照：价格 $${data.priceUsd}｜24H 涨跌 ${data.change24h}%｜近 7 日 ${chg7d}%｜市值 ${data.marketCap ?? data.fdv ?? "暂无"}｜流动性 ${data.liquidity ?? "暂无"}｜24H 成交量 ${data.volume24h ?? "暂无"}
- DexScreener：${data.url}
${narrative ? `
【X 社区实时讨论素材（来自 Grok，未经证实）】
${narrative}
` : ""}
【分析要求】从以下维度深度分析，严格按结构输出：
1. **项目概述**（150字以内）：一句话核心叙事 / 发射背景与时间线 / 当前市场定位
2. **叙事与 Meme 来源**：叙事起源（梗图、事件、人物、文化符号）/ 与当前热门叙事的契合度 / 叙事强度与可持续性评估
3. **社区氛围与情绪分析**（重点）：X 讨论热度与多空观点分布 / 关键 KOL 态度与参与度 / TG/Discord 氛围（如有）/ 情绪变化趋势 / 代表性高赞讨论总结
4. **链上与市场数据观察**：持仓集中度与大户行为 / 交易活跃度与资金流向 / 流动性与发射状态 / 近期异常交易或关键地址动向
5. **风险与机会**：主要风险点 / 潜在催化剂 / 短期 vs 中期观察重点
6. **综合评估**：社区氛围评分（1-10 附理由）/ 叙事强度评分（1-10）/ 风险等级（低/中/高）/ 一句话总结

输出要求：标题分段清晰；保持客观，不吹捧不绝对化；突出社区真实氛围而非堆砌数据；材料中没有的信息如实写"暂无数据"，禁止编造；结尾必须加上：以上内容仅供参考，不构成任何投资建议，请自行 DYOR。`;

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({ model: "deepseek-chat", temperature: 0.3, messages: [{ role: "user", content: prompt }] }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`);
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI 返回为空");
    models.push("deepseek");
    return NextResponse.json({ ok: true, markdown: preamble + content, ai: true, models });
  } catch (e) {
    return NextResponse.json({ ok: false, message: `AI 生成失败：${e instanceof Error ? e.message : e}` }, { status: 502 });
  }
}
