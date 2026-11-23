"use client";

/**
 * CallsManager.tsx —— Track Record 后台录入
 * 三个动作：新建判断（Call 创建后即锁定）/ 追加 Update / 复盘关闭（Outcome）。
 * 价格支持「自动抓取」（DexScreener，标记 auto）与手填（标记 manual）。
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Call, CallRecord, CallUpdate } from "@/lib/calls";
import { makeCallId } from "@/lib/calls";
import { statusOf } from "@/lib/calls-stats";

const STANCES = ["watch", "bullish", "bearish", "avoid"] as const;
const NTS = ["meme-culture", "event-driven", "ip", "celebrity", "ai", "other"] as const;
const HORIZONS = ["intraday", "days", "weeks", "months"] as const;
const POSITIONS = [
  ["none", "无持仓"],
  ["holding", "持仓中"],
  ["sold", "已清仓"],
  ["unknown", "未知（仅历史）"],
] as const;
const MISTAKES = ["narrative-fade", "late-entry", "liquidity", "rug", "timing", "sizing", "other"] as const;

const input =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent";
const label = "mb-1 block text-xs text-muted";

export default function CallsManager({
  initialRecords,
}: {
  initialRecords: CallRecord[];
}) {
  const [records, setRecords] = useState<CallRecord[]>(initialRecords);
  const [showNew, setShowNew] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch("/api/admin/calls");
    const j = await res.json();
    if (j?.records) setRecords(j.records);
  };

  const sorted = useMemo(
    () => [...records].sort((a, b) => b.call.calledAt.localeCompare(a.call.calledAt)),
    [records]
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          判断发布后<b>不可改写</b>；改错只能追加「论点修正」Update 或关闭复盘。披露与「什么情况算我错」必填。
        </p>
        <button
          type="button"
          onClick={() => setShowNew((v) => !v)}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
        >
          {showNew ? "收起表单" : "+ 新建判断"}
        </button>
      </div>

      {msg && <p className="mb-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">{msg}</p>}
      {err && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">{err}</p>}

      {showNew && (
        <NewCallForm
          onDone={() => {
            setShowNew(false);
            setMsg("已创建判断（已锁定，不可改写）");
            setErr(null);
            void refresh();
          }}
          onError={(m) => {
            setErr(m);
            setMsg(null);
          }}
        />
      )}

      {/* 记录表 */}
      <div className="space-y-2">
        {sorted.map((r) => (
          <CallRow
            key={r.call.id}
            record={r}
            onChanged={(m) => {
              setMsg(m);
              setErr(null);
              void refresh();
            }}
            onError={(m) => {
              setErr(m);
              setMsg(null);
            }}
          />
        ))}
        {sorted.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">还没有判断记录</p>
        )}
      </div>
    </div>
  );
}

/* ==================== 新建判断 ==================== */

function NewCallForm({ onDone, onError }: { onDone: () => void; onError: (m: string) => void }) {
  const [f, setF] = useState({
    date: new Date().toISOString().slice(0, 16), // datetime-local
    slug: "",
    chain: "solana",
    tokenName: "",
    symbol: "",
    ca: "",
    stance: "watch",
    narrativeType: "meme-culture",
    horizon: "weeks",
    priceAtCall: "",
    mcapAtCall: "",
    pairAddress: "",
    manualPrice: false,
    narrative: "",
    thesis: "",
    catalysts: "",
    risks: "",
    invalidation: "",
    successCriteria: "",
    targetMcap: "",
    stopMcap: "",
    proofUrl: "",
    tags: "",
    relatedReports: "",
    position: "none",
    entryPrice: "",
    sizeTier: "",
    sponsored: false,
    referral: false,
    sourceOfIdea: "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  const id = makeCallId(f.date.replace("T", "T") + ":00", f.slug || f.symbol || "call");

  const fetchPrice = async () => {
    if (!f.ca) return onError("先填合约地址");
    try {
      const res = await fetch(`/api/market?type=prices&cas=${encodeURIComponent(f.ca)}`);
      const j = await res.json();
      const p = j?.prices?.[f.ca];
      if (!p) return onError("抓不到行情（可手填并勾选「价格手填」）");
      setF((s) => ({
        ...s,
        priceAtCall: String(p.priceUsd),
        mcapAtCall: String(Math.round(p.mcap)),
        pairAddress: p.pairAddress ?? s.pairAddress,
        manualPrice: false,
      }));
    } catch {
      onError("抓取失败");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    onError("");
    try {
      const call = {
        id,
        chain: f.chain.trim(),
        tokenName: f.tokenName.trim(),
        symbol: f.symbol.trim().toUpperCase(),
        contractAddress: f.ca.trim(),
        calledAt: f.date.replace("T", "T") + ":00",
        proofUrl: f.proofUrl.trim() || undefined,
        stance: f.stance,
        priceAtCall: Number(f.priceAtCall),
        mcapAtCall: Number(f.mcapAtCall),
        narrative: f.narrative.trim(),
        thesis: f.thesis.trim(),
        catalysts: f.catalysts.split("\n").map((s) => s.trim()).filter(Boolean),
        risks: f.risks.split("\n").map((s) => s.trim()).filter(Boolean),
        narrativeType: f.narrativeType,
        horizon: f.horizon,
        invalidation: f.invalidation.trim(),
        successCriteria: f.successCriteria.trim() || undefined,
        targetMcap: f.targetMcap ? Number(f.targetMcap) : undefined,
        stopMcap: f.stopMcap ? Number(f.stopMcap) : undefined,
        disclosure: {
          position: f.position,
          entryPrice: f.entryPrice ? Number(f.entryPrice) : undefined,
          sizeTier: f.sizeTier || undefined,
          sponsored: f.sponsored,
          referral: f.referral,
          sourceOfIdea: f.sourceOfIdea.trim() || undefined,
        },
        relatedReports: f.relatedReports.split(",").map((s) => s.trim()).filter(Boolean),
        tags: f.tags.split(",").map((s) => s.trim()).filter(Boolean),
        isHistorical: false,
        priceSource: f.manualPrice ? "manual" : "auto",
        pairAddress: /^[0-9a-zA-Z]{20,80}$/.test(f.pairAddress) ? f.pairAddress : undefined,
      };
      const res = await fetch("/api/admin/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message ?? "保存失败");
      onDone();
    } catch (e2) {
      onError(e2 instanceof Error ? e2.message : "保存失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mb-6 rounded-2xl border border-line bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold text-heading">新建判断（发布后锁定）</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label className={label}>判断时间 *</label>
          <input type="datetime-local" value={f.date} onChange={(e) => set("date", e.target.value)} className={input} required /></div>
        <div><label className={label}>短名（生成 id）*</label>
          <input value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder="如 huss" className={input} required />
          <p className="mt-0.5 font-mono text-[10px] text-muted">{id}</p></div>
        <div><label className={label}>链 *</label>
          <input value={f.chain} onChange={(e) => set("chain", e.target.value)} className={input} required /></div>
        <div><label className={label}>代币名 *</label>
          <input value={f.tokenName} onChange={(e) => set("tokenName", e.target.value)} className={input} required /></div>
        <div><label className={label}>Symbol *</label>
          <input value={f.symbol} onChange={(e) => set("symbol", e.target.value)} className={input} required /></div>
        <div><label className={label}>合约地址 *</label>
          <input value={f.ca} onChange={(e) => set("ca", e.target.value)} className={`${input} font-mono`} required /></div>
        <div><label className={label}>立场 *</label>
          <select value={f.stance} onChange={(e) => set("stance", e.target.value)} className={input}>
            {STANCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select></div>
        <div><label className={label}>叙事类型 *</label>
          <select value={f.narrativeType} onChange={(e) => set("narrativeType", e.target.value)} className={input}>
            {NTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select></div>
        <div><label className={label}>周期 *</label>
          <select value={f.horizon} onChange={(e) => set("horizon", e.target.value)} className={input}>
            {HORIZONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select></div>
        <div><label className={label}>判断时价格 *</label>
          <input value={f.priceAtCall} onChange={(e) => set("priceAtCall", e.target.value)} className={`${input} font-mono`} required /></div>
        <div><label className={label}>判断时市值 *</label>
          <input value={f.mcapAtCall} onChange={(e) => set("mcapAtCall", e.target.value)} className={`${input} font-mono`} required /></div>
        <div className="flex items-end gap-2 pb-0.5">
          <button type="button" onClick={() => void fetchPrice()} className="rounded-lg border border-line px-3 py-2 text-xs text-muted hover:border-accent hover:text-accent">
            ⚡ 自动抓取
          </button>
          <label className="flex items-center gap-1 text-xs text-muted">
            <input type="checkbox" checked={f.manualPrice} onChange={(e) => set("manualPrice", e.target.checked)} /> 价格手填
          </label>
        </div>
        <div className="sm:col-span-3"><label className={label}>一句话叙事 *</label>
          <input value={f.narrative} onChange={(e) => set("narrative", e.target.value)} className={input} required /></div>
        <div className="sm:col-span-3"><label className={label}>判断依据（thesis）*</label>
          <textarea value={f.thesis} rows={3} onChange={(e) => set("thesis", e.target.value)} className={input} required /></div>
        <div><label className={label}>催化剂（每行一条）</label>
          <textarea value={f.catalysts} rows={2} onChange={(e) => set("catalysts", e.target.value)} className={input} /></div>
        <div><label className={label}>风险（每行一条）</label>
          <textarea value={f.risks} rows={2} onChange={(e) => set("risks", e.target.value)} className={input} /></div>
        <div><label className={label + " text-[#ff5b3a]"}>什么情况算我错（invalidation）*</label>
          <textarea value={f.invalidation} rows={2} onChange={(e) => set("invalidation", e.target.value)} className={input} required /></div>
        <div className="sm:col-span-2"><label className={label}>成功标准（可选）</label>
          <input value={f.successCriteria} onChange={(e) => set("successCriteria", e.target.value)} className={input} /></div>
        <div><label className={label}>目标市值（可选）</label>
          <input value={f.targetMcap} onChange={(e) => set("targetMcap", e.target.value)} className={`${input} font-mono`} /></div>
        <div><label className={label}>止损市值（可选）</label>
          <input value={f.stopMcap} onChange={(e) => set("stopMcap", e.target.value)} className={`${input} font-mono`} /></div>
        <div><label className={label}>X 同步证明链接（可选，建议填）</label>
          <input value={f.proofUrl} onChange={(e) => set("proofUrl", e.target.value)} className={input} placeholder="https://x.com/..." /></div>
        <div><label className={label}>标签（逗号分隔）</label>
          <input value={f.tags} onChange={(e) => set("tags", e.target.value)} className={input} /></div>
        <div><label className={label}>关联研报 slug（逗号分隔）</label>
          <input value={f.relatedReports} onChange={(e) => set("relatedReports", e.target.value)} className={input} /></div>
      </div>

      {/* 披露 */}
      <h4 className="mt-5 mb-2 text-xs font-semibold text-heading">利益披露（必填）</h4>
      <div className="grid gap-3 sm:grid-cols-4">
        <div><label className={label}>持仓状态 *</label>
          <select value={f.position} onChange={(e) => set("position", e.target.value)} className={input}>
            {POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
        <div><label className={label}>成本价（持仓时填）</label>
          <input value={f.entryPrice} onChange={(e) => set("entryPrice", e.target.value)} className={`${input} font-mono`} /></div>
        <div><label className={label}>仓位级别</label>
          <select value={f.sizeTier} onChange={(e) => set("sizeTier", e.target.value)} className={input}>
            <option value="">—</option>
            <option value="small">小</option><option value="medium">中</option><option value="large">大</option>
          </select></div>
        <div className="flex items-end gap-4 pb-1 text-xs text-muted">
          <label className="flex items-center gap-1"><input type="checkbox" checked={f.sponsored} onChange={(e) => set("sponsored", e.target.checked)} /> 有合作</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={f.referral} onChange={(e) => set("referral", e.target.checked)} /> 含返佣</label>
        </div>
        <div className="sm:col-span-4"><label className={label}>想法来源（可选）</label>
          <input value={f.sourceOfIdea} onChange={(e) => set("sourceOfIdea", e.target.value)} className={input} /></div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button type="submit" disabled={busy} className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-deep disabled:opacity-60">
          {busy ? "保存中…" : "发布判断（锁定）"}
        </button>
      </div>
    </form>
  );
}

/* ==================== 单行 + 更新/复盘 ==================== */

function CallRow({
  record,
  onChanged,
  onError,
}: {
  record: CallRecord;
  onChanged: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [mode, setMode] = useState<"none" | "update" | "close">("none");
  const status = statusOf(record);
  const closed = !!record.outcome;

  return (
    <div className="rounded-xl border border-line bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold text-heading">{record.call.tokenName}</span>
        <span className="font-mono text-xs uppercase text-muted">{record.call.symbol}</span>
        <span className="rounded-full border border-line px-2 py-px text-[10px] text-muted">{record.call.stance}</span>
        <span className="text-xs tabular-nums text-muted">{record.call.calledAt.slice(0, 16)}</span>
        <span className="text-[11px] text-muted">
          {closed ? `已复盘 · ${record.outcome!.verdict}` : status === "expired" ? "待复盘" : "进行中"}
          {" · "}{record.updates.length} 更新
        </span>
        {record.call.isHistorical && <span className="text-[10px] text-amber-600 dark:text-amber-400">⚑ 历史</span>}
        <span className="ml-auto flex gap-3 text-xs">
          <Link href={`/zh/dashboard/${record.call.id}`} target="_blank" className="text-muted hover:text-heading">查看</Link>
          {!closed && (
            <>
              <button type="button" onClick={() => setMode(mode === "update" ? "none" : "update")} className="text-accent hover:underline dark:text-accent-mint">+更新</button>
              <button type="button" onClick={() => setMode(mode === "close" ? "none" : "close")} className="text-accent hover:underline dark:text-accent-mint">复盘</button>
            </>
          )}
        </span>
      </div>

      {mode === "update" && (
        <UpdateForm
          callId={record.call.id}
          onDone={() => { setMode("none"); onChanged("已追加更新"); }}
          onError={onError}
        />
      )}
      {mode === "close" && (
        <CloseForm
          record={record}
          onDone={() => { setMode("none"); onChanged("已复盘关闭，记录冻结"); }}
          onError={onError}
        />
      )}
    </div>
  );
}

function UpdateForm({ callId, onDone, onError }: { callId: string; onDone: () => void; onError: (m: string) => void }) {
  const [type, setType] = useState<CallUpdate["type"]>("note");
  const [at, setAt] = useState(new Date().toISOString().slice(0, 16));
  const [content, setContent] = useState("");
  const [priceAt, setPriceAt] = useState("");
  const [positionAction, setPositionAction] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const update: CallUpdate = {
        callId,
        at: at + ":00",
        type,
        content: content.trim(),
        priceAt: priceAt ? Number(priceAt) : undefined,
        positionAction: (positionAction || undefined) as CallUpdate["positionAction"],
      };
      const res = await fetch("/api/admin/calls/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ update }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message ?? "保存失败");
      onDone();
    } catch (e2) {
      onError(e2 instanceof Error ? e2.message : "保存失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 border-t border-dashed border-line pt-3">
      <div className="flex flex-wrap gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as CallUpdate["type"])} className={input + " w-auto"}>
          <option value="note">笔记</option>
          <option value="thesis-change">论点修正</option>
          <option value="position-change">仓位变动</option>
          <option value="closed">结束</option>
        </select>
        <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className={input + " w-auto"} required />
        <input value={priceAt} onChange={(e) => setPriceAt(e.target.value)} placeholder="价格（可选）" className={input + " w-32 font-mono"} />
        {type === "position-change" && (
          <select value={positionAction} onChange={(e) => setPositionAction(e.target.value)} className={input + " w-auto"}>
            <option value="">动作（可选）</option>
            <option value="add">加仓</option>
            <option value="reduce">减仓</option>
            <option value="exit">清仓</option>
          </select>
        )}
      </div>
      <textarea value={content} rows={2} onChange={(e) => setContent(e.target.value)} className={input} required placeholder="内容" />
      <button type="submit" disabled={busy} className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent-deep disabled:opacity-60">
        {busy ? "保存中…" : "追加 Update"}
      </button>
    </form>
  );
}

function CloseForm({ record, onDone, onError }: { record: CallRecord; onDone: () => void; onError: (m: string) => void }) {
  const [verdict, setVerdict] = useState("wrong");
  const [closedAt, setClosedAt] = useState(new Date().toISOString().slice(0, 16));
  const [priceAtClose, setPriceAtClose] = useState("");
  const [maxMcap, setMaxMcap] = useState("");
  const [minMcap, setMinMcap] = useState("");
  const [manual, setManual] = useState(false);
  const [invalidationTriggered, setInvalidationTriggered] = useState(false);
  const [lessons, setLessons] = useState("");
  const [mistakeType, setMistakeType] = useState("");
  const [busy, setBusy] = useState(false);

  const ca = record.call.contractAddress;

  /** 抓现价作为 close 价 */
  const fetchClose = async () => {
    try {
      const res = await fetch(`/api/market?type=prices&cas=${encodeURIComponent(ca)}`);
      const j = await res.json();
      const p = j?.prices?.[ca];
      if (!p) return onError("抓不到现价，请手填");
      setPriceAtClose(String(p.priceUsd));
      setManual(false);
    } catch {
      onError("抓取失败");
    }
  };

  /** 用 OHLCV 计算判断后 max/min 市值（按价格比 × 判断时市值推算） */
  const fetchMaxMin = async () => {
    try {
      const tRes = await fetch(`/api/market?type=token&ca=${encodeURIComponent(ca)}`);
      const tJson = await tRes.json();
      const pairs = tJson?.pairs ?? [];
      const own = pairs.filter((p: { baseToken?: { address?: string } }) => (p?.baseToken?.address ?? "").toLowerCase() === ca.toLowerCase());
      const best = (own.length ? own : pairs)
        .filter((p: { pairAddress?: string }) => p.pairAddress)
        .sort((a: { liquidity?: { usd?: number } }, b: { liquidity?: { usd?: number } }) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
      if (!best) return onError("找不到交易对");
      const oRes = await fetch(
        `/api/market?type=ohlcv&chain=${best.chainId}&pair=${best.pairAddress}&range=ALL&withTs=1`
      );
      const oJson = await oRes.json();
      const series: [number, number][] = oJson?.series ?? [];
      if (series.length < 2) return onError("K 线数据不足");
      const from = Date.parse(record.call.calledAt) / 1000;
      const slice = series.filter(([t]) => t >= from).map(([, c]) => c);
      const all = slice.length >= 2 ? slice : series.map(([, c]) => c);
      const base = record.call.priceAtCall;
      setMaxMcap(String(Math.round(record.call.mcapAtCall * (Math.max(...all) / base))));
      setMinMcap(String(Math.round(record.call.mcapAtCall * (Math.min(...all) / base))));
    } catch {
      onError("计算失败，请手填");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/calls/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome: {
            callId: record.call.id,
            closedAt: closedAt + ":00",
            verdict,
            priceAtClose: Number(priceAtClose),
            mcapAtClose: Math.round(record.call.mcapAtCall * (Number(priceAtClose) / record.call.priceAtCall)),
            maxMcapAfterCall: Number(maxMcap),
            minMcapAfterCall: Number(minMcap),
            maxDrawdown: 0,
            invalidationTriggered,
            lessons: lessons.trim(),
            mistakeType: mistakeType || undefined,
            priceSource: manual ? "manual" : "auto",
          },
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message ?? "保存失败");
      onDone();
    } catch (e2) {
      onError(e2 instanceof Error ? e2.message : "保存失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 border-t border-dashed border-line pt-3">
      <div className="flex flex-wrap gap-2">
        <select value={verdict} onChange={(e) => setVerdict(e.target.value)} className={input + " w-auto"}>
          <option value="correct">判断正确</option>
          <option value="partly">部分正确</option>
          <option value="wrong">判断错误</option>
          <option value="unresolved">未结论</option>
        </select>
        <input type="datetime-local" value={closedAt} onChange={(e) => setClosedAt(e.target.value)} className={input + " w-auto"} required />
        <input value={priceAtClose} onChange={(e) => setPriceAtClose(e.target.value)} placeholder="结束价格 *" className={input + " w-36 font-mono"} required />
        <button type="button" onClick={() => void fetchClose()} className="rounded-lg border border-line px-3 py-2 text-xs text-muted hover:border-accent hover:text-accent">⚡ 现价</button>
        <label className="flex items-center gap-1 text-xs text-muted">
          <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} /> 手填
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input value={maxMcap} onChange={(e) => setMaxMcap(e.target.value)} placeholder="判断后最高市值 *" className={input + " w-44 font-mono"} required />
        <input value={minMcap} onChange={(e) => setMinMcap(e.target.value)} placeholder="判断后最低市值 *" className={input + " w-44 font-mono"} required />
        <button type="button" onClick={() => void fetchMaxMin()} className="rounded-lg border border-line px-3 py-2 text-xs text-muted hover:border-accent hover:text-accent">⚡ 从 K 线计算</button>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={invalidationTriggered} onChange={(e) => setInvalidationTriggered(e.target.checked)} /> 证伪条件已触发
        </label>
        <select value={mistakeType} onChange={(e) => setMistakeType(e.target.value)} className={input + " w-auto"}>
          <option value="">错误类型（可选）</option>
          {MISTAKES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <textarea value={lessons} rows={2} onChange={(e) => setLessons(e.target.value)} className={input} required placeholder="经验教训 *" />
      <button type="submit" disabled={busy} className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent-deep disabled:opacity-60">
        {busy ? "保存中…" : "确认复盘（记录冻结）"}
      </button>
    </form>
  );
}
