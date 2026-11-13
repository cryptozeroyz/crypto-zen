/**
 * storage.ts —— 文章/图片文件的存储适配层（后台管理专用）
 *
 * 两种模式，按环境变量自动切换：
 * - local（默认）：直接读写仓库目录，适用于本地开发
 * - github：通过 GitHub Contents API 读写仓库文件，
 *           适用于 Vercel 部署（serverless 文件系统是只读且临时的）。
 *           需要环境变量 GITHUB_TOKEN（repo 权限）与 GITHUB_REPO（owner/name）。
 *           写入即提交，Vercel 检测到仓库变化会自动重新部署，新内容随之上线。
 *
 * 文章目录：POSTS_DIR（中文）/ POSTS_EN_DIR（英文，自动翻译生成）。
 * 公开页面的读取仍然走 posts.ts 的本地文件（构建期静态生成），
 * 本文件只在 /api/admin 与 /admin 后台中使用。
 */

import fs from "fs";
import path from "path";

export const POSTS_DIR = "content/posts";
export const POSTS_EN_DIR = "content/posts-en";
export const UPLOADS_DIR = "public/uploads";

export interface RawPostFile {
  slug: string;
  content: string;
}

export type StorageAdapter = "local" | "github";

/** 当前使用的存储模式 */
export function getAdapterName(): StorageAdapter {
  return process.env.GITHUB_TOKEN && process.env.GITHUB_REPO ? "github" : "local";
}

/* ---------------- local 模式 ---------------- */

function localList(dir: string): RawPostFile[] {
  const abs = path.join(process.cwd(), dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({
      slug: f.replace(/\.md$/, ""),
      content: fs.readFileSync(path.join(abs, f), "utf8"),
    }));
}

function localSave(dir: string, slug: string, content: string): void {
  const abs = path.join(process.cwd(), dir);
  fs.mkdirSync(abs, { recursive: true });
  fs.writeFileSync(path.join(abs, `${slug}.md`), content, "utf8");
}

function localDelete(dir: string, slug: string): void {
  const file = path.join(process.cwd(), dir, `${slug}.md`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

/* ---------------- github 模式 ---------------- */

const GH_API = "https://api.github.com";

function ghHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function ghRepo(): string {
  return process.env.GITHUB_REPO as string;
}

async function ghGetFile(dir: string, slug: string): Promise<{ sha: string } | null> {
  const res = await fetch(
    `${GH_API}/repos/${ghRepo()}/contents/${dir}/${slug}.md`,
    { headers: ghHeaders(), cache: "no-store" }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API 读取失败：${res.status}`);
  const data = await res.json();
  return { sha: data.sha as string };
}

async function ghList(dir: string): Promise<RawPostFile[]> {
  const res = await fetch(`${GH_API}/repos/${ghRepo()}/contents/${dir}`, {
    headers: ghHeaders(),
    cache: "no-store",
  });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub API 列目录失败：${res.status}`);
  const files = (await res.json()) as Array<{ name: string; download_url: string | null }>;
  const out: RawPostFile[] = [];
  for (const f of files) {
    if (!f.name.endsWith(".md")) continue;
    const raw = await fetch(f.download_url as string, { cache: "no-store" });
    out.push({ slug: f.name.replace(/\.md$/, ""), content: await raw.text() });
  }
  return out;
}

async function ghSave(dir: string, slug: string, content: string): Promise<void> {
  const existing = await ghGetFile(dir, slug);
  const res = await fetch(
    `${GH_API}/repos/${ghRepo()}/contents/${dir}/${slug}.md`,
    {
      method: "PUT",
      headers: { ...ghHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `admin: save ${dir}/${slug}.md`,
        content: Buffer.from(content, "utf8").toString("base64"),
        ...(existing ? { sha: existing.sha } : {}),
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    const hint =
      res.status === 403
        ? "（403：请检查 GITHUB_TOKEN 是否拥有该仓库 Contents: Read and write 权限）"
        : "";
    throw new Error(`GitHub API 保存失败：${res.status} ${text}${hint}`);
  }
}

async function ghDelete(dir: string, slug: string): Promise<void> {
  const existing = await ghGetFile(dir, slug);
  if (!existing) return;
  const res = await fetch(
    `${GH_API}/repos/${ghRepo()}/contents/${dir}/${slug}.md`,
    {
      method: "DELETE",
      headers: { ...ghHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `admin: delete ${dir}/${slug}.md`,
        sha: existing.sha,
      }),
    }
  );
  if (!res.ok) throw new Error(`GitHub API 删除失败：${res.status}`);
}

/* ---------------- 通用文本文件（JSON 数据等） ---------------- */

const WATCHLIST_PATH = "content/watchlist.json";
const LINKS_PATH = "content/links.json";

function localReadText(relPath: string): string | null {
  const abs = path.join(process.cwd(), relPath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, "utf8");
}

function localSaveText(relPath: string, content: string): void {
  const abs = path.join(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
}

async function ghReadText(relPath: string): Promise<string | null> {
  const res = await fetch(
    `${GH_API}/repos/${ghRepo()}/contents/${relPath}`,
    { headers: ghHeaders(), cache: "no-store" }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API 读取失败：${res.status}`);
  const data = await res.json();
  return Buffer.from(String(data.content), "base64").toString("utf8");
}

async function ghSaveText(relPath: string, content: string): Promise<void> {
  // 先取 sha（存在则更新）
  let sha: string | undefined;
  const get = await fetch(`${GH_API}/repos/${ghRepo()}/contents/${relPath}`, {
    headers: ghHeaders(),
    cache: "no-store",
  });
  if (get.ok) sha = (await get.json()).sha as string;
  else if (get.status !== 404) throw new Error(`GitHub API 读取失败：${get.status}`);

  const res = await fetch(`${GH_API}/repos/${ghRepo()}/contents/${relPath}`, {
    method: "PUT",
    headers: { ...ghHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `admin: update ${relPath}`,
      content: Buffer.from(content, "utf8").toString("base64"),
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    const hint =
      res.status === 403
        ? "（403：请检查 GITHUB_TOKEN 是否拥有该仓库 Contents: Read and write 权限）"
        : "";
    throw new Error(`GitHub API 保存失败：${res.status} ${text}${hint}`);
  }
}

/** 读取仓库内的任意文本文件（本地或 GitHub），不存在返回 null */
export async function readTextFile(relPath: string): Promise<string | null> {
  return getAdapterName() === "github"
    ? ghReadText(relPath)
    : localReadText(relPath);
}

/** 保存仓库内的任意文本文件 */
export async function saveTextFile(relPath: string, content: string): Promise<void> {
  if (getAdapterName() === "github") return ghSaveText(relPath, content);
  localSaveText(relPath, content);
}

export { WATCHLIST_PATH, LINKS_PATH };

/* ---------------- 统一接口 ---------------- */

export async function listRawPosts(dir: string = POSTS_DIR): Promise<RawPostFile[]> {
  return getAdapterName() === "github" ? ghList(dir) : localList(dir);
}

export async function saveRawPost(
  dir: string,
  slug: string,
  content: string
): Promise<void> {
  if (getAdapterName() === "github") return ghSave(dir, slug, content);
  localSave(dir, slug, content);
}

export async function deleteRawPost(dir: string, slug: string): Promise<void> {
  if (getAdapterName() === "github") return ghDelete(dir, slug);
  localDelete(dir, slug);
}

/* ---------------- 图片上传 ---------------- */

function localSaveUpload(filename: string, data: Buffer): void {
  const dir = path.join(process.cwd(), UPLOADS_DIR);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), data);
}

async function ghSaveUpload(filename: string, data: Buffer): Promise<void> {
  const res = await fetch(
    `${GH_API}/repos/${ghRepo()}/contents/${UPLOADS_DIR}/${filename}`,
    {
      method: "PUT",
      headers: { ...ghHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `admin: upload ${filename}`,
        content: data.toString("base64"),
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    const hint =
      res.status === 403
        ? "（403：请检查 GITHUB_TOKEN 是否拥有该仓库 Contents: Read and write 权限）"
        : "";
    throw new Error(`GitHub 上传失败：${res.status} ${text}${hint}`);
  }
}

/** 保存上传的图片，返回可访问的公开路径（/uploads/xxx） */
export async function saveUpload(filename: string, data: Buffer): Promise<string> {
  if (getAdapterName() === "github") await ghSaveUpload(filename, data);
  else localSaveUpload(filename, data);
  return `/uploads/${filename}`;
}
