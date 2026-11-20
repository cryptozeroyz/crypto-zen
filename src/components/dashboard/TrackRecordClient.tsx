"use client";

/**
 * TrackRecordClient.tsx —— Track Record 列表页（客户端）
 * 统计面板 + 筛选（状态/结论/叙事/链）+ 记录行 + 分页。
 * 进行中的 Call 通过 /api/market?type=prices 批量拉现价（120s 轮询）。
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CoinAvatar from "@/components/CoinAvatar";
import { avatarHue, formatMcap } from "@/lib/coin-format";
import { statusOf, type CallStatus } from "@/lib/calls-stats";
import {
  getTr,
  stanceLabel,
  verdictLabel,
  disclosureLabelsOf,
  STANCE_BADGE,
  VERDICT_BADGE,
  type DisclosureLabels,
  type Tr,
} from "@/components/dashboard/tr";
import type { CallRecord } from "@/lib/calls";
import type { Locale } from "@/lib/i18n";

const PAGE_SIZE = 10;

type Prices = Record<string, { priceUsd: number; mcap: number; change24h: number }>;

export default function TrackRecordClient({
  records,
  locale,
}: {
  records: CallRecord[];
  locale: Locale;
}) {
  const tr = getTr(locale);
  const [prices, setPrices] = useState<Prices>({});
  const [status, setStatus] = useState<CallStatus | "all">("all");
  const [verdict, setVerdict] = useState<string>("all");
  const [narrative, setNarrative] = useState<string>("all");
  const [chain, setChain] = useState<string>("all");
  const [page, setPage] = useState(1);

  /* 进行中 call 的 CA 列表 */
  const openCas = useMemo(
    () =>
      records
        .filter((r) => !r.outcome)
        .map((r) => r.call.contractAddress),
    [records]
  );

  useEffect(() => {
    if (openCas.length === 0) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/market?type=prices&cas=${encodeURIComponent(openCas.join(","))}`
        );
        const json = await res.json();
        if (!cancelled && json?.prices) setPrices(json.prices);
      } catch {
        /* 现价拉不到就只显示判断时快照 */
      }
    };
    void load();
    const timer = setInterval(() => void load(), 120_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [openCas]);

  /* 筛选 */
  const chains = useMemo(
    () => [...new Set(records.map((r) => r.call.chain))].sort(),
    [records]
  );
  const filtered = useMemo(
    () =>
      records.filter((r) => {
        if (status !== "all" && statusOf(r) !== status) return false;
        if (verdict !== "all" && (r.outcome?.verdict ?? "none") !== verdict)
          return false;
        if (narrative !== "all" && r.call.narrativeType !== narrative) return false;
        if (chain !== "all" && r.call.chain !== chain) return false;
        return true;
      }),
    [records, status, verdict, narrative, chain]
  );

  useEffect(() => setPage(1), [status, verdict, narrative, chain]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const sel =
    "rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs text-heading outline-none transition-colors focus:border-accent";
  const labels = disclosureLabelsOf(tr);

  return (
    <div>
      {/* 筛选行 */}
      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        <Filter label={tr.filterStatus} value={status} onChange={(v) => setStatus(v as never)} options={[
          ["all", tr.all],
          ["open", tr["status.open"]],
          ["closed", tr["status.closed"]],
          ["expired", tr["status.expired"]],
        ]} sel={sel} />
        <Filter label={tr.filterVerdict} value={verdict} onChange={setVerdict} options={[
          ["all", tr.all],
          ["correct", tr["verdict.correct"]],
          ["partly", tr["verdict.partly"]],
          ["wrong", tr["verdict.wrong"]],
          ["unresolved", tr["verdict.unresolved"]],
        ]} sel={sel} />
        <Filter label={tr.filterNarrative} value={narrative} onChange={setNarrative} options={[
          ["all", tr.all],
          ["meme-culture", tr["nt.meme-culture"]],
          ["event-driven", tr["nt.event-driven"]],
          ["ip", tr["nt.ip"]],
          ["celebrity", tr["nt.celebrity"]],
          ["ai", tr["nt.ai"]],
          ["other", tr["nt.other"]],
        ]} sel={sel} />
        <Filter label={tr.filterChain} value={chain} onChange={setChain} options={[
          ["all", tr.all],
          ...chains.map((c) => [c, c] as [string, string]),
        ]} sel={sel} />
        {(status !== "all" || verdict !== "all" || narrative !== "all" || chain !== "all") && (
          <button
            type="button"
            onClick={() => { setStatus("all"); setVerdict("all"); setNarrative("all"); setChain("all"); }}
            className="text-accent underline-offset-2 hover:underline dark:text-accent-mint"
          >
            {tr.clear}
          </button>
        )}
      </div>

      {/* 记录列表 */}
      {pageItems.length === 0 ? (
        <p className="mt-10 py-12 text-center text-sm text-muted">{tr.empty}</p>
      ) : (
        <div className="mt-5 space-y-3">
          {pageItems.map((r) => (
            <CallRow key={r.call.id} record={r} locale={locale} tr={tr} labels={labels} price={prices[r.call.contractAddress]} />
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border border-line bg-card px-4 py-1.5 text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-40 dark:hover:text-accent-mint"
          >
            {tr.prev}
          </button>
          <span className="text-xs tabular-nums text-muted">{tr.page.replace("{n}", String(page)).replace("{t}", String(totalPages))}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-line bg-card px-4 py-1.5 text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-40 dark:hover:text-accent-mint"
          >
            {tr.next}
          </button>
        </div>
      )}
    </div>
  );
}

function Filter({
  label, value, onChange, options, sel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  sel: string;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={sel}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

function fmtPct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

/* ---------- 单行 ---------- */

function CallRow({
  record, locale, tr, labels, price,
}: {
  record: CallRecord;
  locale: Locale;
  tr: Tr;
  labels: DisclosureLabels;
  price?: { priceUsd: number; mcap: number; change24h: number };
}) {
  const { call, outcome } = record;
  const st = statusOf(record);
  const curMcap = outcome ? outcome.mcapAtClose : (price?.mcap ?? null);
  const perf = outcome
    ? outcome.returnAtClose
    : price?.priceUsd
      ? (price.priceUsd / call.priceAtCall - 1) * 100
      : null;

  return (
    <Link
      href={`/${locale}/dashboard/${call.id}`}
      className="group block rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#2a2230] bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-solid hover:border-[#ff5b3a] hover:shadow-[5px_7px_0_rgba(92,42,82,.12)]"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        {/* 币种 */}
        <div className="flex min-w-[180px] flex-1 items-center gap-2.5">
          <CoinAvatar
            imageUrl={undefined}
            symbol={call.symbol}
            hue={avatarHue(call.contractAddress)}
            size={36}
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-heading">{call.tokenName}</div>
            <div className="truncate text-xs text-muted">
              <span className="font-mono uppercase">{call.symbol}</span>
              <span aria-hidden="true"> · </span>
              <span className="rounded-full border border-line px-1.5 py-px font-mono text-[10px]">{call.chain}</span>
            </div>
          </div>
        </div>

        {/* 判断时间 + stance */}
        <div className="w-[130px]">
          <div className="text-[10px] tracking-wide text-muted">{tr.calledAt}</div>
          <div className="mt-0.5 text-xs tabular-nums text-heading">{call.calledAt.slice(0, 16)}</div>
          <span className={`mt-1 inline-block rounded-full border px-2 py-px text-[10.5px] font-semibold ${STANCE_BADGE[call.stance]}`}>
            {stanceLabel(call.stance, tr)}
          </span>
        </div>

        {/* 市值变化 + 表现 */}
        <div className="w-[170px]">
          <div className="text-[10px] tracking-wide text-muted">{tr.mcapJourney}</div>
          <div className="mt-0.5 text-xs tabular-nums text-heading">
            {formatMcap(call.mcapAtCall)}<span aria-hidden="true"> → </span>
            {curMcap ? formatMcap(curMcap) : "—"}
          </div>
          {perf !== null && (
            <div className={`mt-0.5 text-xs font-semibold tabular-nums ${perf >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {tr.performance} {fmtPct(perf)}
            </div>
          )}
        </div>

        {/* verdict / status */}
        <div className="w-[110px]">
          {outcome ? (
            <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold ${VERDICT_BADGE[outcome.verdict]}`}>
              {verdictLabel(outcome.verdict, tr)}
            </span>
          ) : (
            <span className={`inline-block rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-muted ${st === "expired" ? "border-amber-500/40 text-amber-600 dark:text-amber-400" : ""}`}>
              {st === "expired" ? tr["status.expired"] : tr["status.open"]}
            </span>
          )}
          {record.call.isHistorical && (
            <span className="mt-1 block text-[10px] text-muted">⚑ {tr.historical}</span>
          )}
        </div>

        {/* 披露标签（始终可见） */}
        <div className="flex w-[150px] flex-wrap gap-1">
          <DisclosureBadges record={record} labels={labels} />
        </div>
      </div>
    </Link>
  );
}

export function DisclosureBadges({ record, labels }: { record: CallRecord; labels: DisclosureLabels }) {
  const d = record.call.disclosure;
  const base = "rounded-full border px-2 py-px text-[10px] font-medium ";
  const posText =
    d.position === "holding"
      ? labels.holding
      : d.position === "sold"
        ? labels.sold
        : d.position === "none"
          ? labels.none
          : labels.unknown;
  return (
    <>
      <span className={base + (d.position === "holding"
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        : "border-line text-muted")}>
        {posText}
      </span>
      {d.sponsored && (
        <span className={base + "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"}>
          {labels.sponsored}
        </span>
      )}
      {d.referral && (
        <span className={base + "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"}>
          {labels.referral}
        </span>
      )}
    </>
  );
}
