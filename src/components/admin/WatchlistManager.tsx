"use client";

/**
 * WatchlistManager.tsx —— 投研成绩单后台
 * 添加/编辑代币（Why 标签 + 论点）、投研时间线（行为+理由，只追加）、
 * Why 标签体系维护、删除。
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/coin-format";

interface WhyTag {
  id: string;
  zh: string;
  en: string;
}

interface WatchEvent {
  type: string;
  date: string;
  price?: number;
  note: string;
  why?: string[];
}

export interface WatchCoinRow {
  ca: string;
  chain?: string;
  symbol?: string;
  name?: string;
  dex?: string;
  pairAddress?: string;
  status?: string;
  why?: string[];
  comment: string;
  addedAt: string;
  holding?: boolean;
  holdAmount?: number;
  avgCost?: number;
  followPrice?: number;
  image?: string;
  profile?: { narrative?: string; risks?: string; catalysts?: string; invalidate?: string };
  events?: WatchEvent[];
  priceUsd?: number;
  change24h?: number;
}

const EVENT_TYPES: Array<{ id: string; label: string; color: string }> = [
  { id: "open_position", label: "开启持仓", color: "#059669" },
  { id: "add", label: "加仓", color: "#059669" },
  { id: "reduce", label: "减仓", color: "#d97706" },
  { id: "close_position", label: "清仓", color: "#d97706" },
  { id: "unfollow", label: "取消关注", color: "#7a8590" },
];

const EVENT_LABEL: Record<string, { label: string; color: string }> = {
  follow: { label: "建立关注", color: "#2563eb" },
  ...Object.fromEntries(EVENT_TYPES.map((t) => [t.id, { label: t.label, color: t.color }])),
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  watching: { label: "观望中", cls: "border-line text-muted" },
  holding: { label: "持仓中", cls: "border-accent bg-accent/10 font-medium text-accent dark:text-accent-mint" },
  exited: { label: "已收官", cls: "border-line bg-code text-muted" },
};

export default function WatchlistManager({
  coins,
  tags: initialTags,
}: {
  coins: WatchCoinRow[];
  tags: WhyTag[];
}) {
  const router = useRouter();
  const [ca, setCa] = useState("");
  const [comment, setComment] = useState("");
  const [holding, setHolding] = useState(false);
  const [holdAmount, setHoldAmount] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [why, setWhy] = useState<string[]>([]);
  const [profNarrative, setProfNarrative] = useState("");
  const [profRisks, setProfRisks] = useState("");
  const [profCatalysts, setProfCatalysts] = useState("");
  const [profInvalidate, setProfInvalidate] = useState("");
  const [image, setImage] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const [tags, setTags] = useState<WhyTag[]>(initialTags);
  const [newTag, setNewTag] = useState("");
  const [editing, setEditing] = useState(false);
  const [timeline, setTimeline] = useState<string | null>(null);
  const [evType, setEvType] = useState("add");
  const [evNote, setEvNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setCa("");
    setComment("");
    setHolding(false);
    setHoldAmount("");
    setAvgCost("");
    setWhy([]);
    setProfNarrative("");
    setProfRisks("");
    setProfCatalysts("");
    setProfInvalidate("");
    setImage("");
    setEditing(false);
  };

  const save = async (e: React.FormEvent) => {
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
          why,
          holdAmount: holdAmount.trim() === "" ? null : Number(holdAmount),
          avgCost: avgCost.trim() === "" ? null : Number(avgCost),
          image: image || null,
          profile: {
            narrative: profNarrative,
            risks: profRisks,
            catalysts: profCatalysts,
            invalidate: profInvalidate,
          },
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

  const editRow = (row: WatchCoinRow) => {
    setCa(row.ca);
    setComment(row.comment);
    setHolding(row.holding === true);
    setHoldAmount(row.holdAmount ? String(row.holdAmount) : "");
    setAvgCost(row.avgCost ? String(row.avgCost) : "");
    setWhy(row.why ?? []);
    setProfNarrative(row.profile?.narrative ?? "");
    setProfRisks(row.profile?.risks ?? "");
    setProfCatalysts(row.profile?.catalysts ?? "");
    setProfInvalidate(row.profile?.invalidate ?? "");
    setImage(row.image ?? "");
    setEditing(true);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addEvent = async (rowCa: string) => {
    if (!evNote.trim()) {
      setError("请填写本次操作的理由");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/watchlist/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ca: rowCa, type: evType, note: evNote.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "记录失败");
        return;
      }
      setEvNote("");
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (target: string) => {
    if (!window.confirm(`确定彻底删除 ${target.slice(0, 12)}… 吗？（建议用「取消关注」保留历史）`)) return;
    setError("");
    try {
      const res = await fetch("/api/admin/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ca: target }),
      });
      if (!res.ok) {
        setError((await res.json().catch(() => null))?.message ?? "删除失败");
        return;
      }
      if (editing && ca === target) reset();
      if (timeline === target) setTimeline(null);
      router.refresh();
    } catch {
      setError("网络错误");
    }
  };

  const saveTags = async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/watchlist/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) {
        setError((await res.json().catch(() => null))?.message ?? "标签保存失败");
        return;
      }
      router.refresh();
    } catch {
      setError("网络错误");
    }
  };

  const [aiBusy, setAiBusy] = useState(false);
  const [aiMd, setAiMd] = useState("");

  const genAi = async (row: WatchCoinRow) => {
    setAiBusy(true); setAiMd(""); setError("");
    try {
      const res = await fetch("/api/admin/ai-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ca: row.ca }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.message ?? "生成失败"); return; }
      setAiMd(data.markdown);
    } catch { setError("网络错误"); } finally { setAiBusy(false); }
  };

  const saveAi = async (row: WatchCoinRow) => {
    setError("");
    try {
      const res = await fetch("/api/admin/journal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: new Date().toISOString().slice(0, 10), tokens: [row.symbol ?? row.ca], tags: ["快速研报", "AI"], title: `26a1 AI 快速研报：${row.symbol ?? row.name ?? ""}`.trim(), body: aiMd }) });
      if (!res.ok) { setError((await res.json().catch(() => null))?.message ?? "保存失败"); return; }
      setAiMd(""); router.refresh();
    } catch { setError("网络错误"); }
  };

  const tagLabel = (id: string) => tags.find((t) => t.id === id)?.zh ?? id;

  return (
    <div className="space-y-8">
      {/* 添加 / 编辑表单 */}
      <form onSubmit={save} className="grid gap-4 rounded-xl border border-line bg-paper p-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm text-muted">
            合约地址（CA）{editing && <span className="text-xs">（编辑中，不可修改）</span>}
          </label>
          <input
            required
            value={ca}
            onChange={(e) => setCa(e.target.value)}
            readOnly={editing}
            placeholder="0x…（以太坊）或 Solana 地址"
            className={`w-full rounded-lg border border-line bg-card px-3.5 py-2.5 font-mono text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent ${editing ? "opacity-60" : ""}`}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted">当时的论点（会永久保留在时间线第一格）</label>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="为什么关注它？"
            className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm text-muted">
            Why I Followed（可多选，成绩单按此统计胜率）
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() =>
                  setWhy((w) => (w.includes(t.id) ? w.filter((x) => x !== t.id) : [...w, t.id]))
                }
                aria-pressed={why.includes(t.id)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  why.includes(t.id)
                    ? "border-accent bg-accent/10 font-medium text-accent dark:text-accent-mint"
                    : "border-line text-muted hover:border-heading hover:text-heading"
                }`}
              >
                {t.zh}
              </button>
            ))}
          </div>
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
                成本 $
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
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm text-muted">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm text-muted">关注原因配图（可选）</label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer rounded-lg border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-heading hover:text-heading">
              {imageBusy ? "上传中…" : image ? "更换图片" : "＋ 上传图片"}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setImageBusy(true);
                const fd = new FormData();
                fd.append("file", f);
                fetch("/api/admin/upload", { method: "POST", body: fd })
                  .then((r) => r.json())
                  .then((d) => { if (d?.url) setImage(d.url); else setError(d?.message ?? "上传失败"); })
                  .catch(() => setError("上传失败"))
                  .finally(() => setImageBusy(false));
              }} />
            </label>
            {image && <><img src={image} alt="" className="h-10 w-10 rounded-lg border border-line object-cover" /><button type="button" onClick={() => setImage("")} className="text-xs text-red-600 hover:underline dark:text-red-400">移除</button></>}
          </div>
        </div>
            研究档案（可选，会显示在币的看板详情里）
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["叙事", profNarrative, setProfNarrative, "这个故事是什么"],
                ["风险", profRisks, setProfRisks, "最大的坑在哪"],
                ["催化剂", profCatalysts, setProfCatalysts, "等什么事件"],
                ["证伪条件", profInvalidate, setProfInvalidate, "什么情况下我错了"],
              ] as const
            ).map(([label, value, setter, ph]) => (
              <textarea
                key={label}
                value={value}
                onChange={(e) => setter(e.target.value)}
                rows={2}
                placeholder={ph}
                className="w-full resize-y rounded-lg border border-line bg-card px-3.5 py-2.5 text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent"
              />
            ))}
          </div>
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
            {busy ? "保存中…" : editing ? "保存修改" : "＋ 建立关注"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* 代币列表 + 时间线 */}
      <div className="space-y-3">
        {coins.map((c) => {
          const st = STATUS_LABEL[c.status ?? "watching"] ?? STATUS_LABEL.watching;
          const open = timeline === c.ca;
          const events = [...(c.events ?? [])].reverse();
          return (
            <div key={c.ca} className="overflow-hidden rounded-2xl border border-line bg-card">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <span className="font-medium text-heading">
                  {c.name ?? "…"}
                  {c.symbol && <span className="ml-1.5 text-xs text-muted">${c.symbol}</span>}
                  {c.chain && <span className="ml-1.5 text-[11px] text-muted">· {c.chain}</span>}
                </span>
                <span className="text-xs tabular-nums text-muted">
                  {c.priceUsd ? (
                    <>
                      {formatPrice(c.priceUsd)}{" "}
                      <span className={(c.change24h ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                        {(c.change24h ?? 0) >= 0 ? "+" : ""}
                        {(c.change24h ?? 0).toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    "抓取失败"
                  )}
                </span>
                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${st.cls}`}>
                  {st.label}
                </span>
                {(c.why ?? []).length > 0 && (
                  <span className="flex gap-1">
                    {c.why!.map((w) => (
                      <span key={w} className="rounded-full bg-code px-2 py-0.5 text-[11px] text-muted">
                        {tagLabel(w)}
                      </span>
                    ))}
                  </span>
                )}
                <span className="ml-auto flex gap-3 text-sm">
                  <button type="button" onClick={() => editRow(c)} className="text-accent hover:underline dark:text-accent-mint">
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeline(open ? null : c.ca)}
                    aria-expanded={open}
                    className="text-muted hover:text-heading"
                  >
                    时间线 {open ? "▲" : "▼"}
                  </button>
                  <button type="button" onClick={() => void remove(c.ca)} className="text-red-600 hover:underline dark:text-red-400">
                    删除
                  </button>
                </span>
              </div>

              {open && (
                <div className="border-t border-line bg-paper px-4 py-4">
                  {/* 已有事件 */}
                  <div className="space-y-2">
                    {events.map((ev, i) => {
                      const meta = EVENT_LABEL[ev.type] ?? { label: ev.type, color: "#7a8590" };
                      return (
                        <div key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm">
                          <span className="font-semibold" style={{ color: meta.color }}>
                            {meta.label}
                          </span>
                          <span className="text-xs tabular-nums text-muted">{ev.date}</span>
                          {typeof ev.price === "number" && (
                            <span className="font-mono text-xs text-heading">@{formatPrice(ev.price)}</span>
                          )}
                          <span className="w-full text-[13px] text-muted sm:w-auto sm:flex-1">{ev.note || "—"}</span>
                          {(ev.why ?? []).length > 0 && (
                            <span className="flex gap-1">
                              {ev.why!.map((w) => (
                                <span key={w} className="rounded-full bg-code px-2 py-px text-[10.5px] text-muted">
                                  {tagLabel(w)}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* 追加事件 */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      value={evType}
                      onChange={(e) => setEvType(e.target.value)}
                      className="rounded-lg border border-line bg-card px-2.5 py-2 text-sm text-heading outline-none focus:border-accent"
                    >
                      {EVENT_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                    <input
                      value={evNote}
                      onChange={(e) => setEvNote(e.target.value)}
                      placeholder="理由（必填，会永久保留）"
                      className="min-w-[220px] flex-1 rounded-lg border border-line bg-card px-3 py-2 text-sm text-heading outline-none placeholder:text-muted focus:border-accent"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void addEvent(c.ca)}
                      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
                    >
                      记录
                    </button>
                  </div>
                  <p className="mt-2 text-[11.5px] text-muted">
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button type="button" disabled={aiBusy} onClick={() => void genAi(c)} className="rounded-lg border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-50 dark:text-accent-mint">
                      {aiBusy ? "生成中（约 30 秒）…" : "⚡ AI 快速研报"}
                    </button>
                    {aiMd && (
                      <button type="button" onClick={() => void saveAi(c)} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-deep">存入研究日志</button>
                    )}
                  </div>
                  {aiMd && <textarea readOnly value={aiMd} rows={8} className="mt-2 w-full resize-y rounded-lg border border-line bg-card px-3 py-2 font-mono text-xs text-heading outline-none" />}
                    时间线只追加不删除；记录时自动附带当时价格。「取消关注」会保留完整历史并标记为已收官。
                  </p>
                </div>
              )}
            </div>
          );
        })}
        {coins.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
            还没有关注记录，先在上方建立一个关注吧。
          </p>
        )}
      </div>

      {/* 标签体系维护 */}
      <div className="rounded-xl border border-line bg-paper p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-heading">Why 标签体系</h2>
          <button
            type="button"
            onClick={() => void saveTags()}
            className="rounded-lg border border-line px-4 py-1.5 text-xs text-muted transition-colors hover:border-heading hover:text-heading"
          >
            保存标签
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">id 为小写下划线（保存后不可改，用于数据关联）；改名随时可改。</p>
        <div className="mt-3 space-y-2">
          {tags.map((t, i) => (
            <div key={t.id} className="flex flex-wrap items-center gap-2">
              <code className="w-32 rounded bg-code px-2 py-1 font-mono text-xs text-muted">{t.id}</code>
              <input
                value={t.zh}
                onChange={(e) => setTags((ts) => ts.map((x, j) => (j === i ? { ...x, zh: e.target.value } : x)))}
                className="w-36 rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-heading outline-none focus:border-accent"
              />
              <input
                value={t.en}
                onChange={(e) => setTags((ts) => ts.map((x, j) => (j === i ? { ...x, en: e.target.value } : x)))}
                className="w-36 rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-heading outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setTags((ts) => ts.filter((_, j) => j !== i))}
                className="text-xs text-red-600 hover:underline dark:text-red-400"
              >
                删除
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="新标签 id，如 onchain_data"
            className="w-56 rounded-lg border border-line bg-card px-3 py-1.5 font-mono text-xs text-heading outline-none placeholder:text-muted focus:border-accent"
          />
          <button
            type="button"
            onClick={() => {
              const id = newTag.trim().toLowerCase();
              if (/^[a-z0-9_]{2,20}$/.test(id) && !tags.some((t) => t.id === id)) {
                setTags((ts) => [...ts, { id, zh: id, en: id }]);
                setNewTag("");
              } else {
                setError("标签 id 需为 2-20 位小写字母/数字/下划线且不重复");
              }
            }}
            className="rounded-lg border border-line px-4 py-1.5 text-xs text-muted transition-colors hover:border-heading hover:text-heading"
          >
            ＋ 添加标签
          </button>
        </div>
      </div>
    </div>
  );
}
