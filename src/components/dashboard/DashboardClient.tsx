"use client";

/**
 * DashboardClient.tsx —— Meme 投研成绩单（客户端）
 *
 * 数据流：
 * - /api/market?type=watchlist → 关注列表 + 行情 + 7D 走势 + Why 标签（120s 轮询）
 * - /api/market?type=grade     → 叙事胜率 / 分链准确度 / 7D·30D 持有期表现（600s 缓存）
 * - 详情抽屉 K 线              → /api/market?type=ohlcv 按需
 * 页面静态壳，不占用 Vercel 函数额度；访客浏览器只连本站域名。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type {
  CoinMarketData,
  WatchCoin,
  WatchEvent,
  WhyTag,
} from "@/lib/watchlist";
import { avatarHue, formatMcap, formatPrice } from "@/lib/coin-format";
import CoinAvatar from "@/components/CoinAvatar";
import { marked } from "marked";

export interface RelatedPost {
  slug: string;
  title: string;
  date: string;
}

export interface RelatedJournal {
  id: string;
  date: string;
  title: string;
  body: string;
  tags: string[];
}

export interface DashboardCoin extends WatchCoin {
  data: CoinMarketData | null;
  spark: number[] | null;
  /** 关联研报（frontmatter tokens 匹配 symbol 或 CA） */
  posts?: RelatedPost[];
  /** 关联研究日志（journal tokens 匹配） */
  journal?: RelatedJournal[];
}

interface GradeData {
  total: number;
  winRate: number | null;
  avgSince: number | null;
  narratives: Array<{ id: string; count: number; avg: number; winRate: number }>;
  chains: Array<{ id: string; count: number; avg: number; winRate: number }>;
  d7: { avg: number; winRate: number; count: number } | null;
  d30: { avg: number; winRate: number; count: number } | null;
}

const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
const upCls = (v: number) =>
  v >= 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";

const EV_STYLE: Record<string, string> = {
  follow: "bg-accent",
  open_position: "bg-emerald-500",
  add: "bg-emerald-500",
  reduce: "bg-amber-500",
  close_position: "bg-amber-500",
  unfollow: "bg-muted",
};

function Sparkline({ pts, up }: { pts: number[] | null; up: boolean }) {
  if (!pts || pts.length < 2) return <span className="text-xs text-muted">—</span>;
  const w = 96, h = 30;
  const min = Math.min(...pts), max = Math.max(...pts);
  const span = max - min || 1;
  const d = pts
    .map(
      (p, i) =>
        `${((i / (pts.length - 1)) * w).toFixed(1)},${(h - 3 - ((p - min) / span) * (h - 6)).toFixed(1)}`
    )
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="inline-block align-middle" aria-hidden="true">
      <polyline points={d} stroke={up ? "#059669" : "#dc2626"} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardClient({ locale, t }: { locale: Locale; t: Dictionary }) {
  const d = t.dashboard;
  const [payload, setPayload] = useState<{ coins: DashboardCoin[]; tags: WhyTag[] } | null>(null);
  const [grade, setGrade] = useState<GradeData | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<"all" | "hold" | "watch" | "exited">("all");
  const [sortK, setSortK] = useState<"mcap" | "since" | "c24">("mcap");
  const [sortDir, setSortDir] = useState(-1);
  const [active, setActive] = useState<string | null>(null);
  const [copied, setCopied] = useState("");

  const tagName = useCallback(
    (id: string) => payload?.tags.find((x) => x.id === id)?.[locale] ?? id,
    [payload, locale]
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/market?type=watchlist&locale=${locale}`, { cache: "no-store" });
      const json = (await res.json()) as { coins?: DashboardCoin[]; tags?: WhyTag[] };
      if (Array.isArray(json.coins)) {
        setPayload({ coins: json.coins, tags: json.tags ?? [] });
        setFailed(false);
      }
    } catch {
      setFailed(true);
    }
  }, [locale]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 120_000);
    return () => clearInterval(timer);
  }, [load]);

  /* 深链：/dashboard?coin=<address> 直接打开对应代币的投研抽屉 */
  useEffect(() => {
    const coin = new URLSearchParams(window.location.search).get("coin");
    if (coin) setActive(coin);
  }, []);

  useEffect(() => {
    fetch("/api/market?type=grade")
      .then((r) => r.json())
      .then((j: GradeData) => setGrade(j))
      .catch(() => {});
  }, []);

  const sinceOf = useCallback(
    (c: DashboardCoin): number | null => {
      if (!c.followPrice) return null;
      let current = c.data?.priceUsd;
      /* 已收官：冻结在取消关注那一刻的价格，不再随行情变动 */
      if (c.status === "exited") {
        for (let i = c.events.length - 1; i >= 0; i--) {
          const ev = c.events[i];
          if (ev.type === "unfollow" && typeof ev.price === "number") {
            current = ev.price;
            break;
          }
        }
      }
      return current ? (current / c.followPrice - 1) * 100 : null;
    },
    []
  );

  const rows = useMemo(() => {
    if (!payload) return [];
    const list = payload.coins.filter((c) =>
      tab === "all" ? c.status !== "exited"
      : tab === "hold" ? c.status === "holding"
      : tab === "watch" ? c.status === "watching"
      : c.status === "exited"
    );
    const val = (c: DashboardCoin): number => {
      if (sortK === "since") return sinceOf(c) ?? -Infinity;
      if (sortK === "c24") return c.data?.change24h ?? -Infinity;
      return c.data?.marketCap ?? c.data?.fdv ?? -Infinity;
    };
    return [...list].sort((a, b) => (val(a) - val(b)) * sortDir);
  }, [payload, tab, sortK, sortDir, sinceOf]);

  const activeCoins = useMemo(
    () => (payload?.coins ?? []).filter((c) => c.status !== "exited"),
    [payload]
  );
  const holdCnt = activeCoins.filter((c) => c.status === "holding").length;
  const watchCnt = activeCoins.length - holdCnt;
  const exitedCnt = (payload?.coins ?? []).filter((c) => c.status === "exited").length;

  const withSince = useMemo(
    () =>
      activeCoins
        .map((c) => ({ c, s: sinceOf(c) }))
        .filter((x): x is { c: DashboardCoin; s: number } => x.s !== null),
    [activeCoins, sinceOf]
  );
  const perfAvg =
    withSince.length > 0 ? withSince.reduce((a, x) => a + x.s, 0) / withSince.length : null;

  const sortedBySince = useMemo(() => [...withSince].sort((a, b) => b.s - a.s), [withSince]);
  const best = sortedBySince[0];
  const worst = sortedBySince[sortedBySince.length - 1];

  const activeCoin = payload?.coins.find((c) => c.address === active) ?? null;

  const copyCa = async (ca: string) => {
    try {
      await navigator.clipboard.writeText(ca);
      (window as unknown as { umami?: { track: (e: string) => void } }).umami?.track("复制CA");
      setCopied(ca);
      setTimeout(() => setCopied(""), 1500);
    } catch { /* 静默 */ }
  };

  const evLabel = (type: string): string =>
    type === "follow" ? d.evFollow
    : type === "open_position" ? d.evOpen
    : type === "add" ? d.evAdd
    : type === "reduce" ? d.evReduce
    : type === "close_position" ? d.evClose
    : type === "unfollow" ? d.evUnfollow
    : type;

  if (payload === null) {
    return (
      <p className="py-24 text-center text-sm text-muted">{failed ? d.loadFail : d.loading}</p>
    );
  }

  const statusMeta = (c: DashboardCoin) =>
    c.status === "holding"
      ? { label: d.statusHold, cls: "bg-accent text-white" }
      : c.status === "exited"
        ? { label: d.statusExited, cls: "border border-line bg-codebg text-muted" }
        : { label: d.statusWatch, cls: "border border-line text-muted" };

  const perfCard = (tag: string, item: { c: DashboardCoin; s: number } | undefined, positive: boolean) => (
    <div className={`flex items-center gap-4 rounded-2xl border border-line bg-card px-5 py-4 ${positive ? "border-l-[3px] border-l-emerald-500" : "border-l-[3px] border-l-red-500"}`}>
      {item && (
        <>
          <CoinAvatar imageUrl={item.c.data?.imageUrl} symbol={item.c.data?.symbol ?? item.c.address.slice(0, 4)} hue={avatarHue(item.c.address)} size={40} />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold tracking-wider text-muted">{tag}</div>
            <div className="truncate font-bold text-heading">
              {item.c.data?.name ?? item.c.address.slice(0, 8)}
              <span className="ml-1.5 text-xs font-normal text-muted">${item.c.data?.symbol}</span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className={`text-2xl font-bold tabular-nums ${upCls(positive ? 1 : -1)}`}>{fmtPct(item.s)}</div>
            <div className="text-xs text-muted">{d.since} {item.c.addedAt}</div>
          </div>
        </>
      )}
    </div>
  );

  const thCls = "px-3 py-3 text-right text-xs font-medium text-muted whitespace-nowrap";
  const tdNum = "px-3 py-3.5 text-right tabular-nums whitespace-nowrap";

  const bestNarrative = grade?.narratives.length
    ? [...grade.narratives].sort((a, b) => b.avg - a.avg)[0]
    : null;

  return (
    <div>
      {/* 页头 */}
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent dark:text-accent-mint">{d.eyebrow}</div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-heading sm:text-4xl">{d.title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">{d.sub}</p>

      {/* ===== 成绩单（Grade） ===== */}
      {grade && grade.total > 0 && (
        <section className="mt-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-line bg-card px-5 py-4">
              <div className="text-xs text-muted">{d.gTotal}</div>
              <div className="mt-1 text-2xl font-bold text-heading">{grade.total}<small className="ml-1 text-sm font-medium text-muted">{d.gTotalSub}</small></div>
            </div>
            <div className="rounded-2xl border border-line bg-card px-5 py-4">
              <div className="text-xs text-muted">{d.gWinrate}</div>
              <div className={`mt-1 text-2xl font-bold tabular-nums ${grade.winRate === null ? "text-heading" : upCls(grade.winRate - 50)}`}>
                {grade.winRate === null ? "—" : `${grade.winRate.toFixed(1)}%`}
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-card px-5 py-4">
              <div className="text-xs text-muted">{d.gAvg}</div>
              <div className={`mt-1 text-2xl font-bold tabular-nums ${grade.avgSince === null ? "text-heading" : upCls(grade.avgSince)}`}>
                {grade.avgSince === null ? "—" : fmtPct(grade.avgSince)}
              </div>
            </div>
            <div className="col-span-2 rounded-2xl border border-line bg-card px-5 py-4 lg:col-span-1">
              <div className="text-xs text-muted">{d.gBest}</div>
              <div className="mt-1 text-lg font-bold text-heading">
                {bestNarrative ? tagName(bestNarrative.id) : d.gBestNone}
              </div>
              {bestNarrative && <div className={`text-xs tabular-nums ${upCls(bestNarrative.avg)}`}>{fmtPct(bestNarrative.avg)} · {d.gSample} {bestNarrative.count}</div>}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* 叙事胜率 */}
            <div className="rounded-2xl border border-line bg-card p-5">
              <h3 className="mb-4 text-sm font-bold text-heading">{d.gNarrative} <small className="font-normal text-muted">{d.gNarrativeSub}</small></h3>
              {grade.narratives.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted">{d.gNoWhy}</p>
              ) : (
                <div className="grid gap-3">
                  {[...grade.narratives].sort((a, b) => b.avg - a.avg).map((n) => (
                    <div key={n.id} className="grid grid-cols-[110px_1fr_76px] items-center gap-3 text-[13px]">
                      <span className="truncate">{tagName(n.id)}</span>
                      <div className="relative h-2.5 overflow-hidden rounded-full bg-codebg">
                        <div
                          className={`absolute top-0 h-full rounded-full ${n.avg >= 0 ? "left-0 bg-emerald-500" : "right-0 bg-red-500"}`}
                          style={{ width: `${Math.min(100, Math.abs(n.avg) / (Math.max(...grade.narratives.map((x) => Math.abs(x.avg))) || 1) * 100)}%` }}
                        />
                      </div>
                      <span className={`text-right font-semibold tabular-nums ${upCls(n.avg)}`}>{fmtPct(n.avg)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* 分链准确度 */}
            <div className="rounded-2xl border border-line bg-card p-5">
              <h3 className="mb-3 text-sm font-bold text-heading">{d.gChain} <small className="font-normal text-muted">{d.gChainSub}</small></h3>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11.5px] text-muted">
                    <th className="py-1.5 font-medium">Chain</th>
                    <th className="py-1.5 text-right font-medium">{d.gCount}</th>
                    <th className="py-1.5 text-right font-medium">{d.gWinrate}</th>
                    <th className="py-1.5 text-right font-medium">{d.gAvgCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...grade.chains].sort((a, b) => b.avg - a.avg).map((ch) => (
                    <tr key={ch.id} className="border-t border-line">
                      <td className="py-2 font-medium capitalize text-heading">{ch.id}</td>
                      <td className="py-2 text-right tabular-nums">{ch.count}</td>
                      <td className="py-2 text-right tabular-nums">{ch.winRate.toFixed(0)}%</td>
                      <td className={`py-2 text-right font-semibold tabular-nums ${upCls(ch.avg)}`}>{fmtPct(ch.avg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* 持有期表现 */}
              <h3 className="mb-3 mt-5 text-sm font-bold text-heading">{d.gHolding} <small className="font-normal text-muted">{d.gHoldingSub}</small></h3>
              <table className="w-full text-[13px]">
                <tbody>
                  {([["d7", d.gDays7], ["d30", d.gDays30]] as const).map(([k, label]) => {
                    const w = grade[k];
                    return (
                      <tr key={k} className="border-t border-line">
                        <td className="py-2 font-medium text-heading">{label}</td>
                        <td className={`py-2 text-right font-semibold tabular-nums ${w ? upCls(w.avg) : "text-muted"}`}>{w ? fmtPct(w.avg) : "—"}</td>
                        <td className="py-2 text-right tabular-nums text-muted">{w ? `${w.winRate.toFixed(0)}% · n=${w.count}` : ""}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t border-line">
                    <td className="py-2 font-medium text-heading">{d.gSince}</td>
                    <td className={`py-2 text-right font-semibold tabular-nums ${grade.avgSince === null ? "text-muted" : upCls(grade.avgSince)}`}>
                      {grade.avgSince === null ? "—" : fmtPct(grade.avgSince)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted">{grade.winRate !== null ? `${grade.winRate.toFixed(0)}%` : ""}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 总览三指标 + Best/Worst */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-card px-5 py-4">
          <div className="text-xs text-muted">{d.statHold}</div>
          <div className="mt-1 text-2xl font-bold text-heading">{holdCnt}<small className="ml-1 text-sm font-medium text-muted">个</small></div>
          <div className="text-xs text-muted">{d.statHoldSub}</div>
        </div>
        <div className="rounded-2xl border border-line bg-card px-5 py-4">
          <div className="text-xs text-muted">{d.statWatch}</div>
          <div className="mt-1 text-2xl font-bold text-heading">{watchCnt}<small className="ml-1 text-sm font-medium text-muted">个</small></div>
          <div className="text-xs text-muted">{d.statWatchSub}</div>
        </div>
        <div className="col-span-2 rounded-2xl border border-line bg-card px-5 py-4 lg:col-span-1">
          <div className="text-xs text-muted">{d.statPerf}</div>
          <div className={`mt-1 text-2xl font-bold tabular-nums ${perfAvg === null ? "text-heading" : upCls(perfAvg)}`}>
            {perfAvg === null ? "—" : fmtPct(perfAvg)}
          </div>
          <div className="text-xs text-muted">{d.statPerfSub}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {perfCard(d.bestTag, best, true)}
        {perfCard(d.worstTag, worst, false)}
      </div>

      {/* ===== 代币表格 ===== */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex flex-wrap items-center gap-1 border-b border-line px-4 pt-3">
          {(
            [
              ["all", d.tabAll, activeCoins.length],
              ["hold", d.tabHold, holdCnt],
              ["watch", d.tabWatch, watchCnt],
              ["exited", d.tabExited, exitedCnt],
            ] as const
          ).map(([k, label, cnt]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`-mb-px border-b-2 px-3.5 py-2.5 text-sm transition-colors ${
                tab === k ? "border-accent font-semibold text-accent dark:border-accent-mint dark:text-accent-mint" : "border-transparent text-muted hover:text-heading"
              }`}
            >
              {label}
              <span className="ml-1.5 rounded-full bg-codebg px-1.5 py-0.5 text-[11px] text-muted">{cnt}</span>
            </button>
          ))}
          <span className="ml-auto hidden pb-2 text-xs text-muted sm:block">{d.hint}</span>
        </div>

        {rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">{d.noData}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={`${thCls} text-left`}>{d.colToken}</th>
                  <th className={`${thCls} text-left`}>{d.colStatus}</th>
                  <th className={thCls}>
                    <button type="button" onClick={() => { if (sortK === "mcap") setSortDir((v) => -v); else { setSortK("mcap"); setSortDir(-1); } }} className="inline-flex items-center gap-0.5 hover:text-heading">
                      {d.colMcap}<span className="text-[9px]">{sortK === "mcap" ? (sortDir < 0 ? "▼" : "▲") : ""}</span>
                    </button>
                  </th>
                  <th className={`${thCls} hidden lg:table-cell`}>{d.colFollowP}</th>
                  <th className={thCls}>{d.colPrice}</th>
                  <th className={thCls}>
                    <button type="button" onClick={() => { if (sortK === "since") setSortDir((v) => -v); else { setSortK("since"); setSortDir(-1); } }} className="inline-flex items-center gap-0.5 hover:text-heading">
                      {d.colSince}<span className="text-[9px]">{sortK === "since" ? (sortDir < 0 ? "▼" : "▲") : ""}</span>
                    </button>
                  </th>
                  <th className={thCls}>
                    <button type="button" onClick={() => { if (sortK === "c24") setSortDir((v) => -v); else { setSortK("c24"); setSortDir(-1); } }} className="inline-flex items-center gap-0.5 hover:text-heading">
                      {d.col24}<span className="text-[9px]">{sortK === "c24" ? (sortDir < 0 ? "▼" : "▲") : ""}</span>
                    </button>
                  </th>
                  <th className={`${thCls} hidden text-left lg:table-cell`}>{d.col7d}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const since = sinceOf(c);
                  const up24 = (c.data?.change24h ?? 0) >= 0;
                  const st = statusMeta(c);
                  return (
                    <tr key={c.address} onClick={() => { setActive(c.address); (window as unknown as { umami?: { track: (e: string) => void } }).umami?.track("查看代币"); }} className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-accent/5">
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <CoinAvatar imageUrl={c.data?.imageUrl} symbol={c.data?.symbol ?? c.address.slice(0, 4)} hue={avatarHue(c.address)} size={36} />
                          <span>
                            <span className="block font-semibold text-heading">{c.data?.name ?? "…"}</span>
                            <span className="block text-xs text-muted">
                              {c.data?.symbol ?? c.address.slice(0, 6)} · {c.data?.chainId ?? c.chain ?? "—"}
                            </span>
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); void copyCa(c.address); }}
                        className="ml-1 rounded border border-line px-1.5 py-px text-[10px] text-muted transition-colors hover:border-accent hover:text-accent">
                        {copied === c.address ? "✓" : "CA"}
                      </button>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-left">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className={tdNum}>{formatMcap(c.data?.marketCap ?? c.data?.fdv)}</td>
                      <td className={`${tdNum} hidden lg:table-cell`}>{c.followPrice ? formatPrice(c.followPrice) : "—"}</td>
                      <td className={`${tdNum} font-medium text-heading`}>{c.data ? formatPrice(c.data.priceUsd) : "—"}</td>
                      <td className={tdNum}>
                        {since === null ? "—" : (
                          <span className={`font-bold ${upCls(since)}`}>
                            {fmtPct(since)}
                            <span className="block text-[10px] font-normal text-muted">{d.colSince}</span>
                          </span>
                        )}
                      </td>
                      <td className={tdNum}>
                        <span className={`inline-block rounded-lg px-2 py-0.5 text-xs font-semibold ${up24 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                          {c.data ? fmtPct(c.data.change24h) : "—"}
                        </span>
                      </td>
                      <td className="hidden px-3 py-3.5 lg:table-cell">
                        <Sparkline pts={c.spark} up={(c.spark?.[c.spark.length - 1] ?? 0) >= (c.spark?.[0] ?? 0)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-muted">行情来自 DexScreener · K 线来自 GeckTerminal · 非投资建议</p>

      {activeCoin && payload && (
        <ResearchDrawer coin={activeCoin} locale={locale} d={d} tags={payload.tags} onClose={() => setActive(null)} />
      )}
    </div>
  );
}

function DrawerHolding({ coin, t }: { coin: DashboardCoin; t: Dictionary["dashboard"] }) {
  const amount = coin.holdAmount ?? 0;
  const avgCost = coin.avgCost ?? 0;
  const cost = amount * avgCost;
  const value = amount * (coin.data?.priceUsd ?? 0);
  const pnl = cost > 0 ? (value / cost - 1) * 100 : 0;
  const kv = (k: string, v: React.ReactNode) => (
    <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-sm last:border-0">
      <span className="text-muted">{k}</span>
      <span className="font-medium tabular-nums text-heading">{v}</span>
    </div>
  );
  return (
    <section className="mt-6">
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">{t.holding}</h3>
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {kv(t.amount, amount.toExponential(2))}
        {kv(t.avgCost, formatPrice(avgCost))}
        {kv(t.cost, formatMcap(cost))}
        {kv(t.value, formatMcap(value))}
        {kv(t.unrealized, <span className={upCls(pnl)}>{fmtPct(pnl)}（{formatMcap(Math.abs(value - cost))}）</span>)}
        <div className="px-4 pb-3">
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-codebg">
            <div className={`h-full rounded-full ${pnl >= 0 ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${Math.min(100, Math.abs(pnl))}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Chart({ closes }: { closes: number[] | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv || !closes || closes.length < 2) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = cv.clientWidth, H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const min = Math.min(...closes), max = Math.max(...closes);
    const span = max - min || 1;
    const px = (i: number) => 6 + (i / (closes.length - 1)) * (W - 12);
    const py = (v: number) => H - 12 - ((v - min) / span) * (H - 24);
    const up = closes[closes.length - 1] >= closes[0];
    const col = up ? "#059669" : "#dc2626";
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, up ? "rgba(5,150,105,.22)" : "rgba(220,38,38,.22)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    const paint = (hover: number | null) => {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(128,128,128,.15)";
      for (let g = 0; g < 4; g++) {
        const y = 8 + (g * (H - 20)) / 3;
        ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(W - 6, y); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(px(0), py(closes[0]));
      closes.forEach((p, i) => ctx.lineTo(px(i), py(p)));
      ctx.lineTo(px(closes.length - 1), H - 2); ctx.lineTo(px(0), H - 2); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); ctx.moveTo(px(0), py(closes[0]));
      closes.forEach((p, i) => ctx.lineTo(px(i), py(p)));
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
      const li = hover ?? closes.length - 1;
      ctx.beginPath(); ctx.arc(px(li), py(closes[li]), 3.2, 0, 7); ctx.fillStyle = col; ctx.fill();
      if (hover !== null) {
        ctx.strokeStyle = "rgba(128,128,128,.5)"; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(px(hover), 6); ctx.lineTo(px(hover), H - 6); ctx.stroke();
        ctx.setLineDash([]);
      }
    };
    paint(null);
    const onMove = (e: MouseEvent) => {
      const r = cv.getBoundingClientRect();
      const i = Math.round(((e.clientX - r.left - 6) / (W - 12)) * (closes.length - 1));
      paint(Math.max(0, Math.min(closes.length - 1, i)));
    };
    const onLeave = () => paint(null);
    cv.addEventListener("mousemove", onMove);
    cv.addEventListener("mouseleave", onLeave);
    return () => { cv.removeEventListener("mousemove", onMove); cv.removeEventListener("mouseleave", onLeave); };
  }, [closes]);
  if (closes === null) return <div className="h-[190px] animate-pulse rounded-xl bg-codebg/60" />;
  if (closes.length < 2) return <div className="h-[190px]" />;
  return <canvas ref={ref} className="mt-2 block h-[190px] w-full" />;
}


/* 日志正文：Markdown 渲染 + 超长折叠 */
function MdFold({ body, locale }: { body: string; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const html = marked.parse(body) as string;
  const long = body.length > 320;
  return (
    <div>
      <div
        className={`prose-journal text-[13px] leading-relaxed text-muted ${!open && long ? "max-h-24 overflow-hidden" : ""} [&_h2]:mt-2 [&_h2]:text-[13px] [&_h2]:font-bold [&_h2]:text-heading [&_h3]:mt-1.5 [&_h3]:font-semibold [&_h3]:text-heading [&_blockquote]:border-l-2 [&_blockquote]:border-accent/40 [&_blockquote]:pl-2.5 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mt-0.5 [&_strong]:text-heading`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {long && (
        <button type="button" onClick={() => setOpen(!open)} className="mt-1 text-xs font-medium text-accent hover:underline dark:text-accent-mint">
          {open ? (locale === "zh" ? "收起 ↑" : "Collapse") : (locale === "zh" ? "展开全文 ↓" : "Read more")}
        </button>
      )}
    </div>
  );
}

/* ================= 共享研究抽屉（看板与首页复用） ================= */

export function ResearchDrawer({
  coin,
  locale,
  d,
  tags,
  onClose,
}: {
  coin: DashboardCoin;
  locale: Locale;
  d: Dictionary["dashboard"];
  tags: WhyTag[];
  onClose: () => void;
}) {
  const [range, setRange] = useState<"24H" | "7D" | "30D" | "ALL">("7D");
  const [closes, setCloses] = useState<number[] | null>(null);
  const [copied, setCopied] = useState(false);
  const tagName = (id: string) => tags.find((x) => x.id === id)?.[locale] ?? id;
  const evLabel = (type: string): string =>
    type === "follow" ? d.evFollow
    : type === "open_position" ? d.evOpen
    : type === "add" ? d.evAdd
    : type === "reduce" ? d.evReduce
    : type === "close_position" ? d.evClose
    : type === "unfollow" ? d.evUnfollow
    : type;

  useEffect(() => {
    if (!coin.data?.pairAddress) return;
    let cancelled = false;
    setCloses(null);
    fetch(`/api/market?type=ohlcv&chain=${coin.data.chainId}&pair=${coin.data.pairAddress}&range=${range}`)
      .then((r) => r.json())
      .then((j: { closes?: number[] }) => !cancelled && setCloses(j.closes?.length ? j.closes : []))
      .catch(() => !cancelled && setCloses([]));
    return () => {
      cancelled = true;
    };
  }, [coin, range]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const copyCa = async () => {
    try {
      await navigator.clipboard.writeText(coin.address);
      (window as unknown as { umami?: { track: (e: string) => void } }).umami?.track("复制CA");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 静默 */
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <aside className="fixed right-0 top-0 bottom-0 z-[90] flex w-full max-w-[460px] transform flex-col border-l border-line bg-paper shadow-2xl" role="dialog" aria-modal="true">
        <div className="flex items-center gap-3.5 border-b border-line px-5 py-4">
          <CoinAvatar imageUrl={coin.data?.imageUrl} symbol={coin.data?.symbol ?? coin.address.slice(0, 4)} hue={avatarHue(coin.address)} size={48} />
          <div className="min-w-0">
            <div className="truncate text-lg font-bold text-heading">{coin.data?.name ?? "…"}</div>
            <div className="text-xs text-muted">
              {coin.data?.symbol ? `$${coin.data.symbol} · ` : ""}
              {coin.data?.chainId ?? coin.chain ?? ""}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-lg font-bold tabular-nums text-heading">{coin.data ? formatPrice(coin.data.priceUsd) : "—"}</div>
            <div className={`text-xs tabular-nums ${upCls(coin.data?.change24h ?? 0)}`}>
              {coin.data ? fmtPct(coin.data.change24h) : ""} 24H
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-muted transition-colors hover:bg-line hover:text-heading">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4">
          <div className="rounded-2xl border border-line bg-card p-4">
            <div className="mx-auto flex w-max gap-1 rounded-xl bg-codebg p-1">
              {(["24H", "7D", "30D", "ALL"] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRange(r)} className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${range === r ? "bg-card text-heading shadow-sm" : "text-muted hover:text-heading"}`}>
                  {r === "24H" ? d.range24 : r === "7D" ? d.range7 : r === "30D" ? d.range30 : d.rangeAll}
                </button>
              ))}
            </div>
            <Chart closes={closes} />
            {closes !== null && closes.length === 0 && (
              <p className="py-6 text-center text-xs text-muted">{d.chartEmpty}</p>
            )}
          </div>

          <section className="mt-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{d.timeline}</h3>
            <div className="relative space-y-3 pl-5">
              <span className="absolute bottom-2 left-[5px] top-2 w-0.5 bg-line" aria-hidden="true" />
              {[
                ...coin.events.map((ev) => ({ kind: "ev" as const, date: ev.date, ev })),
                ...(coin.posts ?? []).map((p) => ({ kind: "post" as const, date: p.date, post: p })),
                ...(coin.journal ?? []).map((j) => ({ kind: "journal" as const, date: j.date, journal: j })),
              ]
                .sort((a, b) => a.date.localeCompare(b.date))
                .reverse()
                .map((item, i) =>
                  item.kind === "journal" ? (
                    <div key={`j-${item.journal.id}`} className="relative">
                      <span className="absolute -left-5 top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-violet-500 text-[7px] font-bold text-white" aria-hidden="true">志</span>
                      <div className="rounded-xl border border-dashed border-violet-400/40 bg-violet-500/5 px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[13px]">
                          <span className="font-semibold text-violet-600 dark:text-violet-400">{d.evJournal}</span>
                          {item.journal.tags.includes("AI") && <span className="rounded bg-accent px-1.5 py-px text-[9px] font-bold text-white">AI</span>}
                          <span className="text-[11.5px] tabular-nums text-muted">{item.journal.date}</span>
                          {item.journal.tags.map((tg) => (
                            <span key={tg} className="rounded-full bg-codebg px-1.5 py-px text-[10px] text-muted">{tg}</span>
                          ))}
                        </div>
                        {item.journal.title && <p className="mt-1 text-[13px] font-medium text-heading">{item.journal.title}</p>}
                        <MdFold body={item.journal.body} locale={locale} />
                      </div>
                    </div>
                  ) : item.kind === "post" ? (
                    <div key={`p-${item.post.slug}`} className="relative">
                      <span className="absolute -left-5 top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-accent-mint text-[8px] font-bold text-white" aria-hidden="true">文</span>
                      <a
                        href={`/${locale}/writing/${item.post.slug}`}
                        onClick={() => (window as unknown as { umami?: { track: (e: string) => void } }).umami?.track("打开研报")}
                        className="block rounded-xl border border-accent/30 bg-accent/5 px-3.5 py-2.5 transition-colors hover:border-accent/60"
                      >
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[13px]">
                          <span className="font-semibold text-accent dark:text-accent-mint">{d.evPost}</span>
                          <span className="text-[11.5px] tabular-nums text-muted">{item.post.date}</span>
                          <span aria-hidden="true" className="ml-auto text-xs text-muted">→</span>
                        </div>
                        <p className="mt-1 text-[13px] font-medium leading-relaxed text-heading">{item.post.title}</p>
                      </a>
                    </div>
                  ) : (
                    <div key={`e-${i}`} className="relative">
                      <span className={`absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full ${EV_STYLE[item.ev.type] ?? "bg-muted"}`} aria-hidden="true" />
                      <div className="rounded-xl border border-line bg-card px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[13px]">
                          <span className="font-semibold text-heading">{evLabel(item.ev.type)}</span>
                          <span className="text-[11.5px] tabular-nums text-muted">{item.ev.date}</span>
                          {typeof item.ev.price === "number" && (
                            <span className="ml-auto font-mono text-xs font-medium text-heading">@{formatPrice(item.ev.price)}</span>
                          )}
                        </div>
                        {item.ev.note && <p className="mt-1 text-[13px] leading-relaxed text-muted">{item.ev.note}</p>}
                        {(item.ev.why ?? []).length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {item.ev.why!.map((w) => (
                              <span key={w} className="rounded-full border border-line px-2 py-px text-[10.5px] text-muted">{tagName(w)}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
            </div>
          </section>

          {coin.profile && (coin.profile.narrative || coin.profile.risks || coin.profile.catalysts || coin.profile.invalidate) && (
            <section className="mt-6">
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">{d.profileTitle}</h3>
              <div className="grid gap-2.5">
                {([
                  ["📖", d.profileNarrative, coin.profile.narrative],
                  ["⚠️", d.profileRisks, coin.profile.risks],
                  ["🧨", d.profileCatalysts, coin.profile.catalysts],
                  ["🧭", d.profileInvalidate, coin.profile.invalidate],
                ] as const)
                  .filter(([, , v]) => v)
                  .map(([icon, label, value]) => (
                    <div key={label} className="rounded-xl border border-line bg-card px-3.5 py-2.5">
                      <div className="text-[11px] font-semibold tracking-wide text-muted">{icon} {label}</div>
                      <p className="mt-1 text-[13px] leading-relaxed text-heading">{value}</p>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {coin.holdAmount && coin.avgCost && <DrawerHolding coin={coin} t={d} />}

          {(() => {
            const latest = coin.events[coin.events.length - 1];
            const text = latest?.note || coin.comment;
            if (!text) return null;
            const isInitial = !latest || latest.type === "follow";
            return (
              <section className="mt-6">
                <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">{isInitial ? d.myComment : d.latestThesis}</h3>
                {coin.image && <img src={coin.image} alt="" className="mb-2.5 w-full rounded-xl border border-line object-cover" />}
                <p className="rounded-2xl border border-line bg-card px-4 py-3.5 text-sm leading-relaxed text-heading">{text}</p>
              </section>
            );
          })()}

          <section className="mt-6">
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">{d.onchain}</h3>
            <div className="overflow-hidden rounded-2xl border border-line bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                <span className="shrink-0 text-sm text-muted">{d.ca}</span>
                <span className="truncate font-mono text-xs text-muted">{coin.address}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-3">
                <button type="button" onClick={() => void copyCa()} className="rounded-lg bg-accent px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-deep">
                  {copied ? d.copy + " ✓" : d.copy}
                </button>
                {coin.data?.url && (
                  <a href={coin.data.url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-line px-3.5 py-1.5 text-xs font-medium text-heading transition-colors hover:border-accent hover:text-accent">
                    {d.kline} ↗
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
