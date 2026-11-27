/**
 * indexnow.ts —— 向 Bing IndexNow 推送全站 URL（即时收录）
 *
 * 密钥文件：public/3df4f0a86a9cc191feaafedde7394c22.txt（根路径可访问即证明所有权）
 * 用法：
 *   npx tsx scripts/indexnow.ts            # 推送全站 URL（页面/文章/代币/主题，中英）
 *   npx tsx scripts/indexnow.ts <url...>   # 只推送指定 URL
 * 部署流水线在重启成功后自动执行全量推送（站点规模小，远低于每日 1 万条限额）。
 */

import fs from "fs";
import path from "path";
import { safeTokenSlug } from "../src/lib/coin-format";

const HOST = "cryptozen.fun";
const KEY = "3df4f0a86a9cc191feaafedde7394c22";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

const ROOT = path.resolve(__dirname, "..");
const LOCALES = ["zh", "en"] as const;
const PAGES = ["", "/dashboard", "/writing", "/topics", "/resources", "/about", "/alpha", "/bookmarks"];

function readSlugs(dir: string): string[] {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

function callMeta(): { symbols: string[]; topics: string[] } {
  try {
    const raw = fs.readFileSync(path.join(ROOT, "content/calls.json"), "utf8");
    const list = JSON.parse(raw) as Array<{ call?: { symbol?: string; narrativeType?: string } }>;
    return {
      symbols: [...new Set(list.map((r) => (r?.call?.symbol ? safeTokenSlug(r.call.symbol) : null)).filter((x): x is string => Boolean(x)))],
      topics: [...new Set(list.map((r) => r?.call?.narrativeType).filter((x): x is string => Boolean(x)))],
    };
  } catch {
    return { symbols: [], topics: [] };
  }
}

function buildAllUrls(): string[] {
  const { symbols, topics } = callMeta();
  const urls: string[] = [];
  for (const locale of LOCALES) {
    for (const p of PAGES) urls.push(`https://${HOST}/${locale}${p}`);
    for (const slug of readSlugs("content/posts")) {
      if (locale === "zh") urls.push(`https://${HOST}/zh/writing/${slug}`);
    }
    for (const slug of readSlugs("content/posts-en")) {
      if (locale === "en") urls.push(`https://${HOST}/en/writing/${slug}`);
    }
    /* 代币页中英都有内容（数据语言中立），都推 */
    for (const s of symbols) urls.push(`https://${HOST}/${locale}/token/${s}`);
    for (const t of topics) urls.push(`https://${HOST}/${locale}/topics/${t}`);
  }
  return [...new Set(urls)];
}

async function submit(urls: string[]): Promise<void> {
  if (urls.length === 0) {
    console.log("没有需要推送的 URL");
    return;
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
    signal: AbortSignal.timeout(30_000),
  });
  /* 200=已受理 202=已受理待验证 key；4xx 才是失败 */
  if (res.status === 200 || res.status === 202) {
    console.log(`IndexNow 已受理 ${urls.length} 条 URL（HTTP ${res.status}）`);
    return;
  }
  const body = await res.text().catch(() => "");
  throw new Error(`IndexNow 返回 ${res.status}: ${body.slice(0, 200)}`);
}

async function main() {
  const args = process.argv.slice(2);
  const urls = args.length > 0 ? args : buildAllUrls();
  console.log(`推送 ${urls.length} 条 URL 到 IndexNow…`);
  await submit(urls);
}

main().catch((e) => {
  console.error("IndexNow 推送失败:", e instanceof Error ? e.message : e);
  process.exit(1);
});
