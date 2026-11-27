/**
 * indexnow.ts —— 向 Bing IndexNow 推送 URL（即时收录）
 *
 * 密钥：环境变量 INDEXNOW_KEY 优先（服务器/CI 管理），缺省用仓库内公开密钥
 *       （IndexNow 密钥是域名所有权证明，本就需通过 /{key}.txt 公开访问，非机密）。
 * 增量提交：状态文件记录每个 URL 的内容哈希——
 *   新增/变更 → 提交；删除 → 同样提交（Bing 重抓 404 后移除索引）；未变化 → 跳过。
 * 失败重试：指数退避 3 次；全程输出结构化日志（时间/URL/状态），CI 日志可查。
 *
 * 用法：
 *   npx tsx scripts/indexnow.ts            # 增量推送（对比状态文件）
 *   npx tsx scripts/indexnow.ts --all      # 全量推送（忽略状态）
 *   npx tsx scripts/indexnow.ts <url...>   # 只推送指定 URL
 * 状态文件：.indexnow-state.json（CI 用 actions/cache 跨次保留）
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { safeTokenSlug } from "../src/lib/coin-format";

const HOST = "cryptozen.fun";
const KEY = process.env.INDEXNOW_KEY ?? "b1e62fe5af0e13119ae36ce39d602ba9";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
];
const STATE_FILE = path.resolve(__dirname, "..", ".indexnow-state.json");

const ROOT = path.resolve(__dirname, "..");
const LOCALES = ["zh", "en"] as const;
/* 不提交：/news（noindex）、/bookmarks（私人）、/admin */
const PAGES = ["", "/dashboard", "/writing", "/topics", "/resources", "/about", "/alpha"];

const md5 = (s: string) => crypto.createHash("md5").update(s).digest("hex").slice(0, 12);
const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);

/* ---------- 构建 URL → 内容哈希（变更检测） ---------- */

function buildUrlHashes(): Map<string, string> {
  const map = new Map<string, string>();
  const add = (url: string, hash: string) => map.set(url, hash);

  /* 静态页面：哈希随构建走（内容变化频率低，用固定版本号+文章数联动） */
  let zhCount = 0, enCount = 0;
  for (const locale of LOCALES) {
    const dir = locale === "zh" ? "content/posts" : "content/posts-en";
    const abs = path.join(ROOT, dir);
    if (fs.existsSync(abs)) {
      for (const f of fs.readdirSync(abs).filter((x) => x.endsWith(".md"))) {
        const slug = f.replace(/\.md$/, "");
        const content = fs.readFileSync(path.join(abs, f), "utf8");
        add(`https://${HOST}/${locale}/writing/${slug}`, md5(content));
        if (locale === "zh") zhCount++; else enCount++;
      }
    }
  }

  let callsRaw = "";
  try {
    callsRaw = fs.readFileSync(path.join(ROOT, "content/calls.json"), "utf8");
  } catch {
    /* 空 */
  }
  const calls = callsRaw ? (JSON.parse(callsRaw) as Array<{ call?: { symbol?: string; narrativeType?: string } }>) : [];
  const symbols = [...new Set(calls.map((r) => (r?.call?.symbol ? safeTokenSlug(r.call.symbol) : null)).filter((x): x is string => Boolean(x)))];
  const topics = [...new Set(calls.map((r) => r?.call?.narrativeType).filter((x): x is string => Boolean(x)))];

  for (const locale of LOCALES) {
    for (const p of PAGES) add(`https://${HOST}/${locale}${p}`, md5(`page:${p}:v1:${zhCount}:${enCount}`));
    for (const s of symbols) {
      const slice = JSON.stringify(calls.filter((r) => r?.call?.symbol && safeTokenSlug(r.call.symbol) === s));
      add(`https://${HOST}/${locale}/token/${s}`, md5(slice));
    }
    for (const t of topics) {
      const slice = JSON.stringify(calls.filter((r) => r?.call?.narrativeType === t).map((r) => r?.call?.symbol));
      add(`https://${HOST}/${locale}/topics/${t}`, md5(slice));
    }
  }
  return map;
}

/* ---------- 状态文件 ---------- */

function loadState(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}
function saveState(map: Map<string, string>) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(Object.fromEntries(map), null, 1));
}

/* ---------- 提交（重试 3 次，指数退避） ---------- */

async function submit(urls: string[]): Promise<void> {
  const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls });
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const endpoint = ENDPOINTS[(attempt - 1) % ENDPOINTS.length];
      log(`提交至 ${endpoint}`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body,
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 200 || res.status === 202) {
        log(`提交成功 HTTP ${res.status}（${urls.length} 条）`);
        return;
      }
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`第 ${attempt}/3 次提交失败：${msg}`);
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

/* ---------- 主流程 ---------- */

async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0 && args[0] !== "--all") {
    log(`手动指定 ${args.length} 条 URL`);
    await submit(args);
    return;
  }

  const current = buildUrlHashes();
  const prev = args[0] === "--all" ? {} : loadState();

  const toSubmit: string[] = [];
  let added = 0, changed = 0, removed = 0;
  for (const [url, hash] of current) {
    if (!(url in prev)) { toSubmit.push(url); added++; }
    else if (prev[url] !== hash) { toSubmit.push(url); changed++; }
  }
  /* 删除的 URL 也提交：Bing 重抓 404 后移除索引 */
  for (const url of Object.keys(prev)) {
    if (!current.has(url)) { toSubmit.push(url); removed++; }
  }

  log(`URL 变更检测：新增 ${added} · 变更 ${changed} · 删除 ${removed} · 未变化 ${current.size - added - changed}（跳过）`);

  if (toSubmit.length === 0) {
    log("无变化，本次不提交");
    saveState(current);
    return;
  }

  await submit(toSubmit);
  saveState(current);
  log(`状态已保存（${current.size} 条）`);
}

main().catch((e) => {
  log(`IndexNow 推送失败：${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
