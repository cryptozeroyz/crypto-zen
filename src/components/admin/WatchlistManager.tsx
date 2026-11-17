"use client";

/**
 * WatchlistManager.tsx —— 后台关注列表管理
 * 添加（CA + 评价 + 持仓明细）、行内编辑、删除；
 * 新增时服务端自动记录关注时价格/市值，列表展示实时抓取的代币数据。
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/coin-format";

export interface WatchCoinRow {
  ca: string;
  comment: string;
  addedAt: string;
  holding?: boolean;
  holdAmount?: number;
  avgCost?: number;
  followPrice?: number;
  name?: string;
  symbol?: string;
  priceUsd?: number;
  change24h?: number;
}

export default function WatchlistManager({ coins }: { coins: WatchCoinRow[] }) {
  const router = useRouter();
  const [ca, setCa] = useState("");
  const [comment, setComment] = useState("");
  const [holding, setHolding] = useState(false);
  const [holdAmount, setHoldAmount] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setCa("");
    setComment("");
    setHolding(false);
    setHoldAmount("");
    setAvgCost("");
    setEditing(false);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ca: ca.trim(),
          comment: comment.trim(),
          holding,
          // 空字符串 → null（清除持仓明细）；undefined 不携带
          holdAmount: holdAmount.trim() === "" ? null : Number(holdAmount),
          avgCost: avgCost.trim() === "" ? null : Number(avgCost),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "保存失败");
        return;
      }
      reset();
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setBusy(false);
    }
  };

  /** 行内编辑：把该行填入表单（CA 锁定） */
  const editRow = (row: WatchCoinRow) => {
    setCa(row.ca);
    setComment(row.comment);
    setHolding(row.holding === true);
    setHoldAmount(row.holdAmount ? String(row.holdAmount) : "");
    setAvgCost(row.avgCost ? String(row.avgCost) : "");
    setEditing(true);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      if (editing && ca === target) reset();
      router.refresh();
    } catch {
      setError("网络错误");
    }
  };

  return (
    <div className="space-y-6">
      {/* 添加 / 编辑表单 */}
      <form
        onSubmit={add}
        className="grid gap-4 rounded-xl border border-line bg-paper p-5 sm:grid-cols-2"
      >
        <div>
          <label htmlFor="wl-ca" className="mb-1.5 block text-sm text-muted">
            合约地址（CA）{editing && <span className="text-xs">（编辑中，不可修改）</span>}
          </label>
          <input
            id="wl-ca"
            required
            value={ca}
            onChange={(e) => setCa(e.target.value)}
            readOnly={editing}
            placeholder="0x…（以太坊）或 Solana 地址"
            className={`w-full rounded-lg border border-line bg-card px-3.5 py-2.5 font-mono text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent ${
              editing ? "opacity-60" : ""
            }`}
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
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={holding}
              onChange={(e) => setHolding(e.target.checked)}
              className="h-4 w-4 accent-[#2563eb]"
            />
            当前持仓
          </label>
          {holding && (
            <>
              <label className="flex items-center gap-2 text-sm text-muted">
                数量
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={holdAmount}
                  onChange={(e) => setHoldAmount(e.target.value)}
                  placeholder="如 2100000"
                  className="w-32 rounded-lg border border-line bg-card px-3 py-1.5 text-sm text-heading outline-none focus:border-accent"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-muted">
                买入均价 $
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={avgCost}
                  onChange={(e) => setAvgCost(e.target.value)}
                  placeholder="如 0.00029"
                  className="w-32 rounded-lg border border-line bg-card px-3 py-1.5 text-sm text-heading outline-none focus:border-accent"
                />
              </label>
            </>
          )}
        </div>
        <div className="flex items-end justify-end gap-3">
          {editing && (
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:border-heading hover:text-heading"
            >
              取消编辑
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
          >
            {busy ? "保存中…" : editing ? "保存修改" : "＋ 添加关注"}
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
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="px-4 py-3 font-medium">代币</th>
              <th className="px-4 py-3 font-medium">价格 / 24h</th>
              <th className="px-4 py-3 font-medium">评价</th>
              <th className="px-4 py-3 font-medium">持仓</th>
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
                    {c.followPrice ? (
                      <div className="mt-0.5 text-[11px] text-muted">
                        关注价 {formatPrice(c.followPrice)}
                      </div>
                    ) : null}
                  </td>
                  <td className="max-w-[240px] px-4 py-3 text-muted">
                    <span className="line-clamp-2">{c.comment || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-1 text-xs ${
                        c.holding
                          ? "border-accent bg-accent/10 font-medium text-accent dark:text-accent-mint"
                          : "border-line text-muted"
                      }`}
                    >
                      {c.holding
                        ? c.holdAmount && c.avgCost
                          ? `持仓 ${formatPrice(c.avgCost)} × ${c.holdAmount.toExponential(1)}`
                          : "持仓中"
                        : "观望"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {c.ca.slice(0, 10)}…{c.ca.slice(-6)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => editRow(c)}
                      className="mr-3 text-sm text-accent hover:underline dark:text-accent-mint"
                    >
                      编辑
                    </button>
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
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
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
