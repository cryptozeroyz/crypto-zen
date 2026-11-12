/**
 * translate.ts —— Markdown 文章自动翻译（中文 → 英文）
 *
 * 默认使用 MyMemory 免费翻译 API（无需密钥）：
 *   https://api.mymemory.translated.net/get?q=...&langpair=zh-CN|en-US
 * 匿名额度有限（约 5000 字符/天），适合作为初稿；
 * 如需更高质量/额度，可在此文件内替换为 DeepL / OpenAI 等 provider。
 *
 * 翻译策略：
 * - frontmatter：翻译 title / excerpt，其余字段（日期、分类、标签、封面、K线链接）保持不变
 * - 正文：逐行翻译，代码块与表格行原样保留；
 *   行内的行内代码、Markdown 链接和 URL 用占位符保护后再还原
 */

import { parseMarkdown, buildMarkdown, type FrontmatterFields } from "@/lib/frontmatter";

const API = "https://api.mymemory.translated.net/get";
const CHUNK_SIZE = 260; // 每个请求的字符上限（MyMemory 对 q 参数长度有限制）
const REQUEST_DELAY_MS = 350; // 免费接口限速保护

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** 把长文本切成 ≤CHUNK_SIZE 的段落（尽量在标点处断开） */
function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > CHUNK_SIZE) {
    let cut = rest.lastIndexOf("。", CHUNK_SIZE);
    if (cut < CHUNK_SIZE / 2) cut = rest.lastIndexOf("；", CHUNK_SIZE);
    if (cut < CHUNK_SIZE / 2) cut = rest.lastIndexOf("，", CHUNK_SIZE);
    if (cut < CHUNK_SIZE / 2) cut = CHUNK_SIZE;
    chunks.push(rest.slice(0, cut + 1));
    rest = rest.slice(cut + 1);
  }
  if (rest.trim()) chunks.push(rest);
  return chunks;
}

/** 调用翻译 API 翻译一段文本 */
async function translateSegment(text: string): Promise<string> {
  const res = await fetch(
    `${API}?q=${encodeURIComponent(text)}&langpair=zh-CN|en-US`,
    { signal: AbortSignal.timeout(20000) }
  );
  if (!res.ok) throw new Error(`翻译接口返回 ${res.status}`);
  const data = (await res.json()) as {
    responseStatus?: number;
    responseDetails?: string;
    responseData?: { translatedText?: string };
  };
  if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
    throw new Error(data.responseDetails || "翻译接口无结果");
  }
  return data.responseData.translatedText;
}

/** 翻译任意文本（自动分块、串行限速） */
export async function translateText(text: string): Promise<string> {
  const chunks = chunkText(text);
  const out: string[] = [];
  for (const chunk of chunks) {
    out.push(await translateSegment(chunk));
    await sleep(REQUEST_DELAY_MS);
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}

/** 用占位符保护行内的行内代码 / Markdown 链接 / URL，翻译后还原 */
async function translateLine(line: string): Promise<string> {
  const tokens: string[] = [];
  const protectedText = line.replace(
    /(`[^`]+`)|(!?\[[^\]]*\]\([^)]+\))|(https?:\/\/[^\s)<>"']+)/g,
    (m) => {
      tokens.push(m);
      return ` ZXQ${tokens.length - 1}ZXQ `;
    }
  );
  const translated = await translateText(protectedText);
  return translated.replace(/ZXQ\s*(\d+)\s*ZXQ/g, (_, i: string) => {
    const idx = Number(i);
    return tokens[idx] ?? "";
  });
}

/** 翻译整篇 Markdown（frontmatter + 正文），返回英文版完整文本 */
export async function translateMarkdown(raw: string): Promise<string> {
  const { fields, body } = parseMarkdown(raw);

  const enFields: FrontmatterFields = {
    ...fields,
    title: await translateText(fields.title),
    excerpt: fields.excerpt ? await translateText(fields.excerpt) : "",
  };
  await sleep(REQUEST_DELAY_MS);

  const outLines: string[] = [];
  let inFence = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      outLines.push(line);
      continue;
    }
    // 空行、代码块、表格行保留不译
    if (inFence || !line.trim() || /^\s*\|.*\|\s*$/.test(line)) {
      outLines.push(line);
      continue;
    }
    outLines.push(await translateLine(line));
    await sleep(REQUEST_DELAY_MS);
  }

  return buildMarkdown(enFields, outLines.join("\n"));
}
