"use client";

/**
 * WatchlistManager.tsx —— 后台关注列表管理
 * 添加（CA + 一句话评价）、删除；展示实时抓取的代币名/头像/价格。
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/coin-format";

export interface WatchCoinRow {
  ca: string;
  comment: string;
  addedAt: string;
  name?: string;
  symbol?: string;
  priceUsd?: number;
  change24h?: number;
}

export default function WatchlistManager({ coins }: { coins: WatchCoinRow[] }) {
  const router = useRouter();
  const [ca, setCa] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ca: ca.trim(), comment: comment.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "添加失败");
        return;
      }
      setCa("");
      setComment("");
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (target: string) => {
    if (!window.confirm(`确定从关注列表移除 ${target.slice(0, 12)}… 吗？`)) return;
    setError("");
    try {
      const res = await fetch("/api/admin/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ca: target }),
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
        className="grid gap-4 rounded-xl border border-line bg-paper p-5 sm:grid-cols-[1fr_1fr_auto]"
      >
        <div>
          <label htmlFor="wl-ca" className="mb-1.5 block text-sm text-muted">
            合约地址（CA）
          </label>
          <input
            id="wl-ca"
            required
            value={ca}
            onChange={(e) => setCa(e.target.value)}
            placeholder="0x…（以太坊）或 Solana 地址"
            className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 font-mono text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="wl-comment" className="mb-1.5 block text-sm text-muted">
            一句话评价 / 关注原因
          </label>
          <input
            id="wl-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="例如：蓝筹风向标，长期跟踪筹码结构"
            className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep disabled:opacity-60 sm:w-auto"
          >
            {busy ? "添加中…" : "＋ 添加关注"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* 列表 */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="px-4 py-3 font-medium">代币</th>
              <th className="px-4 py-3 font-medium">价格 / 24h</th>
              <th className="px-4 py-3 font-medium">评价</th>
              <th className="px-4 py-3 font-medium">合约地址</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((c) => {
              const up = (c.change24h ?? 0) >= 0;
              return (
                <tr key={c.ca} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-medium text-heading">
                      {c.name ?? "…"}
                      {c.symbol && (
                        <span className="ml-1.5 text-xs text-muted">{c.symbol}</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {c.priceUsd ? (
                      <>
                        {formatPrice(c.priceUsd)}{" "}
                        <span
                          className={
                            up
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {up ? "+" : ""}
                          {(c.change24h ?? 0).toFixed(2)}%
                        </span>
                      </>
                    ) : (
                      <span className="text-muted">抓取失败</span>
                    )}
                  </td>
                  <td className="max-w-[280px] px-4 py-3 text-muted">
                    <span className="line-clamp-2">{c.comment || "—"}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {c.ca.slice(0, 10)}…{c.ca.slice(-6)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void remove(c.ca)}
                      className="text-sm text-red-600 hover:underline dark:text-red-400"
                    >
                      移除
                    </button>
                  </td>
                </tr>
              );
            })}
            {coins.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  关注列表为空，先在上方添加一个代币吧。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
