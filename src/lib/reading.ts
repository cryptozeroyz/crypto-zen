/**
 * reading.ts —— 访客阅读历史与收藏（纯客户端，localStorage）
 *
 * - cz_reading_history：{ slug, at }[]，按阅读时间倒序，最多 10 条
 * - cz_bookmarks：slug[]，收藏列表（无顺序语义，展示时按收藏时间倒序存 {slug, at}）
 *
 * 仅在浏览器执行；所有函数都做了 SSR/隐私模式兜底。
 */

export interface ReadingRecord {
  slug: string;
  at: number;
}

const HISTORY_KEY = "cz_reading_history";
const BOOKMARK_KEY = "cz_bookmarks";
const HISTORY_LIMIT = 10;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 隐私模式等场景忽略 */
  }
}

/* ---------------- 阅读历史 ---------------- */

export function getHistory(): ReadingRecord[] {
  return read<ReadingRecord[]>(HISTORY_KEY, []);
}

/** 记录一次阅读（去重并置顶，裁剪到上限） */
export function recordRead(slug: string): ReadingRecord[] {
  const list = getHistory().filter((r) => r.slug !== slug);
  list.unshift({ slug, at: Date.now() });
  const next = list.slice(0, HISTORY_LIMIT);
  write(HISTORY_KEY, next);
  return next;
}

export function clearHistory(): void {
  write(HISTORY_KEY, []);
}

/* ---------------- 收藏 ---------------- */

export function getBookmarks(): ReadingRecord[] {
  return read<ReadingRecord[]>(BOOKMARK_KEY, []);
}

export function isBookmarked(slug: string): boolean {
  return getBookmarks().some((r) => r.slug === slug);
}

/** 切换收藏状态，返回切换后的状态 */
export function toggleBookmark(slug: string): boolean {
  const list = getBookmarks();
  const idx = list.findIndex((r) => r.slug === slug);
  if (idx >= 0) {
    list.splice(idx, 1);
    write(BOOKMARK_KEY, list);
    return false;
  }
  list.unshift({ slug, at: Date.now() });
  write(BOOKMARK_KEY, list);
  return true;
}

/* ---------------- 展示辅助 ---------------- */

/** 相对时间（ zh/en 简写） */
export function timeAgo(at: number, locale: "zh" | "en"): string {
  const min = Math.floor((Date.now() - at) / 60_000);
  const t = (key: string, n: number) => key.replace("{n}", String(n));
  const ZH = { just: "刚刚", min: "{n} 分钟前", hour: "{n} 小时前", day: "{n} 天前" };
  const EN = { just: "just now", min: "{n}m ago", hour: "{n}h ago", day: "{n}d ago" };
  const L = locale === "zh" ? ZH : EN;
  if (min < 1) return L.just;
  if (min < 60) return t(L.min, min);
  const hours = Math.floor(min / 60);
  if (hours < 24) return t(L.hour, hours);
  return t(L.day, Math.floor(hours / 24));
}
