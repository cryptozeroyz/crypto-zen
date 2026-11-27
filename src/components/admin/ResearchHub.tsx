"use client";

/**
 * ResearchHub.tsx —— 投研统一工作台（原 关注列表/研究日志/判断记录 三页合一）
 * 以币为中心：左列表选币 → 右侧 判断/快记/持仓 三个子面板。
 * 判断发布后锁定；快记自动关联当前币；持仓 = 披露字段（锁定字段原样校验）。
 */

import { useEffect, useMemo, useState } from "react";
import type { Call, CallRecord, CallUpdate } from "@/lib/calls";
import { makeCallId } from "@/lib/calls";
import { statusOf } from "@/lib/calls-stats";
import { fmtCalledAt, posActionLabel, getTr } from "@/components/dashboard/tr";
import { buildMarkdown } from "@/lib/frontmatter";

/* ---------- 常量 ---------- */
/** 当前北京时间（UTC+8）的 datetime-local 值 */
function nowLocal(): string {
  return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 16);
}

const STANCES = ["watch", "bullish", "bearish", "avoid"] as const;
const STANCE_ZH: Record<string, string> = { watch: "观望", bullish: "看多", bearish: "看空", avoid: "避雷" };
const NTS = ["meme-culture", "event-driven", "ip", "celebrity", "ai", "other"] as const;
const HORIZONS = ["intraday", "days", "weeks", "months"] as const;
const POSITIONS = [
  ["none", "无持仓"], ["holding", "持仓中"], ["sold", "已清仓"], ["unknown", "未知（仅历史）"],
] as const;
const MISTAKES = ["narrative-fade", "late-entry", "liquidity", "rug", "timing", "sizing", "other"] as const;
const VERDICT_ZH: Record<string, string> = { correct: "判断正确", partly: "部分正确", wrong: "判断错误", unresolved: "未结论" };

const input =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent";
const label = "mb-1 block text-xs text-muted";
const STATUS_ZH = { open: "进行中", closed: "已复盘", expired: "待复盘" } as const;

interface JournalEntry {
  id: string; date: string; tokens: string[]; tags: string[];
  title: string; body: string; thesis?: string; risks?: string;
}
type Prices = Record<string, { priceUsd: number; mcap: number; change24h: number; imageUrl?: string; pairAddress?: string }>;

/** 日志与 call 的匹配（symbol 或 CA 精确匹配，同公开页逻辑） */
function matchJournal(record: CallRecord, j: JournalEntry): boolean {
  const sym = record.call.symbol.toLowerCase();
  const addr = record.call.contractAddress.toLowerCase();
  return j.tokens.some((t) => {
    const s = t.trim().toLowerCase();
    return s.length > 0 && (s === sym || s === addr);
  });
}

export interface RelatedReport {
  slug: string;
  title: string;
}

export default function ResearchHub({
  initialRecords,
  initialJournals,
  relatedMap = {},
}: {
  initialRecords: CallRecord[];
  initialJournals: JournalEntry[];
  /** callId → 关联研报（服务端按 tokens 匹配好） */
  relatedMap?: Record<string, RelatedReport[]>;
}) {
  const [records, setRecords] = useState<CallRecord[]>(initialRecords);
  const [journals, setJournals] = useState<JournalEntry[]>(initialJournals);
  const [selectedId, setSelectedId] = useState<string>(() => {
    const first = [...initialRecords].sort((a, b) =>
      b.call.calledAt.localeCompare(a.call.calledAt)
    )[0];
    return first ? first.call.id : "orphans";
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "expired" | "closed">("all");
  const [prices, setPrices] = useState<Prices>({});
  const [showNew, setShowNew] = useState(false);
  const [newCa, setNewCa] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  /* 现价轮询（全部 open 的 CA 一次批量） */
  const openCas = useMemo(
    () => records.filter((r) => !r.outcome).map((r) => r.call.contractAddress),
    [records]
  );
  useEffect(() => {
    if (openCas.length === 0) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/market?type=prices&cas=${encodeURIComponent(openCas.join(","))}`);
        const j = await res.json();
        if (!cancelled && j?.prices) setPrices(j.prices);
      } catch { /* 现价不可用时只显示判断时快照 */ }
    };
    void load();
    const t = setInterval(() => void load(), 120_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [openCas]);

  const refresh = async () => {
    const [c, j] = await Promise.all([
      fetch("/api/admin/calls").then((r) => r.json()),
      fetch("/api/admin/journal").then((r) => r.json()),
    ]);
    if (c?.records) setRecords(c.records);
    if (j?.entries) setJournals(j.entries);
  };
  const ok = (m: string) => { setMsg(m); setErr(null); void refresh(); };
  const bad = (m: string) => { setErr(m); setMsg(null); };

  /* 列表：按最近活跃（判断/更新/复盘最大时间）倒序 */
  const sorted = useMemo(() => {
    const activity = (r: CallRecord) =>
      [r.call.calledAt, ...r.updates.map((u) => u.at), r.outcome?.closedAt ?? ""].sort().pop() ?? "";
    return [...records].sort((a, b) => activity(b).localeCompare(activity(a)));
  }, [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((r) => {
      const st = statusOf(r);
      if (filter !== "all" && st !== filter) return false;
      if (!q) return true;
      return `${r.call.symbol} ${r.call.tokenName} ${r.call.contractAddress}`.toLowerCase().includes(q);
    });
  }, [sorted, query, filter]);

  const orphans = useMemo(
    () => journals.filter((j) => !records.some((r) => matchJournal(r, j))),
    [journals, records]
  );

  const selected = records.find((r) => r.call.id === selectedId) ?? null;
  const filterCount = (f: typeof filter) =>
    f === "all" ? records.length : records.filter((r) => statusOf(r) === f).length;

  return (
    <div>
      {/* 顶部提示 */}
      {msg && <p className="mb-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">{msg}</p>}
      {err && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">{err}</p>}

      {/* 快捷录入条 */}
      <QuickBar
        records={records}
        onLocate={(id) => { setSelectedId(id); setShowNew(false); }}
        onNew={(ca) => { setNewCa(ca); setShowNew(true); }}
        onError={bad}
      />

      {showNew && (
        <NewCallForm
          initialCa={newCa}
          onDone={(id) => { setShowNew(false); ok("已创建判断（已锁定，不可改写）"); setSelectedId(id); }}
          onError={bad}
        />
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* 左：币列表 */}
        <aside className="rounded-2xl border border-line bg-card lg:sticky lg:top-[76px] lg:self-start">
          <div className="border-b border-line p-2.5">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索 symbol / 名称 / CA…" className={input} />
          </div>
          <div className="flex flex-wrap gap-1.5 border-b border-line px-3 py-2">
            {(["all", "open", "expired", "closed"] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${filter === f ? "border-accent font-semibold text-accent dark:text-accent-mint" : "border-line text-muted hover:text-heading"}`}>
                {f === "all" ? "全部" : STATUS_ZH[f]} {filterCount(f)}
              </button>
            ))}
          </div>
          <div className="max-h-[62vh] overflow-y-auto">
            {filtered.map((r) => {
              const st = statusOf(r);
              const p = prices[r.call.contractAddress];
              const perf = r.outcome
                ? r.outcome.returnAtClose
                : p?.priceUsd
                  ? (p.priceUsd / r.call.priceAtCall - 1) * 100
                  : null;
              return (
                <button key={r.call.id} type="button" onClick={() => setSelectedId(r.call.id)}
                  className={`flex w-full items-center gap-2.5 border-b border-dashed border-line px-3 py-2.5 text-left transition-colors ${selectedId === r.call.id ? "bg-accent/5 shadow-[inset_3px_0_0_var(--color-accent)]" : "hover:bg-line/30"}`}>
                  <CoinLogo record={r} imageUrl={p?.imageUrl} size={32} />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[13px] text-heading">{r.call.tokenName}</b>
                    <span className="text-[10.5px] text-muted">
                      {r.call.calledAt.slice(5, 10)} · {STATUS_ZH[st]}
                      {r.updates.length > 0 && ` · ${r.updates.length}更新`}
                    </span>
                  </span>
                  {perf !== null && (
                    <span className={`font-mono text-[12px] font-bold tabular-nums ${perf >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {perf >= 0 ? "+" : ""}{perf.toFixed(1)}%
                    </span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && <p className="px-3 py-8 text-center text-xs text-muted">没有匹配的币</p>}
            {/* 游离日志入口 */}
            <button type="button" onClick={() => setSelectedId("orphans")}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs ${selectedId === "orphans" ? "bg-accent/5 shadow-[inset_3px_0_0_var(--color-accent)]" : "hover:bg-line/30"}`}>
              <span className="text-base">📝</span>
              <span className="flex-1 text-muted">未关联日志</span>
              <span className="rounded-full bg-codebg px-2 py-px font-mono text-[10px] text-muted">{orphans.length}</span>
            </button>
          </div>
        </aside>

        {/* 右：工作台 */}
        <section className="min-w-0">
          {selected ? (
            <CoinWorkspace
              record={selected}
              journals={journals.filter((j) => matchJournal(selected, j))}
              price={prices[selected.call.contractAddress]}
              related={relatedMap[selected.call.id] ?? []}
              onChanged={ok}
              onError={bad}
            />
          ) : selectedId === "orphans" ? (
            <OrphanPanel
              orphans={orphans}
              records={records}
              onChanged={ok}
              onError={bad}
            />
          ) : (
            <p className="py-16 text-center text-sm text-muted">← 从左侧选择一个币开始</p>
          )}
        </section>
      </div>
    </div>
  );
}

/* ==================== 顶部快捷条 ==================== */

function QuickBar({
  records, onLocate, onNew, onError,
}: {
  records: CallRecord[];
  onLocate: (id: string) => void;
  onNew: (ca: string) => void;
  onError: (m: string) => void;
}) {
  const [ca, setCa] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    const addr = ca.trim();
    if (!/^[0-9a-zA-Z]{20,80}$/.test(addr)) return onError("合约地址格式不正确");
    setBusy(true);
    try {
      const hit = records.find((r) => r.call.contractAddress.toLowerCase() === addr.toLowerCase());
      if (hit) { onLocate(hit.call.id); return; }
      const res = await fetch(`/api/market?type=prices&cas=${encodeURIComponent(addr)}`);
      const j = await res.json();
      if (!j?.prices?.[addr]) onError("库中没有该币，且行情也抓不到——仍可手动新建");
      onNew(addr);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-2 rounded-2xl border-[1.5px] border-dashed border-[#5c2a52] bg-card p-3">
      <input
        value={ca}
        onChange={(e) => setCa(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && void go()}
        placeholder="粘贴合约地址（CA）… 回车：已有则定位，没有则带行情新建"
        className={`${input} font-mono`}
      />
      <button type="button" onClick={() => void go()} disabled={busy}
        className="shrink-0 rounded-lg border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50">
        ⚡ 抓取并定位
      </button>
      <button type="button" onClick={() => onNew(ca.trim())}
        className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-deep">
        + 新建判断
      </button>
    </div>
  );
}

/* ==================== 币工作台 ==================== */

function CoinWorkspace({
  record, journals, price, related, onChanged, onError,
}: {
  record: CallRecord;
  journals: JournalEntry[];
  price?: Prices[string];
  related: RelatedReport[];
  onChanged: (m: string) => void;
  onError: (m: string) => void;
}) {
  const [sub, setSub] = useState<"call" | "journal" | "position">("call");
  const { call, updates, outcome } = record;
  const status = statusOf(record);
  const curPrice = outcome ? outcome.priceAtClose : price?.priceUsd;
  const perf = curPrice !== undefined ? (curPrice / call.priceAtCall - 1) * 100 : null;

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      {/* 头部 */}
      <div className="flex flex-wrap items-center gap-3">
        <CoinLogo record={record} imageUrl={price?.imageUrl} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="font-serif text-[22px] font-bold text-[#5c2a52]">{call.tokenName}</h2>
            <span className="rounded-full border border-line px-2 py-px text-[10.5px] font-semibold text-muted">{STANCE_ZH[call.stance]}</span>
            {outcome && (
              <span className={`rounded-full border px-2 py-px text-[10.5px] font-bold ${outcome.verdict === "correct" ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400" : outcome.verdict === "wrong" ? "border-red-500/40 text-red-700 dark:text-red-400" : "border-amber-500/40 text-amber-700 dark:text-amber-400"}`}>
                {VERDICT_ZH[outcome.verdict]}
              </span>
            )}
            {!outcome && (
              <span className="rounded-full border border-line px-2 py-px text-[10.5px] text-muted">{STATUS_ZH[status]}</span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-muted">
            <span className="font-mono uppercase">{call.symbol}</span> · {call.chain} · 判断于 {fmtCalledAt(call.calledAt)}
            {call.isHistorical && <span className="ml-1.5 text-amber-600 dark:text-amber-400">⚑ 历史记录，非事前判断</span>}
          </p>
        </div>
        {perf !== null && (
          <div className="text-right">
            <div className={`font-mono text-[24px] font-bold leading-none tabular-nums ${perf >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {perf >= 0 ? "+" : ""}{perf.toFixed(1)}%
            </div>
            <div className="mt-1 text-[10px] text-muted">判断以来{price && !outcome ? ` · 现价 $${price.priceUsd}` : ""}</div>
          </div>
        )}
      </div>

      {/* 子 tab */}
      <div className="mt-4 flex gap-1 border-b border-line">
        {([["call", "判断 · Call"], ["journal", `快记 · ${journals.length}`], ["position", "持仓 · Position"]] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setSub(k)}
            className={`-mb-px border-b-2 px-4 py-2 text-[13px] transition-colors ${sub === k ? "border-accent font-bold text-accent dark:text-accent-mint" : "border-transparent text-muted hover:text-heading"}`}>
            {l}
          </button>
        ))}
      </div>

      {sub === "call" && (
        <CallPane record={record} related={related} onChanged={onChanged} onError={onError} />
      )}
      {sub === "journal" && (
        <JournalPane record={record} journals={journals} onChanged={onChanged} onError={onError} />
      )}
      {sub === "position" && (
        <PositionPane record={record} price={price} onChanged={onChanged} onError={onError} />
      )}
    </div>
  );
}

/* ---------- 子面板 1：判断 ---------- */

function CallPane({ record, related, onChanged, onError }: { record: CallRecord; related: RelatedReport[]; onChanged: (m: string) => void; onError: (m: string) => void }) {
  const [mode, setMode] = useState<"none" | "update" | "close">("none");
  const { call, updates, outcome } = record;
  const tr = getTr("zh");
  /* 立场快捷修改（判断随行情修正，自动留痕） */
  const [stanceBusy, setStanceBusy] = useState(false);
  const saveStance = async (next: string) => {
    setStanceBusy(true);
    try {
      const res = await fetch("/api/admin/calls/stance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: call.id, stance: next }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message ?? "保存失败");
      onChanged(`立场已更新为「${STANCE_ZH[next] ?? next}」，时间线已留痕`);
    } catch (e) {
      onError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setStanceBusy(false);
    }
  };

  /* AI 快速研报：Grok 搜 X 讨论 + DeepSeek 六维成文 */
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMd, setAiMd] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);

  const genAi = async () => {
    setAiBusy(true);
    onError("");
    try {
      const res = await fetch("/api/admin/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ca: call.contractAddress }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "生成失败");
      setAiMd(data.markdown ?? "");
      setAiOpen(true);
    } catch (e) {
      onError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setAiBusy(false);
    }
  };

  const saveAi = async () => {
    if (!aiMd.trim()) return;
    setAiSaving(true);
    try {
      /* 1) 存为快记（挂到当前币，出现在投研时间线） */
      const jRes = await fetch("/api/admin/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          tokens: [call.symbol, call.contractAddress],
          tags: ["快速研报", "AI"],
          title: `AI 快速研报：${call.tokenName || call.symbol}`.trim(),
          body: aiMd,
        }),
      });
      if (!jRes.ok) throw new Error((await jRes.json().catch(() => null))?.message ?? "快记保存失败");
      /* 2) 同步生成文章草稿（AI 标注 + 默认草稿态，后台审核后发布） */
      try {
        const slug = `ai-report-${(call.symbol || "token").toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;
        const md = buildMarkdown(
          {
            title: `AI 快速研报：${call.tokenName || call.symbol || ""}`,
            date: new Date().toISOString().slice(0, 10),
            updated: "",
            category: "research",
            excerpt: `AI 双模型自动生成的 ${call.symbol || ""} 客观研报，含社区氛围评分与 DYOR 检查项。`,
            tags: ["AI", "快速研报", call.symbol || ""],
            tokens: [call.symbol || ""],
            cover: "",
            dexScreener: "",
            draft: true,
          },
          aiMd
        );
        await fetch("/api/admin/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, markdown: md }),
        });
      } catch { /* 文章同步失败不阻塞 */ }
      setAiMd("");
      setAiOpen(false);
      onChanged("AI 研报已保存（快记 + 文章草稿）");
    } catch (e) {
      onError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setAiSaving(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {/* 快照（只读） */}
      <div className="rounded-xl border-[1.5px] border-dashed border-line bg-white p-4">
        <h4 className="text-[11px] font-semibold tracking-wider text-muted">◉ 判断快照（发布后锁定，不可改写）</h4>
        {call.thesis !== call.narrative && (
          <p className="mt-2 text-[13.5px] font-semibold text-heading">{call.narrative}</p>
        )}
        <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-[#2a2230]/85">{call.thesis}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <KV k="判断时价格" v={`$${call.priceAtCall}`} />
          <KV k="判断时市值" v={`$${(call.mcapAtCall / 1e6).toFixed(2)}M`} />
          <KV k="周期" v={call.horizon} />
          <KV k="叙事类型" v={call.narrativeType} />
        </div>
        {(call.catalysts.length > 0 || call.risks.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {call.catalysts.map((c) => <span key={c} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-400">🧨 {c}</span>)}
            {call.risks.map((r) => <span key={r} className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-700 dark:text-red-400">⚠️ {r}</span>)}
          </div>
        )}
      </div>

      {/* 证伪条件 */}
      <div className="rounded-xl border-[1.5px] border-dashed border-[#ff5b3a]/60 bg-white p-4">
        <h4 className="text-[11px] font-semibold tracking-wider text-[#ff5b3a]">⚠ 什么情况算我错（invalidation）</h4>
        <p className="mt-1.5 text-[13px] leading-relaxed text-heading">{call.invalidation}</p>
      </div>

      {/* 目标/成功标准 */}
      {(call.successCriteria || call.targetMcap || call.stopMcap) && (
        <div className="rounded-xl border-[1.5px] border-dashed border-line bg-white p-4 text-xs">
          {call.successCriteria && <p className="mb-1.5"><span className="text-muted">成功标准：</span>{call.successCriteria}</p>}
          <div className="flex gap-5 font-mono">
            {call.targetMcap && <span className="text-muted">🎯 目标 <b className="text-heading">${(call.targetMcap / 1e6).toFixed(1)}M</b></span>}
            {call.stopMcap && <span className="text-muted">🛑 止损 <b className="text-heading">${(call.stopMcap / 1e6).toFixed(1)}M</b></span>}
          </div>
        </div>
      )}

      {/* 关联研报（按 tokens 自动匹配） */}
      {related.length > 0 && (
        <div className="rounded-xl border border-line bg-white px-4 py-3">
          <h4 className="text-[11px] font-semibold tracking-wider text-muted">📄 关联研报（{related.length}）</h4>
          <ul className="mt-2 space-y-1.5 text-xs">
            {related.map((r) => (
              <li key={r.slug}>
                <a href={`/zh/writing/${r.slug}`} target="_blank" rel="noopener noreferrer"
                  className="text-accent underline-offset-2 hover:underline dark:text-accent-mint">
                  {r.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 操作 */}
      <div className="flex flex-wrap items-center gap-2.5">
        {!outcome && (
          <label className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted">
            立场
            <select
              value={call.stance}
              disabled={stanceBusy}
              onChange={(e) => {
                const next = e.target.value;
                if (next === call.stance) return;
                if (!window.confirm(`立场改为「${STANCE_ZH[next] ?? next}」？将自动在时间线留痕`)) {
                  e.target.value = call.stance;
                  return;
                }
                void saveStance(next);
              }}
              className="bg-transparent font-semibold text-heading outline-none"
            >
              {STANCES.map((st) => (
                <option key={st} value={st}>{STANCE_ZH[st]} {st}</option>
              ))}
            </select>
          </label>
        )}
        {!outcome && (
          <>
            <button type="button" onClick={() => setMode(mode === "update" ? "none" : "update")}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-deep">
              ✎ 追加更新
            </button>
            <button type="button" onClick={() => setMode(mode === "close" ? "none" : "close")}
              className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-heading hover:text-heading">
              ⚖ 复盘关闭
            </button>
          </>
        )}
        <button type="button" onClick={() => void genAi()} disabled={aiBusy}
          className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50">
          {aiBusy ? "⏳ 生成中（约 30 秒）…" : "⚡ AI 快速研报"}
        </button>
        {!outcome && <span className="ml-auto text-[11px] text-muted">改错只能追加「论点修正」，不能改写原判断</span>}
      </div>

      {/* AI 研报结果 */}
      {aiOpen && (
        <div className="space-y-2.5 rounded-xl border-[1.5px] border-dashed border-[#5c2a52] bg-white p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-semibold tracking-wider text-[#5c2a52]">🤖 AI 快速研报（Grok 搜 X + DeepSeek 成文，未经人工核实）</h4>
            <button type="button" onClick={() => { setAiOpen(false); setAiMd(""); }} className="text-xs text-muted hover:text-heading">✕ 关闭</button>
          </div>
          {aiMd ? (
            <>
              <textarea readOnly value={aiMd} rows={10}
                className="w-full resize-y rounded-lg border border-line bg-card px-3 py-2 font-mono text-xs leading-relaxed text-heading outline-none" />
              <div className="flex gap-2">
                <button type="button" onClick={() => void saveAi()} disabled={aiSaving}
                  className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-deep disabled:opacity-50">
                  {aiSaving ? "保存中…" : "💾 存为快记 + 文章草稿"}
                </button>
                <button type="button" onClick={() => void genAi()} disabled={aiBusy}
                  className="rounded-lg border border-line px-4 py-1.5 text-xs text-muted hover:border-accent hover:text-accent">
                  ↻ 重新生成
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted">{aiBusy ? "正在抓取 X 讨论并生成（约 30 秒）…" : "点击「⚡ AI 快速研报」生成"}</p>
          )}
        </div>
      )}

      {mode === "update" && (
        <UpdateForm callId={call.id} onDone={() => { setMode("none"); onChanged("已追加更新"); }} onError={onError} />
      )}
      {mode === "close" && (
        <CloseForm record={record} onDone={() => { setMode("none"); onChanged("已复盘关闭，记录冻结"); }} onError={onError} />
      )}

      {/* 时间线 */}
      <div className="rounded-xl border border-line bg-white p-4">
        <h4 className="text-[11px] font-semibold tracking-wider text-muted">✎ 动态时间线（{updates.length + 1 + (outcome ? 1 : 0)}）</h4>
        <div className="relative mt-3 space-y-3 pl-5">
          <span className="absolute bottom-2 left-[5px] top-2 w-0.5 bg-line" aria-hidden="true" />
          <TlEvent kind="◉ 判断" at={fmtCalledAt(call.calledAt)} price={call.priceAtCall}>
            {call.thesis}
          </TlEvent>
          {[...updates].sort((a, b) => b.at.localeCompare(a.at)).map((u, i) => (
            <TlEvent key={i}
              kind={u.type === "thesis-change" ? "↺ 论点修正" : u.type === "position-change" ? `⇄ 仓位变动${u.positionAction ? ` · ${posActionLabel(u.positionAction, tr)}` : ""}` : u.type === "closed" ? "■ 结束" : "✎ 笔记"}
              at={fmtCalledAt(u.at)} price={u.priceAt}>
              {u.content}
            </TlEvent>
          ))}
          {outcome && (
            <TlEvent kind={`⚖ 复盘 · ${VERDICT_ZH[outcome.verdict]}`} at={fmtCalledAt(outcome.closedAt)} price={outcome.priceAtClose}>
              {outcome.returnAtClose >= 0 ? "+" : ""}{outcome.returnAtClose}% · {outcome.lessons}
            </TlEvent>
          )}
        </div>
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-codebg px-2.5 py-1.5">
      <small className="block text-[9.5px] text-muted">{k}</small>
      <b className="font-mono text-[12px] text-heading">{v}</b>
    </div>
  );
}

function TlEvent({ kind, at, price, children }: { kind: string; at: string; price?: number; children: React.ReactNode }) {
  // at 已用 fmtCalledAt 格式化
  return (
    <div className="relative">
      <span className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
      <div className="rounded-lg border border-line px-3 py-2">
        <div className="text-[10.5px] text-muted">
          <b className="text-heading">{kind}</b> · {at.slice(0, 16)}
          {price !== undefined && <span className="ml-1.5 font-mono">@${price}</span>}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-heading">{children}</p>
      </div>
    </div>
  );
}

/* ---------- 子面板 2：快记 ---------- */

function JournalPane({ record, journals, onChanged, onError }: { record: CallRecord; journals: JournalEntry[]; onChanged: (m: string) => void; onError: (m: string) => void }) {
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!body.trim()) return onError("写点东西再保存");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokens: [record.call.symbol, record.call.contractAddress],
          tags: tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
          body: body.trim(),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message ?? "保存失败");
      setBody(""); setTags("");
      onChanged("快记已保存（已关联当前币）");
    } catch (e) {
      onError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    if (!window.confirm("删除这条快记？")) return;
    const res = await fetch("/api/admin/journal", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const j = await res.json();
    if (!res.ok) return onError(j?.message ?? "删除失败");
    onChanged("已删除");
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-xl border-[1.5px] border-dashed border-[#5c2a52] bg-white p-4">
        <h4 className="text-[11px] font-semibold tracking-wider text-[#5c2a52]">⚡ 快记（自动关联 {record.call.symbol}，会出现在前台该币的时间线）</h4>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="碎片观察 / 假设 / 数据速记…" className={`${input} mt-2`} />
        <div className="mt-2 flex gap-2">
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="标签（逗号分隔，可选）" className={input} />
          <button type="button" onClick={() => void save()} disabled={busy}
            className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-50">
            {busy ? "保存中…" : "保存快记"}
          </button>
        </div>
      </div>
      {journals.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted">这个币还没有快记</p>
      ) : (
        <div className="space-y-2.5">
          {journals.map((j) => (
            <div key={j.id} className="rounded-xl border border-line bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-[10.5px] text-muted">
                <b className="text-heading">{j.date}</b>
                {j.tags.map((t) => <span key={t} className="rounded-full bg-codebg px-1.5 py-px text-[10px]">{t}</span>)}
                <button type="button" onClick={() => void del(j.id)} className="ml-auto text-red-600 hover:underline dark:text-red-400">删除</button>
              </div>
              {j.title && <p className="mt-1 text-[13px] font-semibold text-heading">{j.title}</p>}
              <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-heading">{j.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- 子面板 3：持仓 ---------- */

function PositionPane({ record, price, onChanged, onError }: { record: CallRecord; price?: Prices[string]; onChanged: (m: string) => void; onError: (m: string) => void }) {
  const d = record.call.disclosure;
  const tr = getTr("zh");
  const [position, setPosition] = useState(d.position);
  const [entryPrice, setEntryPrice] = useState(d.entryPrice ? String(d.entryPrice) : "");
  const [sizeTier, setSizeTier] = useState(d.sizeTier ?? "");
  const [sponsored, setSponsored] = useState(d.sponsored);
  const [referral, setReferral] = useState(d.referral);
  const [sourceOfIdea, setSourceOfIdea] = useState(d.sourceOfIdea ?? "");
  const [busy, setBusy] = useState(false);

  const pnl =
    d.position === "holding" && d.entryPrice && price?.priceUsd
      ? ((price.priceUsd / d.entryPrice - 1) * 100)
      : null;
  const posUpdates = record.updates.filter((u) => u.type === "position-change");

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/calls/disclosure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: record.call.id,
          disclosure: {
            position,
            entryPrice: entryPrice ? Number(entryPrice) : undefined,
            sizeTier: sizeTier || undefined,
            sponsored,
            referral,
            sourceOfIdea: sourceOfIdea.trim() || undefined,
          },
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message ?? "保存失败");
      onChanged("持仓披露已更新");
    } catch (e) {
      onError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {pnl !== null && (
        <div className="rounded-xl border-[1.5px] border-dashed border-line bg-white p-4">
          <h4 className="text-[11px] font-semibold tracking-wider text-muted">持仓盈亏速览</h4>
          <div className="mt-2 flex items-baseline gap-4">
            <span className={`font-mono text-2xl font-bold tabular-nums ${pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {pnl >= 0 ? "+" : ""}{pnl.toFixed(1)}%
            </span>
            <span className="text-xs text-muted">成本 ${d.entryPrice} → 现价 ${price?.priceUsd}</span>
          </div>
        </div>
      )}

      <div className="rounded-xl border-[1.5px] border-dashed border-line bg-white p-4">
        <h4 className="text-[11px] font-semibold tracking-wider text-muted">利益披露（可更新；判断本体仍锁定）</h4>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label className={label}>持仓状态</label>
            <select value={position} onChange={(e) => setPosition(e.target.value as typeof position)} className={input}>
              {POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>成本价（持仓时填）</label>
            <input value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className={`${input} font-mono`} />
          </div>
          <div>
            <label className={label}>仓位级别</label>
            <select value={sizeTier} onChange={(e) => setSizeTier(e.target.value)} className={input}>
              <option value="">—</option>
              <option value="small">小</option><option value="medium">中</option><option value="large">大</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={sponsored} onChange={(e) => setSponsored(e.target.checked)} /> 有合作</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={referral} onChange={(e) => setReferral(e.target.checked)} /> 含返佣</label>
          <input value={sourceOfIdea} onChange={(e) => setSourceOfIdea(e.target.value)} placeholder="想法来源（可选）" className={`${input} max-w-xs`} />
          <button type="button" onClick={() => void save()} disabled={busy}
            className="ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-50">
            {busy ? "保存中…" : "保存披露"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-white p-4">
        <h4 className="text-[11px] font-semibold tracking-wider text-muted">仓位变动历史（{posUpdates.length}）</h4>
        {posUpdates.length === 0 ? (
          <p className="mt-2 text-xs text-muted">还没有仓位变动记录；在「判断」面板追加 position-change 更新即可留痕。</p>
        ) : (
          <div className="relative mt-3 space-y-3 pl-5">
            <span className="absolute bottom-2 left-[5px] top-2 w-0.5 bg-line" aria-hidden="true" />
            {[...posUpdates].sort((a, b) => b.at.localeCompare(a.at)).map((u, i) => (
              <TlEvent key={i} kind={`⇄ 仓位变动${u.positionAction ? ` · ${posActionLabel(u.positionAction, tr)}` : ""}`} at={fmtCalledAt(u.at)} price={u.priceAt}>
                {u.content}
              </TlEvent>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 游离日志 ---------- */

function OrphanPanel({
  orphans, records, onChanged, onError,
}: {
  orphans: JournalEntry[];
  records: CallRecord[];
  onChanged: (m: string) => void;
  onError: (m: string) => void;
}) {
  const [attachTo, setAttachTo] = useState<Record<string, string>>({});

  const attach = async (j: JournalEntry) => {
    const target = records.find((r) => r.call.id === attachTo[j.id]);
    if (!target) return onError("先选择要挂到的币");
    const res = await fetch("/api/admin/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: j.id, date: j.date, tokens: [target.call.symbol, target.call.contractAddress],
        tags: j.tags, title: j.title, body: j.body,
      }),
    });
    const rj = await res.json();
    if (!res.ok) return onError(rj?.message ?? "关联失败");
    onChanged(`已挂到 ${target.call.symbol}`);
  };

  const del = async (id: string) => {
    if (!window.confirm("删除这条日志？")) return;
    const res = await fetch("/api/admin/journal", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const j = await res.json();
    if (!res.ok) return onError(j?.message ?? "删除失败");
    onChanged("已删除");
  };

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h3 className="font-serif text-lg font-bold text-[#5c2a52]">📝 未关联日志（{orphans.length}）</h3>
      <p className="mt-1 text-xs text-muted">这些日志的 tokens 没有匹配到任何判断记录——可以挂到某个币下，或删除。</p>
      {orphans.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted">没有游离日志，很好</p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {orphans.map((j) => (
            <div key={j.id} className="rounded-xl border border-line bg-white px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
                <b className="text-heading">{j.date}</b>
                <span className="font-mono">[{j.tokens.join(", ") || "无tokens"}]</span>
                {j.tags.map((t) => <span key={t} className="rounded-full bg-codebg px-1.5 py-px text-[10px]">{t}</span>)}
              </div>
              {j.title && <p className="mt-1 text-[13px] font-semibold text-heading">{j.title}</p>}
              <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-heading">{j.body}</p>
              <div className="mt-2.5 flex items-center gap-2 text-xs">
                <select value={attachTo[j.id] ?? ""} onChange={(e) => setAttachTo((s) => ({ ...s, [j.id]: e.target.value }))} className={`${input} w-auto`}>
                  <option value="">挂到…</option>
                  {records.map((r) => <option key={r.call.id} value={r.call.id}>{r.call.symbol} · {r.call.tokenName}</option>)}
                </select>
                <button type="button" onClick={() => void attach(j)} className="rounded-lg border border-line px-3 py-1.5 text-muted hover:border-accent hover:text-accent">认领</button>
                <button type="button" onClick={() => void del(j.id)} className="ml-auto text-red-600 hover:underline dark:text-red-400">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==================== 新建判断表单 ==================== */

function NewCallForm({ initialCa = "", onDone, onError }: { initialCa?: string; onDone: (id: string) => void; onError: (m: string) => void }) {
  const [f, setF] = useState({
    ca: initialCa,
    date: nowLocal(),
    slug: "", chain: "solana", tokenName: "", symbol: "",
    stance: "watch", narrativeType: "meme-culture", horizon: "weeks",
    priceAtCall: "", mcapAtCall: "", pairAddress: "", manualPrice: false,
    narrative: "", thesis: "", catalysts: "", risks: "",
    invalidation: "", successCriteria: "", targetMcap: "", stopMcap: "",
    proofUrl: "", tags: "", relatedReports: "",
    position: "none", entryPrice: "", sizeTier: "", sponsored: false, referral: false, sourceOfIdea: "",
  });
  const [busy, setBusy] = useState(false);
  /** 代币名/symbol/链 是否被用户手动改过（手改后自动识别不再覆盖） */
  const [infoTouched, setInfoTouched] = useState(false);
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));
  /** 短名自动生成：symbol → 代币名英数词 → CA 前缀 */
  const autoSlug =
    f.symbol.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) ||
    (f.tokenName.trim().match(/[a-zA-Z0-9]+/g) ?? []).join("-").toLowerCase().slice(0, 24) ||
    f.ca.trim().toLowerCase().slice(0, 8) ||
    "call";
  const id = makeCallId(`${f.date}:00`, autoSlug);

  /** 输入 CA 后自动识别：代币名 / symbol / 链 / 价格 / 市值 / 池子 */
  const fetchInfo = async (opts?: { silent?: boolean }) => {
    const ca = f.ca.trim();
    if (!/^[0-9a-zA-Z]{20,80}$/.test(ca)) return;
    try {
      const res = await fetch(`/api/market?type=token&ca=${encodeURIComponent(ca)}`);
      const j = await res.json();
      const pairs: Array<{
        baseToken?: { name?: string; symbol?: string; address?: string };
        chainId?: string; priceUsd?: string; marketCap?: number; fdv?: number;
        pairAddress?: string;
      }> = j?.pairs ?? [];
      const own = pairs.filter(
        (pp) => (pp?.baseToken?.address ?? "").toLowerCase() === ca.toLowerCase()
      );
      const best = (own.length ? own : pairs)
        .filter((pp) => pp.pairAddress)
        .sort((a, b) => Number(b.marketCap ?? b.fdv ?? 0) - Number(a.marketCap ?? a.fdv ?? 0))[0];
      if (!best?.priceUsd) {
        if (!opts?.silent) onError("抓不到该币信息（可手填，价格勾选手填）");
        return;
      }
      setF((prev) => ({
        ...prev,
        tokenName: infoTouched ? prev.tokenName : best.baseToken?.name || prev.tokenName,
        symbol: infoTouched ? prev.symbol : (best.baseToken?.symbol || prev.symbol).toUpperCase(),
        chain: infoTouched ? prev.chain : best.chainId || prev.chain,
        priceAtCall: String(Number(best.priceUsd)),
        mcapAtCall: String(Math.round(Number(best.marketCap ?? best.fdv ?? 0))),
        pairAddress: best.pairAddress ?? prev.pairAddress,
        manualPrice: false,
      }));
    } catch {
      if (!opts?.silent) onError("识别失败，请检查合约地址");
    }
  };

  /* 输入 CA 防抖自动识别（1 秒），手填字段不覆盖 */
  useEffect(() => {
    if (!/^[0-9a-zA-Z]{20,80}$/.test(f.ca.trim())) return;
    const t = setTimeout(() => void fetchInfo({ silent: true }), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.ca]);

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
        calledAt: `${f.date}:00`,
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
      onDone(id);
    } catch (e2) {
      onError(e2 instanceof Error ? e2.message : "保存失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 rounded-2xl border border-line bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold text-heading">新建判断（发布后锁定）</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label className={label}>判断时间 *</label>
          <input type="datetime-local" value={f.date} onChange={(e) => set("date", e.target.value)} className={input} required /></div>
        <div>
          <label className={label}>记录 ID（自动生成）</label>
          <input value={id} readOnly className={`${input} font-mono opacity-70`} />
        </div>
        <div><label className={label}>链 *</label>
          <input value={f.chain} onChange={(e) => { set("chain", e.target.value); setInfoTouched(true); }} className={input} required /></div>
        <div><label className={label}>代币名 *</label>
          <input value={f.tokenName} onChange={(e) => { set("tokenName", e.target.value); setInfoTouched(true); }} className={input} required /></div>
        <div><label className={label}>Symbol *</label>
          <input value={f.symbol} onChange={(e) => { set("symbol", e.target.value); setInfoTouched(true); }} className={input} required /></div>
        <div><label className={label}>合约地址 *</label>
          <input id="newcall-ca" value={f.ca} onChange={(e) => set("ca", e.target.value)} className={`${input} font-mono`} required /></div>
        <div><label className={label}>立场 *</label>
          <select value={f.stance} onChange={(e) => set("stance", e.target.value)} className={input}>
            {STANCES.map((s) => <option key={s} value={s}>{STANCE_ZH[s]} {s}</option>)}
          </select></div>
        <div><label className={label}>叙事类型 *（可选常用项，也可输入自定义）</label>
          <input
            value={f.narrativeType}
            onChange={(e) => set("narrativeType", e.target.value.toLowerCase())}
            list="nt-suggestions"
            placeholder="如 meme-culture / utility / 自定义"
            className={input}
            required
          />
          <datalist id="nt-suggestions">
            {NTS.map((s) => <option key={s} value={s} />)}
          </datalist></div>
        <div><label className={label}>周期 *</label>
          <select value={f.horizon} onChange={(e) => set("horizon", e.target.value)} className={input}>
            {HORIZONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select></div>
        <div><label className={label}>判断时价格 *</label>
          <input value={f.priceAtCall} onChange={(e) => set("priceAtCall", e.target.value)} className={`${input} font-mono`} required /></div>
        <div><label className={label}>判断时市值 *</label>
          <input value={f.mcapAtCall} onChange={(e) => set("mcapAtCall", e.target.value)} className={`${input} font-mono`} required /></div>
        <div className="flex items-end gap-2 pb-0.5">
          <button type="button" onClick={() => void fetchInfo()} className="rounded-lg border border-line px-3 py-2 text-xs text-muted hover:border-accent hover:text-accent">⚡ 重新识别</button>
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

      <div className="mt-5 flex justify-end">
        <button type="submit" disabled={busy} className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-deep disabled:opacity-60">
          {busy ? "保存中…" : "发布判断（锁定）"}
        </button>
      </div>
    </form>
  );
}

/* ==================== 更新 / 复盘表单（沿用原逻辑） ==================== */

function UpdateForm({ callId, onDone, onError }: { callId: string; onDone: () => void; onError: (m: string) => void }) {
  const [type, setType] = useState<CallUpdate["type"]>("note");
  const [at, setAt] = useState(nowLocal());
  const [content, setContent] = useState("");
  const [priceAt, setPriceAt] = useState("");
  const [positionAction, setPositionAction] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const update: CallUpdate = {
        callId, at: `${at}:00`, type, content: content.trim(),
        priceAt: priceAt ? Number(priceAt) : undefined,
        positionAction: (positionAction || undefined) as CallUpdate["positionAction"],
      };
      const res = await fetch("/api/admin/calls/update", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ update }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message ?? "保存失败");
      onDone();
    } catch (e2) { onError(e2 instanceof Error ? e2.message : "保存失败"); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border-[1.5px] border-dashed border-[#ff5b3a]/60 bg-white p-4">
      <div className="flex flex-wrap gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as CallUpdate["type"])} className={`${input} w-auto`}>
          <option value="note">笔记</option>
          <option value="thesis-change">论点修正</option>
          <option value="position-change">仓位变动</option>
          <option value="closed">结束</option>
        </select>
        <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className={`${input} w-auto`} required />
        <input value={priceAt} onChange={(e) => setPriceAt(e.target.value)} placeholder="价格（可选）" className={`${input} w-32 font-mono`} />
        {type === "position-change" && (
          <select value={positionAction} onChange={(e) => setPositionAction(e.target.value)} className={`${input} w-auto`}>
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
  const [closedAt, setClosedAt] = useState(nowLocal());
  const [priceAtClose, setPriceAtClose] = useState("");
  const [maxMcap, setMaxMcap] = useState("");
  const [minMcap, setMinMcap] = useState("");
  const [manual, setManual] = useState(false);
  const [invalidationTriggered, setInvalidationTriggered] = useState(false);
  const [lessons, setLessons] = useState("");
  const [mistakeType, setMistakeType] = useState("");
  const [busy, setBusy] = useState(false);
  const ca = record.call.contractAddress;

  const fetchClose = async () => {
    try {
      const res = await fetch(`/api/market?type=prices&cas=${encodeURIComponent(ca)}`);
      const j = await res.json();
      const p = j?.prices?.[ca];
      if (!p) return onError("抓不到现价，请手填");
      setPriceAtClose(String(p.priceUsd));
      setManual(false);
    } catch { onError("抓取失败"); }
  };

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
      const oRes = await fetch(`/api/market?type=ohlcv&chain=${best.chainId}&pair=${best.pairAddress}&range=ALL&withTs=1`);
      const oJson = await oRes.json();
      const series: [number, number][] = oJson?.series ?? [];
      if (series.length < 2) return onError("K 线数据不足");
      const from = Date.parse(record.call.calledAt) / 1000;
      const slice = series.filter(([t]) => t >= from).map(([, c]) => c);
      const all = slice.length >= 2 ? slice : series.map(([, c]) => c);
      const base = record.call.priceAtCall;
      setMaxMcap(String(Math.round(record.call.mcapAtCall * (Math.max(...all) / base))));
      setMinMcap(String(Math.round(record.call.mcapAtCall * (Math.min(...all) / base))));
    } catch { onError("计算失败，请手填"); }
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
            closedAt: `${closedAt}:00`,
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
    } catch (e2) { onError(e2 instanceof Error ? e2.message : "保存失败"); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border-[1.5px] border-dashed border-[#5c2a52] bg-white p-4">
      <div className="flex flex-wrap gap-2">
        <select value={verdict} onChange={(e) => setVerdict(e.target.value)} className={`${input} w-auto`}>
          <option value="correct">判断正确</option>
          <option value="partly">部分正确</option>
          <option value="wrong">判断错误</option>
          <option value="unresolved">未结论</option>
        </select>
        <input type="datetime-local" value={closedAt} onChange={(e) => setClosedAt(e.target.value)} className={`${input} w-auto`} required />
        <input value={priceAtClose} onChange={(e) => setPriceAtClose(e.target.value)} placeholder="结束价格 *" className={`${input} w-36 font-mono`} required />
        <button type="button" onClick={() => void fetchClose()} className="rounded-lg border border-line px-3 py-2 text-xs text-muted hover:border-accent hover:text-accent">⚡ 现价</button>
        <label className="flex items-center gap-1 text-xs text-muted">
          <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} /> 手填
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input value={maxMcap} onChange={(e) => setMaxMcap(e.target.value)} placeholder="判断后最高市值 *" className={`${input} w-44 font-mono`} required />
        <input value={minMcap} onChange={(e) => setMinMcap(e.target.value)} placeholder="判断后最低市值 *" className={`${input} w-44 font-mono`} required />
        <button type="button" onClick={() => void fetchMaxMin()} className="rounded-lg border border-line px-3 py-2 text-xs text-muted hover:border-accent hover:text-accent">⚡ 从 K 线计算</button>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={invalidationTriggered} onChange={(e) => setInvalidationTriggered(e.target.checked)} /> 证伪条件已触发
        </label>
        <select value={mistakeType} onChange={(e) => setMistakeType(e.target.value)} className={`${input} w-auto`}>
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

/* ==================== 小部件 ==================== */

function CoinLogo({ record, imageUrl, size }: { record: CallRecord; imageUrl?: string; size: number }) {
  const [broken, setBroken] = useState(false);
  const initial = (record.call.symbol || "?").slice(0, 1).toUpperCase();
  if (imageUrl && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" onError={() => setBroken(true)}
        className="rounded-full border-[1.5px] border-line object-cover"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <span className="flex items-center justify-center rounded-full border-[1.5px] border-line font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42, background: hueOf(record.call.contractAddress) }}>
      {initial}
    </span>
  );
}

function hueOf(ca: string) {
  let h = 0;
  for (let i = 0; i < ca.length; i++) h = (h * 31 + ca.charCodeAt(i)) % 360;
  return `hsl(${h} 45% 45%)`;
}

/* Call 类型局部再导出（表单用） */
export type { Call };
