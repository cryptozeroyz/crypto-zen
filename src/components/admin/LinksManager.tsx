"use client";

/**
 * LinksManager.tsx —— 后台链接收藏管理
 * 添加（名称 + 链接 + 分类 + 一句话推荐）、删除；同 URL 保存视为更新。
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LinkItem } from "@/lib/links";

export default function LinksManager({ links }: { links: LinkItem[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim(),
          category: category.trim(),
          comment: comment.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "添加失败");
        return;
      }
      setTitle("");
      setUrl("");
      setCategory("");
      setComment("");
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (target: string) => {
    if (!window.confirm(`确定移除「${target}」吗？`)) return;
    setError("");
    try {
      const res = await fetch("/api/admin/links", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "删除失败");
        return;
      }
      router.refresh();
    } catch {
      setError("网络错误");
    }
  };

  return (
    <div className="space-y-6">
      {/* 添加表单 */}
      <form
        onSubmit={add}
        className="grid gap-4 rounded-xl border border-line bg-paper p-5 sm:grid-cols-2"
      >
        <div>
          <label htmlFor="lk-title" className="mb-1.5 block text-sm text-muted">
            名称
          </label>
          <input
            id="lk-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：Arkham"
            className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="lk-url" className="mb-1.5 block text-sm text-muted">
            链接（https://…）
          </label>
          <input
            id="lk-url"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 font-mono text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="lk-category" className="mb-1.5 block text-sm text-muted">
            分类
          </label>
          <input
            id="lk-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="链上工具 / 数据看板 / 好文章…"
            className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="lk-comment" className="mb-1.5 block text-sm text-muted">
            一句话推荐（可选）
          </label>
          <input
            id="lk-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="为什么值得收藏"
            className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
          >
            {busy ? "保存中…" : "＋ 添加收藏"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* 列表（按分类分组展示） */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th className="border-b border-line px-4 py-3 font-medium">名称</th>
              <th className="border-b border-line px-4 py-3 font-medium">分类</th>
              <th className="border-b border-line px-4 py-3 font-medium">推荐</th>
              <th className="border-b border-line px-4 py-3 font-medium">链接</th>
              <th className="border-b border-line px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {links.map((l) => (
              <tr key={l.url} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-heading">{l.title}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
                    {l.category}
                  </span>
                </td>
                <td className="max-w-[280px] px-4 py-3 text-muted">
                  <span className="line-clamp-2">{l.comment || "—"}</span>
                </td>
                <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-muted">
                  {l.url}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => void remove(l.url)}
                    className="text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    移除
                  </button>
                </td>
              </tr>
            ))}
            {links.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  还没有收藏，先在上方添加一个吧。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
