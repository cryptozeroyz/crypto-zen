/**
 * links.ts —— 好物推荐数据层（构建期读取 content/links.json）
 * 类型：book 图书 / goods 物品 / tool 工具 / file 资料（可复制文本或文件下载）
 * 后台管理走存储适配器（adminHandlers 的 links* 系列）。
 */

import fs from "fs";
import path from "path";

export type LinkType = "book" | "goods" | "tool" | "file";

export interface LinkItem {
  title: string;
  url: string;
  type: LinkType;
  /** 图书作者 / 来源（可选） */
  author?: string;
  comment: string;
  tags: string[];
  /** 资料类：一键复制的文本 */
  copyText?: string;
  /** 资料类：上传后的文件路径（/uploads/…） */
  fileUrl?: string;
  /** 图书/物品：上传的实体封面/图片（否则自动生成占位） */
  cover?: string;
  addedAt: string;
}

const LINKS_FILE = path.join(process.cwd(), "content", "links.json");

/** tab 展示顺序（UI 关注项；客户端组件请内联同序数组，勿从本文件导入值） */
export const LINK_TYPE_ORDER: LinkType[] = ["book", "goods", "tool", "file"];

/** 读取全部收藏（构建期调用） */
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
        type: (["book", "goods", "tool", "file"] as const).includes(l.type)
          ? (l.type as LinkType)
          : "tool",
        author: l.author ? String(l.author) : undefined,
        comment: String(l.comment ?? ""),
        tags: Array.isArray(l.tags) ? l.tags.map(String) : [],
        copyText: l.copyText ? String(l.copyText) : undefined,
        fileUrl: l.fileUrl ? String(l.fileUrl) : undefined,
        cover: l.cover ? String(l.cover) : undefined,
        addedAt: String(l.addedAt ?? ""),
      }));
  } catch {
    return [];
  }
}
