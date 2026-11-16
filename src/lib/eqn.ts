/**
 * eqn.ts —— 方程式新闻（EquationNews）数据层（仅服务端使用）
 *
 * 背景：api.eqn.news 的 REST JSON 被 Cloudflare 拦截（403 且无 CORS），
 * 但公开 RSS（api.eqn.news/public/rss）对服务端开放——因此走
 * 「服务端拉 RSS + ISR 增量再生成」方案，页面 HTML 直出快讯，
 * 无需客户端请求。
 *
 * 局限：RSS 只有中文标题，无币种字段——币种 chips 用标题匹配常见
 * symbol 的轻量启发式补全。
 */

export interface EqnItem {
  title: string;
  url: string;
  ts: number; // ms
  categories: string[];
  coins: string[]; // 从标题匹配出的币种
}

/** 常见币种词典（大写匹配） */
const COIN_DICT = [
  "BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK",
  "PEPE", "BONK", "WIF", "SHIB", "FLOKI", "NEIRO", "POPCAT", "TRUMP",
  "WLD", "SUI", "SEI", "AAVE", "UNI", "NEAR", "APT", "ARB", "OP",
  "JUP", "RAY", "BOME", "MEW", "MOODENG", "PENGU", "GOAT", "TON", "TRX",
];

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function extract(tag: string, xml: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? decodeEntities(m[1].trim()) : "";
}

function matchCoins(title: string): string[] {
  const upper = title.toUpperCase();
  const found: string[] = [];
  for (const sym of COIN_DICT) {
    // 词边界匹配，避免 DOGE 命中 "DO GENERAL"
    if (new RegExp(`(^|[^A-Z0-9])${sym}([^A-Z0-9]|$)`).test(upper)) {
      found.push(sym);
      if (found.length >= 4) break;
    }
  }
  return found;
}

/** 拉取并解析 RSS（失败返回空数组，组件侧优雅隐藏） */
export async function fetchEqnNews(limit = 60): Promise<EqnItem[]> {
  try {
    const res = await fetch("https://api.eqn.news/public/rss", {
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml
      .split("<item>")
      .slice(1)
      .map((chunk) => {
        const title = extract("title", chunk);
        const link = extract("link", chunk);
        const pubDate = extract("pubDate", chunk);
        const categories = [...chunk.matchAll(/<category>([\s\S]*?)<\/category>/g)].map(
          (m) => decodeEntities(m[1].trim())
        );
        const ts = Date.parse(pubDate);
        return {
          title,
          url: link,
          ts: Number.isFinite(ts) ? ts : Date.now(),
          categories,
          coins: matchCoins(title),
        };
      })
      .filter((i) => i.title && i.url);
    return items.slice(0, limit);
  } catch {
    return [];
  }
}
