/**
 * links.ts —— 链接收藏数据层（构建期读取 content/links.json）
 * 后台管理走存储适配器（见 adminHandlers 的 links* 系列）。
 */

import fs from "fs";
import path from "path";

export interface LinkItem {
  title: string;
  url: string;
  category: string;
  comment: string;
  addedAt: string;
}

const LINKS_FILE = path.join(process.cwd(), "content", "links.json");

/** 读取全部收藏（按分类稳定排序，构建期调用） */
export function getLinks(): LinkItem[] {
  if (!fs.existsSync(LINKS_FILE)) return [];
  try {
    const json = JSON.parse(fs.readFileSync(LINKS_FILE, "utf8"));
    if (!Array.isArray(json)) return [];
    return json
      .filter((l) => l && typeof l.url === "string" && typeof l.title === "string")
      .map((l) => ({
        title: String(l.title),
        url: String(l.url),
        category: String(l.category ?? "其他"),
        comment: String(l.comment ?? ""),
        addedAt: String(l.addedAt ?? ""),
      }));
  } catch {
    return [];
  }
}

/** 按分类分组（保持插入顺序） */
export function groupLinks(links: LinkItem[]): Array<{
  category: string;
  items: LinkItem[];
}> {
  const map = new Map<string, LinkItem[]>();
  for (const l of links) {
    const key = l.category || "其他";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(l);
  }
  return Array.from(map.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}
