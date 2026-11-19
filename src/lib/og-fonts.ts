/**
 * og-fonts.ts —— OG 图与自动封面共用的中文字体加载
 * 优先级：1) 本地文件（部署时由 workflow 下载到 <cwd>/fonts/，VPS 无外网依赖）
 *         2) 运行时从 Google Fonts 拉取 TTF（旧 UA 返回 TTF）
 * 模块级缓存，失败返回 null（调用方需自行降级）。
 */

import fs from "fs";
import path from "path";

export interface OgFont {
  name: "NotoSansSC";
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
}

const fontCache = new Map<number, OgFont | null>();

/** 本地字体路径（standalone 部署时 workflow 会下载到这里） */
function localFontPath(weight: 400 | 700): string {
  return path.join(process.cwd(), "fonts", `NotoSansSC-${weight}.ttf`);
}

function tryLocal(weight: 400 | 700): OgFont | null {
  try {
    const p = localFontPath(weight);
    if (!fs.existsSync(p)) return null;
    const buf = fs.readFileSync(p);
    return {
      name: "NotoSansSC",
      data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      weight,
      style: "normal",
    };
  } catch {
    return null;
  }
}

async function tryGoogle(weight: 400 | 700): Promise<OgFont | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap",
      { headers: { "User-Agent": "Mozilla/4.0" } }
    ).then((r) => r.text());
    const re = new RegExp(
      `@font-face\\s*{[^}]*font-weight:\\s*${weight}[^}]*url\\((https:[^)]+?\\.ttf)\\)`
    );
    let url: string | null = css.match(re)?.[1] ?? null;
    if (!url) url = css.match(/url\((https:[^)]+?\.ttf)\)/)?.[1] ?? null;
    if (!url) throw new Error("no ttf url");
    const data = await fetch(url).then((r) => r.arrayBuffer());
    return { name: "NotoSansSC", data, weight, style: "normal" };
  } catch {
    return null;
  }
}

export async function loadOgFont(weight: 400 | 700): Promise<OgFont | null> {
  if (fontCache.has(weight)) return fontCache.get(weight) ?? null;
  const font = tryLocal(weight) ?? (await tryGoogle(weight));
  fontCache.set(weight, font);
  return font;
}
