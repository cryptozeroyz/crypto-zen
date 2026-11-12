/**
 * frontmatter.ts —— 轻量 frontmatter 解析/构建工具（零依赖）
 *
 * 只支持本站编辑器生成的 YAML 子集（标量字段 + tags 列表），
 * 前后台共用：后台编辑器用它读取和生成 Markdown 文件。
 */

/** 文章分类：个人随笔 / 研究报告 / 产品运营 */
export type Category = "essay" | "research" | "ops";

export interface FrontmatterFields {
  title: string;
  date: string; // YYYY-MM-DD
  updated: string; // 更新日期（可选）
  category: Category;
  excerpt: string;
  tags: string[];
  cover: string; // 研究报告封面图路径/URL，可为空
  dexScreener: string; // DexScreener 交易对链接，可为空
  draft: boolean;
}

export const EMPTY_FIELDS: FrontmatterFields = {
  title: "",
  date: "",
  updated: "",
  category: "essay",
  excerpt: "",
  tags: [],
  cover: "",
  dexScreener: "",
  draft: false,
};

/** YAML 字符串转义（仅处理双引号与反斜杠） */
function yq(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** 去掉首尾成对的引号 */
function unq(s: string): string {
  const t = s.trim();
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
    return t.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return t;
}

/**
 * 解析 Markdown 文本（含 frontmatter）。
 * 返回 fields（缺的字段用默认值补全）与正文。
 */
export function parseMarkdown(raw: string): {
  fields: FrontmatterFields;
  body: string;
} {
  const fields: FrontmatterFields = { ...EMPTY_FIELDS };
  let body = raw;

  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (m) {
    body = raw.slice(m[0].length);
    let lastKey: keyof FrontmatterFields | null = null;
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z]+):\s*(.*)$/);
      if (kv) {
        const key = kv[1] as keyof FrontmatterFields;
        const value = kv[2].trim();
        lastKey = key;
        if (key === "tags") {
          // 支持两种写法：tags: ["a", "b"]（行内）与 tags:\n  - "a"（块状）
          fields.tags = value.startsWith("[")
            ? value
                .slice(1, value.endsWith("]") ? -1 : undefined)
                .split(",")
                .map((t) => unq(t))
                .filter(Boolean)
            : [];
        } else if (key === "draft") {
          fields.draft = value === "true";
        } else if (key in fields) {
          (fields as unknown as Record<string, string>)[key] = unq(value);
        }
        continue;
      }
      // tags 列表项：  - "xxx"
      const item = line.match(/^\s+-\s*(.*)$/);
      if (item && lastKey === "tags") {
        fields.tags.push(unq(item[1]));
      }
    }
  }

  return { fields, body: body.replace(/^\n+/, "") };
}

/** 由字段和正文生成完整 Markdown 文本 */
export function buildMarkdown(fields: FrontmatterFields, body: string): string {
  const f = fields;
  const lines: string[] = [
    "---",
    `title: "${yq(f.title)}"`,
    `date: "${yq(f.date)}"`,
  ];
  if (f.updated.trim()) lines.push(`updated: "${yq(f.updated.trim())}"`);
  lines.push(`category: "${f.category}"`);
  if (f.cover.trim()) lines.push(`cover: "${yq(f.cover.trim())}"`);
  if (f.dexScreener.trim())
    lines.push(`dexScreener: "${yq(f.dexScreener.trim())}"`);
  lines.push(`excerpt: "${yq(f.excerpt)}"`);
  lines.push("tags:");
  for (const tag of f.tags) lines.push(`  - "${yq(tag)}"`);
  lines.push(`draft: ${f.draft ? "true" : "false"}`);
  lines.push("---", "");
  return lines.join("\n") + "\n" + body.trim() + "\n";
}

/** slug 校验：只允许小写字母、数字、连字符，防止路径穿越 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,80}$/.test(slug);
}
