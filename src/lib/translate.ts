/**
 * translate.ts —— Markdown 文章自动翻译（中文 → 英文）
 *
 * 首选 DeepSeek（服务器已配置 DEEPSEEK_API_KEY，AI 研报同款通道，稳定可靠）；
 * 未配置 key 时回退 MyMemory 免费接口（匿名额度约 5000 字符/天，仅作兜底）。
 *
 * 翻译策略：
 * - frontmatter：翻译 title / excerpt，其余字段（日期、分类、标签、封面、K线链接）保持不变
 * - 正文：DeepSeek 整段翻译（保留 Markdown/代码块/链接结构）；MyMemory 兜底时逐行翻译并占位保护
 */

import { parseMarkdown, buildMarkdown, type FrontmatterFields } from "@/lib/frontmatter";

/* ---------------- DeepSeek（首选） ---------------- */

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

async function deepseekTranslate(text: string): Promise<string> {
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "你是专业的加密货币与金融内容翻译。把用户给的中文 Markdown 片段翻译成地道、专业的英文。" +
            "严格保留 Markdown 语法结构（标题层级、列表、引用、表格、链接、图片、行内代码），" +
            "代码块内容原样保留不翻译；不增删任何内容；只输出译文，不要任何解释或前后缀。",
        },
        { role: "user", content: text },
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`);
  const json = await res.json();
  const out = json?.choices?.[0]?.message?.content;
  if (!out || typeof out !== "string") throw new Error("DeepSeek 返回为空");
  return out.trim();
}

/** 按空行分段，每段 ≤ maxChars，尽量不在段落中间断开 */
function splitByParagraphs(text: string, maxChars: number): string[] {
  const paras = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let cur = "";
  for (const p of paras) {
    if (cur && cur.length + p.length + 2 > maxChars) {
      chunks.push(cur);
      cur = p;
    } else {
      cur = cur ? `${cur}\n\n${p}` : p;
    }
  }
  if (cur.trim()) chunks.push(cur);
  return chunks;
}

/* ---------------- MyMemory（兜底） ---------------- */

const MYMEMORY_API = "https://api.mymemory.translated.net/get";
const CHUNK_SIZE = 260;
const REQUEST_DELAY_MS = 350;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

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

async function mymemorySegment(text: string): Promise<string> {
  const res = await fetch(
    `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=zh-CN|en-US`,
    { signal: AbortSignal.timeout(20000) }
  );
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = (await res.json()) as {
    responseStatus?: number;
    responseDetails?: string;
    responseData?: { translatedText?: string };
  };
  if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
    throw new Error(data.responseDetails || "MyMemory 无结果（可能超出每日免费额度）");
  }
  return data.responseData.translatedText;
}

async function mymemoryText(text: string): Promise<string> {
  const chunks = chunkText(text);
  const out: string[] = [];
  for (const chunk of chunks) {
    out.push(await mymemorySegment(chunk));
    await sleep(REQUEST_DELAY_MS);
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}

/* ---------------- 对外接口 ---------------- */

/** 翻译任意文本（自动选择 provider） */
export async function translateText(text: string): Promise<string> {
  if (process.env.DEEPSEEK_API_KEY) return deepseekTranslate(text);
  return mymemoryText(text);
}

/** 翻译整篇 Markdown（frontmatter + 正文），返回英文版完整文本 */
export async function translateMarkdown(raw: string): Promise<string> {
  const { fields, body } = parseMarkdown(raw);
  const useDeepseek = Boolean(process.env.DEEPSEEK_API_KEY);

  const enFields: FrontmatterFields = {
    ...fields,
    title: await translateText(fields.title),
    excerpt: fields.excerpt ? await translateText(fields.excerpt) : "",
  };

  let enBody: string;
  if (useDeepseek) {
    /* DeepSeek：按空行分段（≤4000 字符），保留代码块/表格/链接结构 */
    const parts = splitByParagraphs(body, 4000);
    const translated: string[] = [];
    for (const part of parts) {
      translated.push(await deepseekTranslate(part));
    }
    enBody = translated.join("\n\n");
  } else {
    /* MyMemory 兜底：逐行翻译，代码块与表格行原样保留 */
    const outLines: string[] = [];
    let inFence = false;
    for (const line of body.split(/\r?\n/)) {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        outLines.push(line);
        continue;
      }
      if (inFence || !line.trim() || /^\s*\|.*\|\s*$/.test(line)) {
        outLines.push(line);
        continue;
      }
      outLines.push(await mymemoryLine(line));
      await sleep(REQUEST_DELAY_MS);
    }
    enBody = outLines.join("\n");
  }

  return buildMarkdown(enFields, enBody);
}

/** MyMemory 行内翻译：占位符保护行内代码 / 链接 / URL */
async function mymemoryLine(line: string): Promise<string> {
  const tokens: string[] = [];
  const protectedText = line.replace(
    /(`[^`]+`)|(!?\[[^\]]*\]\([^)]+\))|(https?:\/\/[^\s)<>"']+)/g,
    (m) => {
      tokens.push(m);
      return ` ZXQ${tokens.length - 1}ZXQ `;
    }
  );
  const translated = await mymemoryText(protectedText);
  return translated.replace(/ZXQ\s*(\d+)\s*ZXQ/g, (_, i: string) => {
    const idx = Number(i);
    return tokens[idx] ?? "";
  });
}
