"use client";

/**
 * NewsBoard.tsx —— 方程式新闻全频道看板（客户端）
 *
 * 数据：/api/market?type=eqn（服务端走 MCP 协议代理 api.eqn.news，
 * 15 个频道 + 关键词/币种搜索，响应缓存 60s），页面静态化、客户端轮询 120s。
 * 这样不新增 Vercel 函数（Hobby 12 上限），国内访客也只连本站域名。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { timeAgo } from "@/lib/reading";
import type { Dictionary, Locale } from "@/lib/i18n";

interface EqnMcpItem {
  no: number;
  time: string;
  channels: string[];
  source: string;
  zh: string;
  en: string;
  coins: string[];
  url: string;
}

/** 频道展示顺序（all 在最前） */
const ORDER = [
  "all",
  "main",
  "alpha",
  "oi",
  "pricechange",
  "cz",
  "major",
  "binance",
  "korea",
  "tier2",
  "tier3",
  "earn",
  "tradfi",
  "tfmoves",
  "hl",
];

/** 频道徽章配色（按频道气质分组） */
function channelColor(key: string): string {
  if (key === "oi" || key === "pricechange") return "bg-red-500/10 text-red-600 dark:text-red-400";
  if (key === "alpha") return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  if (key === "cz") return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
  if (key === "earn") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (key === "tradfi" || key === "tfmoves") return "bg-violet-500/10 text-violet-600 dark:text-violet-400";
  return "bg-accent/10 text-accent dark:text-accent-mint";
}

export default function NewsBoard({
  locale,
  t,
}: {
  locale: Locale;
  t: Dictionary;
}) {
  const n = t.news;
  const [channel, setChannel] = useState("all");
  const [items, setItems] = useState<EqnMcpItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const seq = useRef(0);

  const load = useCallback(
    async (ch: string, kw: string | null) => {
      const mySeq = ++seq.current;
      try {
        const params = new URLSearchParams({ type: "eqn", channel: ch, limit: "40" });
        if (kw) params.set("q", kw);
        const res = await fetch(`/api/market?${params.toString()}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as { items?: EqnMcpItem[] };
        if (mySeq !== seq.current) return; // 过期响应丢弃
        setItems(Array.isArray(json.items) ? json.items : []);
        setFailed(false);
      } catch {
        if (mySeq === seq.current) setFailed(true);
      }
    },
    []
  );

  useEffect(() => {
    setItems(null);
    void load(channel, query);
    const timer = setInterval(() => void load(channel, query), 120_000);
    return () => clearInterval(timer);
  }, [channel, query, load]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(q.trim() || null);
    if (channel !== "all" && q.trim()) setChannel("all"); // 搜索时切到全频道
  };

  const titleOf = (it: EqnMcpItem) => {
    const text = locale === "en" ? it.en || it.zh : it.zh || it.en;
    return text.split("\n")[0];
  };

  return (
    <div>
      {/* 频道标签（横向滚动） */}
      <div className="scrollbar-none -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {ORDER.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setChannel(key);
              setQuery(null);
              setQ("");
            }}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
              channel === key && !query
                ? "border-accent bg-accent font-medium text-white"
                : "border-line text-muted hover:border-heading hover:text-heading"
            }`}
          >
            {n.channels[key as keyof typeof n.channels] ?? key}
          </button>
        ))}
      </div>

      {/* 搜索 */}
      <form onSubmit={search} className="mt-4 flex gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={n.searchPlaceholder}
          className="w-full rounded-xl border border-line bg-card px-4 py-2.5 text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent sm:max-w-sm"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
        >
          {n.search}
        </button>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery(null);
              setQ("");
            }}
            className="shrink-0 rounded-xl border border-line px-3.5 py-2.5 text-sm text-muted transition-colors hover:border-heading hover:text-heading"
          >
            ✕
          </button>
        )}
      </form>
      {query && (
        <p className="mt-2 text-xs text-muted">
          “{query}” ·{" "}
          <button
            type="button"
            onClick={() => {
              setQuery(null);
              setQ("");
            }}
            className="underline hover:text-heading"
          >
            清除
          </button>
        </p>
      )}

      {/* 列表 */}
      <div className="mt-5">
        {items === null ? (
          <p className="py-20 text-center text-sm text-muted">{n.loading}</p>
        ) : failed ? (
          <p className="py-20 text-center text-sm text-muted">
            {n.loadFail}{" "}
            <button
              type="button"
              onClick={() => void load(channel, query)}
              className="text-accent underline dark:text-accent-mint"
            >
              {n.refresh}
            </button>
          </p>
        ) : items.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted">{n.empty}</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((it) => (
              <li key={it.no}>
                <a
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-xl border border-transparent px-3 py-2.5 transition-colors duration-200 hover:border-line hover:bg-accent/5"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                    {it.channels[0] && (
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${channelColor(it.channels[0])}`}
                      >
                        {n.channels[it.channels[0] as keyof typeof n.channels] ??
                          it.channels[0]}
                      </span>
                    )}
                    <span className="font-medium">{it.source}</span>
                    <time
                      dateTime={it.time}
                      className="tabular-nums"
                    >
                      {timeAgo(new Date(it.time).getTime(), locale)}
                    </time>
                    {it.coins.length > 0 && (
                      <span className="ml-auto hidden gap-1 sm:flex">
                        {it.coins.slice(0, 4).map((c) => (
                          <span
                            key={c}
                            className="rounded-full border border-line px-1.5 py-px font-mono text-[10px]"
                          >
                            {c}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[14px] font-medium leading-snug text-heading transition-colors duration-200 group-hover:text-accent dark:group-hover:text-accent-mint">
                    {titleOf(it)}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
