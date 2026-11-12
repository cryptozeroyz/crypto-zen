/**
 * og-fonts.ts —— OG 图与自动封面共用的中文字体加载
 * 请求时从 Google Fonts 拉取 Noto Sans SC（旧 UA 返回 TTF），
 * 模块级缓存，失败返回 null（调用方需自行降级）。
 */

export interface OgFont {
  name: "NotoSansSC";
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
}

const fontCache = new Map<number, OgFont | null>();

export async function loadOgFont(weight: 400 | 700): Promise<OgFont | null> {
  if (fontCache.has(weight)) return fontCache.get(weight) ?? null;
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
    const font: OgFont = { name: "NotoSansSC", data, weight, style: "normal" };
    fontCache.set(weight, font);
    return font;
  } catch {
    fontCache.set(weight, null);
    return null;
  }
}
