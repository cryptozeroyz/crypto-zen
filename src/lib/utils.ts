/**
 * utils.ts —— 通用小工具：日期格式化（支持中英文）、阅读时长估算
 */

/**
 * 日期格式化：中文 "2026年11月8日"，英文 "Nov 8, 2026"。
 * 手动解析避免时区导致日期偏移一天的问题。
 */
export function formatDate(
  date: string,
  locale: "zh" | "en" = "zh"
): string {
  const [year, month, day] = date.split("-").map(Number);
  if (locale === "en") {
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return `${year}年${month}月${day}日`;
}

/**
 * 估算中文文章的阅读时长（分钟）。
 * 中文字符按约 400 字/分钟，英文单词按约 200 词/分钟，至少 1 分钟。
 */
export function calcReadingTime(content: string): number {
  const cjkChars = (content.match(/[一-鿿㐀-䶿]/g) || []).length;
  const words = (content.replace(/[一-鿿㐀-䶿]/g, " ").match(/[A-Za-z0-9]+/g) || [])
    .length;
  return Math.max(1, Math.round(cjkChars / 400 + words / 200));
}
