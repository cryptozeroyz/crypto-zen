"use client";

/**
 * ResourcesClient.tsx —— 好物推荐页主体（客户端）
 * tab 筛选 + 实时搜索 + 一键复制（已复制 ✓ 反馈）。
 * 卡片按类型渲染：图书自动封面 / 物品图位 / 工具字母图标 / 资料文件卡。
 */

import { useMemo, useState } from "react";
import type { LinkItem, LinkType } from "@/lib/links";
import type { Dictionary } from "@/lib/i18n";

type Tab = "all" | LinkType;

/** 与 lib/links.ts 保持一致（客户端内联，避免引入 fs 依赖） */
const LINK_TYPE_ORDER: LinkType[] = ["book", "goods", "tool", "file"];

const BOOK_GRADIENTS: Array<[string, string]> = [
  ["#2563eb", "#1e3a8a"],
  ["#4f66d2", "#26327e"],
  ["#6d5bd0", "#3d2f86"],
];

function bookGradient(index: number): [string, string] {
  return BOOK_GRADIENTS[index % BOOK_GRADIENTS.length];
}

function fileIcon(fileUrl?: string): string {
  if (!fileUrl) return "📄";
  if (/\.csv$/i.test(fileUrl)) return "📊";
  if (/\.(pdf|epub|mobi)$/i.test(fileUrl)) return "📕";
  if (/\.(zip|7z|rar)$/i.test(fileUrl)) return "🗜️";
  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(fileUrl)) return "🖼️";
  return "📄";
}

function typeBadgeClass(type: LinkType): string {
  return "rounded-full px-2 py-0.5 text-[11px] font-semibold bg-accent/10 text-accent dark:bg-accent-mint/10 dark:text-accent-mint";
}

export default function ResourcesClient({
  links,
  t,
}: {
  links: LinkItem[];
  t: Dictionary;
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map = new Map<LinkType, number>();
    for (const l of links) map.set(l.type, (map.get(l.type) ?? 0) + 1);
    return map;
  }, [links]);

  const TABS: Array<{ key: Tab; label: string }> = [
    { key: "all", label: `${t.resources.tabs.all} ${links.length}` },
    ...LINK_TYPE_ORDER.map((tp) => ({
      key: tp as Tab,
      label: `${t.resources.tabs[tp]} ${counts.get(tp) ?? 0}`,
    })),
  ];

  const filtered = links.filter((l) => {
    if (tab !== "all" && l.type !== tab) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${l.title} ${l.comment} ${l.tags.join(" ")}`.toLowerCase().includes(q);
  });

  const copy = async (item: LinkItem) => {
    if (!item.copyText) return;
    try {
      await navigator.clipboard.writeText(item.copyText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = item.copyText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(item.url);
    window.setTimeout(() => setCopied((c) => (c === item.url ? null : c)), 1400);
  };

  return (
    <div>
      {/* 筛选行 */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Type" className="flex flex-wrap gap-2">
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
              </button>
            );
          })}
        </div>
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
            placeholder={t.resources.searchPh}
            aria-label={t.resources.searchPh}
            className="w-full rounded-full border border-line bg-card py-2 pl-10 pr-4 text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </div>
      </div>

      {/* 卡片网格 */}
      {filtered.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, i) => (
            <article
              key={item.url}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/40"
            >
              {/* 媒体区：按类型 */}
              {item.type === "book" &&
                (item.cover ? (
                  <div className="flex h-52 items-center justify-center overflow-hidden bg-codebg">
                    <span className={typeBadgeClass(item.type)}>图书</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.cover}
                      alt={item.title}
                      loading="lazy"
                      className="h-44 rounded-sm object-cover shadow-md"
                    />
                  </div>
                ) : (
                  <div className="flex h-52 items-center justify-center bg-codebg">
                    <span className={typeBadgeClass(item.type)}>图书</span>
                    <div
                      className="flex h-44 w-32 flex-col justify-between rounded-r-lg rounded-l-sm p-3 text-white shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${bookGradient(i)[0]}, ${bookGradient(i)[1]})`,
                        boxShadow: "3px 4px 0 rgba(0,0,0,.12)",
                      }}
                    >
                      <div>
                        <p className="font-serif text-[13px] font-bold leading-snug">
                          {item.title}
                        </p>
                        {item.author && (
                          <p className="mt-1 text-[10px] opacity-75">{item.author}</p>
                        )}
                      </div>
                      <p className="text-[8px] tracking-[3px] opacity-60">CRYPTO ZEN</p>
                    </div>
                  </div>
                ))}

              {item.type === "goods" && (
                <div className="flex aspect-[16/9] items-center justify-center bg-codebg">
                  <span className={typeBadgeClass(item.type)}>物品</span>
                  {item.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.cover}
                      alt={item.title}
                      loading="lazy"
                      className="h-24 w-24 rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="text-5xl" aria-hidden="true">
                      🎒
                    </span>
                  )}
                </div>
              )}

              {item.type === "tool" && (
                <div className="flex aspect-[16/9] items-center justify-center bg-codebg">
                  <span className={typeBadgeClass(item.type)}>工具</span>
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-deep text-xl font-bold text-white">
                    {item.title.slice(0, 1)}
                  </span>
                </div>
              )}

              {item.type === "file" && (
                <div className="flex aspect-[16/9] items-center justify-center bg-codebg px-6">
                  <span className={typeBadgeClass(item.type)}>资料</span>
                  <div className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-card px-4 py-3">
                    <span className="text-2xl" aria-hidden="true">
                      {fileIcon(item.fileUrl)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-heading">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {item.fileUrl
                          ? "文件 · 可下载"
                          : item.copyText
                            ? "文本 · 可复制"
                            : "资料"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 内容 */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-[15px] font-bold leading-snug text-heading">
                  {item.title}
                  {item.type === "book" && item.author && (
                    <span className="ml-1.5 text-xs font-normal text-muted">
                      {item.author}
                    </span>
                  )}
                </h3>
                {item.comment && (
                  <p className="mt-1.5 line-clamp-3 flex-1 text-[13px] leading-relaxed text-muted">
                    {item.comment}
                  </p>
                )}
                {item.tags.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 动作区 */}
                <div className="mt-3.5 flex gap-2">
                  {item.type !== "file" && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-accent/35 px-3.5 py-1.5 text-xs font-medium text-accent transition-all duration-200 hover:border-accent/60 hover:shadow-[0_0_14px_rgba(37,99,235,0.2)] dark:text-accent-mint"
                    >
                      {item.type === "book"
                        ? t.resources.buy
                        : item.type === "goods"
                          ? t.resources.view
                          : t.resources.open}
                    </a>
                  )}
                  {item.copyText && (
                    <button
                      type="button"
                      onClick={() => void copy(item)}
                      className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                        copied === item.url
                          ? "bg-accent/10 text-accent dark:text-accent-mint"
                          : "bg-accent text-white hover:bg-accent-deep"
                      }`}
                    >
                      {copied === item.url ? t.resources.copied : t.resources.copy}
                    </button>
                  )}
                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      download
                      className="inline-flex items-center gap-1 rounded-full border border-accent/35 px-3.5 py-1.5 text-xs font-medium text-accent transition-all duration-200 hover:border-accent/60 dark:text-accent-mint"
                    >
                      {t.resources.download}
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center text-sm text-muted">{t.resources.empty}</p>
      )}
    </div>
  );
}
