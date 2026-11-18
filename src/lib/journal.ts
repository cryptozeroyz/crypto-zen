/**
 * journal.ts —— 研究日志数据层（Phase 2 Wave 1）
 *
 * 介于"时间线一句话"和"正式文章"之间的碎片研究记录。
 * 存 content/journal.json（数组），后台可增删改；公开侧按 tokens 字段
 * 与关注列表联动（symbol 或 CA 匹配），并入代币时间线展示。
 * 标签为自由主题标签（筹码/情绪/鲸鱼…），与 why-tags（关注动机）相互独立。
 */

import fs from "fs";
import path from "path";

export interface JournalEntry {
  id: string; // j-<base36 时间>-<rand>
  date: string; // YYYY-MM-DD
  tokens: string[]; // symbol 或 CA（复用文章联动逻辑）
  tags: string[]; // 自由主题标签
  title: string; // 可空，短标题
  body: string; // Markdown 正文（碎片观察/假设/数据）
  thesis?: string; // 可选：判断
  risks?: string; // 可选：风险
  createdAt: string;
  updatedAt: string;
}

const JOURNAL_FILE = path.join(process.cwd(), "content", "journal.json");

export function getJournal(): JournalEntry[] {
  if (!fs.existsSync(JOURNAL_FILE)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(JOURNAL_FILE, "utf8"));
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((j) => j && typeof j.id === "string" && typeof j.body === "string")
      .map((j) => ({
        id: String(j.id),
        date: String(j.date ?? ""),
        tokens: Array.isArray(j.tokens) ? j.tokens.map(String) : [],
        tags: Array.isArray(j.tags) ? j.tags.map(String) : [],
        title: String(j.title ?? ""),
        body: String(j.body),
        thesis: typeof j.thesis === "string" && j.thesis ? j.thesis : undefined,
        risks: typeof j.risks === "string" && j.risks ? j.risks : undefined,
        createdAt: String(j.createdAt ?? ""),
        updatedAt: String(j.updatedAt ?? ""),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

export function makeJournalId(): string {
  return `j-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
