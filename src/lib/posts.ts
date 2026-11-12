/**
 * posts.ts —— Markdown 文章数据层
 *
 * 从 content/posts/*.md（中文）与 content/posts-en/*.md（英文）读取文章：
 * - 用 gray-matter 解析 frontmatter（title / date / updated / category / cover / dexScreener / excerpt / tags / draft）
 * - 用 marked 把正文渲染成 HTML，并给 h2/h3 生成锚点 id、提取目录（TOC）
 * - 计算阅读时长、按日期倒序、提供上一篇/下一篇
 *
 * 仅在服务端使用（页面构建时执行），不要 import 进 client component。
 * 后台管理请使用 storage.ts（支持本地文件与 GitHub 两种存储）。
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { calcReadingTime } from "@/lib/utils";
import { POSTS_DIR, POSTS_EN_DIR } from "@/lib/storage";
import type { Category } from "@/lib/frontmatter";
import type { Locale } from "@/lib/i18n";

export type PostCategory = Category;

/** 目录条目 */
export interface TocItem {
  id: string;
  depth: 2 | 3;
  text: string;
}

/** 文章元信息（列表页/卡片用，不含正文） */
export interface PostMeta {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  updated?: string; // 更新日期（可选）
  category: PostCategory;
  excerpt: string;
  tags: string[];
  readingTime: number; // 分钟
  cover?: string; // 研究报告封面图
  dexScreener?: string; // DexScreener 交易对链接
}

/** 完整文章：元信息 + 渲染好的 HTML 正文 + 目录 */
export interface Post extends PostMeta {
  html: string;
  toc: TocItem[];
}

/** 标题 → 锚点 id（保留中英文字母与数字），用 seen 计数去重 */
function slugifyHeading(text: string, seen: Map<string, number>): string {
  const base =
    text
      .replace(/<[^>]*>/g, "")
      .replace(/[`*~_]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "section";
  const n = seen.get(base) ?? 0;
  seen.set(base, n + 1);
  return n === 0 ? base : `${base}-${n}`;
}

/** 渲染时的 id 计数器（同步解析，模块级变量安全） */
let renderSeen = new Map<string, number>();

/** marked 渲染器：外链新窗口打开、图片懒加载、h2/h3 生成锚点 */
const renderer = {
  link(href: string, title: string | null | undefined, text: string) {
    const titleAttr = title ? ` title="${title}"` : "";
    const isExternal = /^https?:\/\//.test(href);
    const externalAttrs = isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";
    return `<a href="${href}"${titleAttr}${externalAttrs}>${text}</a>`;
  },
  image(href: string, title: string | null | undefined, text: string) {
    const titleAttr = title ? ` title="${title}"` : "";
    return `<img src="${href}" alt="${text ?? ""}"${titleAttr} loading="lazy" decoding="async" />`;
  },
  heading(text: string, level: number) {
    if (level === 2 || level === 3) {
      const id = slugifyHeading(text, renderSeen);
      return `<h${level} id="${id}">${text}</h${level}>\n`;
    }
    return `<h${level}>${text}</h${level}>\n`;
  },
};

marked.use({ gfm: true, breaks: false, renderer });

/** 语言 → 文章目录 */
function dirForLocale(locale: Locale): string {
  return locale === "en" ? POSTS_EN_DIR : POSTS_DIR;
}

/** matter 的 data → PostMeta 公共字段（date 等字段的解析兜底） */
function toMeta(slug: string, data: Record<string, unknown>, content: string): PostMeta {
  const category: PostCategory =
    data.category === "research" || data.category === "ops" ? data.category : "essay";
  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? "1970-01-01"),
    updated: data.updated ? String(data.updated) : undefined,
    category,
    excerpt: String(data.excerpt ?? ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    readingTime: calcReadingTime(content),
    cover: data.cover ? String(data.cover) : undefined,
    dexScreener: data.dexScreener ? String(data.dexScreener) : undefined,
  };
}

/** 从 Markdown 正文提取 h2/h3 目录（与渲染时的 id 规则一致） */
function extractToc(content: string): TocItem[] {
  const seen = new Map<string, number>();
  const toc: TocItem[] = [];
  for (const token of marked.lexer(content)) {
    if (token.type === "heading" && (token.depth === 2 || token.depth === 3)) {
      toc.push({
        id: slugifyHeading(token.text, seen),
        depth: token.depth as 2 | 3,
        text: token.text.replace(/<[^>]*>/g, "").replace(/[`*~_]/g, "").trim(),
      });
    }
  }
  return toc;
}

/** 读取目录下所有文章（含 draft），并按日期倒序 */
function readAllPosts(locale: Locale): PostMeta[] {
  const dir = path.join(process.cwd(), dirForLocale(locale));
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

  const posts = files
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      return { ...toMeta(slug, data, content), draft: data.draft === true };
    })
    .filter((p) => p.draft !== true);

  // 日期倒序（新 -> 旧）
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** 全部已发布文章的元信息（按时间倒序） */
export function getAllPosts(locale: Locale = "zh"): PostMeta[] {
  return readAllPosts(locale);
}

/** 按分类筛选 */
export function getPostsByCategory(
  category: PostCategory,
  locale: Locale = "zh"
): PostMeta[] {
  return readAllPosts(locale).filter((p) => p.category === category);
}

/** 站点统计（首页统计带用） */
export function getSiteStats(locale: Locale = "zh") {
  const all = readAllPosts(locale);
  return {
    total: all.length,
    research: all.filter((p) => p.category === "research").length,
    essay: all.filter((p) => p.category === "essay").length,
    ops: all.filter((p) => p.category === "ops").length,
  };
}

/** 读取单篇文章（含 HTML 正文与目录），不存在或未发布返回 null */
export function getPostBySlug(slug: string, locale: Locale = "zh"): Post | null {
  const filePath = path.join(process.cwd(), dirForLocale(locale), `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  if (data.draft === true) return null;

  const toc = extractToc(content);
  renderSeen = new Map();
  const html = marked.parse(content) as string;

  return { ...toMeta(slug, data, content), html, toc };
}

/** 获取相邻文章：prev = 更早一篇，next = 更新一篇（按发布顺序） */
export function getAdjacentPosts(
  slug: string,
  locale: Locale = "zh"
): { prev: PostMeta | null; next: PostMeta | null } {
  const all = readAllPosts(locale);
  const index = all.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index < all.length - 1 ? all[index + 1] : null,
    next: index > 0 ? all[index - 1] : null,
  };
}
