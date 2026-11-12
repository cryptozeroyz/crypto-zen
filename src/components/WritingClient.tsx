"use client";

/**
 * WritingClient.tsx —— /writing 页面的筛选与搜索（纯客户端，页面保持静态生成）
 * - 分类：全部 / 研究报告 / 个人随笔 / 产品运营
 * - 标签：点击切换（单选，再点取消）
 * - 搜索：匹配标题、摘要与标签
 * 初次挂载读取 location.search 支持带参直达。
 */

import { useEffect, useMemo, useState } from "react";
import type { PostMeta } from "@/lib/posts";
import type { Dictionary, Locale } from "@/lib/i18n";
import ResearchCard from "@/components/ResearchCard";
import BlogRow from "@/components/BlogRow";

type Tab = "all" | "research" | "essay" | "ops";

interface WritingClientProps {
  research: PostMeta[];
  essays: PostMeta[];
  ops: PostMeta[];
  locale: Locale;
  t: Dictionary;
}

export default function WritingClient({
  research,
  essays,
  ops,
  locale,
  t,
}: WritingClientProps) {
  const [tab, setTab] = useState<Tab>("all");
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // 挂载时同步 URL 参数里的分类
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("category");
    if (c === "research" || c === "essay" || c === "ops") setTab(c);
  }, []);

  const all = useMemo(
    () => [...research, ...essays, ...ops],
    [research, essays, ops]
  );

  // 全部标签（带计数，按数量倒序）
  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of all) {
      for (const tg of p.tags) map.set(tg, (map.get(tg) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [all]);

  const TABS: Array<{ key: Tab; label: string; count: number }> = [
    { key: "all", label: t.writing.tabs.all, count: all.length },
    { key: "research", label: t.writing.tabs.research, count: research.length },
    { key: "essay", label: t.writing.tabs.essay, count: essays.length },
    { key: "ops", label: t.writing.tabs.ops, count: ops.length },
  ];

  const matches = (p: PostMeta) => {
    if (tab !== "all" && p.category !== tab) return false;
    if (tag && !p.tags.includes(tag)) return false;
    const q = query.trim().toLowerCase();
    if (q) {
      const haystack = `${p.title} ${p.excerpt} ${p.tags.join(" ")}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  };

  const listFor = (category: "research" | "essay" | "ops") =>
    all.filter((p) => p.category === category && matches(p));
  const filteredResearch = listFor("research");
  const filteredRows = all.filter(
    (p) => p.category !== "research" && matches(p)
  );
  const empty = filteredResearch.length === 0 && filteredRows.length === 0;

  return (
    <div>
      {/* 分类筛选 + 搜索 */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Category" className="flex flex-wrap gap-2">
          {TABS.map((tb) => {
            const active = tab === tb.key;
            return (
              <button
                key={tb.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(tb.key)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors duration-200 ${
                  active
                    ? "border-accent bg-accent font-medium text-white"
                    : "border-line text-muted hover:border-heading hover:text-heading"
                }`}
              >
                {tb.label}
                <span className={`ml-1.5 text-xs ${active ? "text-white/70" : ""}`}>
                  {tb.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 搜索框 */}
        <div className="relative sm:w-64">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.writing.searchPlaceholder}
            aria-label={t.writing.searchPlaceholder}
            className="w-full rounded-full border border-line bg-card py-2 pl-10 pr-4 text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </div>
      </div>

      {/* 标签筛选 */}
      {tagCounts.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tagCounts.map(([name, count]) => {
            const active = tag === name;
            return (
              <button
                key={name}
                onClick={() => setTag(active ? null : name)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-xs transition-colors duration-200 ${
                  active
                    ? "border-accent bg-accent/10 font-medium text-accent dark:text-accent-mint"
                    : "border-line text-muted hover:border-heading hover:text-heading"
                }`}
              >
                {name}
                <span className={`ml-1 ${active ? "" : "text-muted/70"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 结果 */}
      {empty ? (
        <p className="mt-12 text-sm text-muted">{t.writing.noResults}</p>
      ) : (
        <>
          {tab !== "essay" && tab !== "ops" && filteredResearch.length > 0 && (
            <section aria-label={t.writing.tabs.research} className="mt-8">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredResearch.map((post) => (
                  <ResearchCard key={post.slug} post={post} locale={locale} t={t} />
                ))}
              </div>
            </section>
          )}
          {tab !== "research" && filteredRows.length > 0 && (
            <section aria-label={t.writing.tabs.essay} className="mt-8">
              <div className="border-t border-line">
                {filteredRows.map((post) => (
                  <BlogRow key={post.slug} post={post} locale={locale} t={t} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
