"use client";

/**
 * DashboardClient.tsx —— 我的代币看板（客户端）
 *
 * 数据流：挂载后从 /api/market?type=watchlist 拉聚合数据（服务端代理
 * DexScreener 行情 + GeckTerminal 7D 走势，缓存 120s），之后每 120s 轮询。
 * 详情抽屉的 K 线按需拉 /api/market?type=ohlcv。
 * 页面本身是静态壳，不占用 Vercel 函数额度（Hobby 12 上限已满）。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { CoinMarketData, WatchCoin } from "@/lib/watchlist";
import { avatarHue, formatMcap, formatPrice } from "@/lib/coin-format";
import CoinAvatar from "@/components/CoinAvatar";

export interface DashboardCoin extends WatchCoin {
  data: CoinMarketData | null;
  spark: number[] | null;
}

const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
const upCls = (v: number) =>
  v >= 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";

/* ---------------- 迷你走势图 ---------------- */
function Sparkline({ pts, up }: { pts: number[] | null; up: boolean }) {
  if (!pts || pts.length < 2)
    return <span className="text-xs text-muted">—</span>;
  const w = 96;
  const h = 30;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const d = pts
    .map(
      (p, i) =>
        `${((i / (pts.length - 1)) * w).toFixed(1)},${(
          h -
          3 -
          ((p - min) / span) * (h - 6)
        ).toFixed(1)}`
    )
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      className="inline-block align-middle"
      aria-hidden="true"
    >
      <polyline
        points={d}
        stroke={up ? "#059669" : "#dc2626"}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------------- 主组件 ---------------- */
export default function DashboardClient({
  locale,
  t,
}: {
  locale: Locale;
  t: Dictionary;
}) {
  const d = t.dashboard;
  const [coins, setCoins] = useState<DashboardCoin[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<"all" | "hold" | "watch">("all");
  const [sortK, setSortK] = useState<"mcap" | "since" | "c24">("mcap");
  const [sortDir, setSortDir] = useState(-1);
  const [active, setActive] = useState<string | null>(null);
  const [range, setRange] = useState<"24H" | "7D" | "30D" | "ALL">("7D");
  const [closes, setCloses] = useState<number[] | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/market?type=watchlist", {
        cache: "no-store",
      });
      const json = (await res.json()) as { coins?: DashboardCoin[] };
      if (Array.isArray(json.coins)) {
        setCoins(json.coins);
        setFailed(false);
      }
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 120_000);
    return () => clearInterval(timer);
  }, [load]);

  /* 关注以来涨跌幅（有现价 + 关注价才算） */
  const sinceOf = useCallback(
    (c: DashboardCoin): number | null =>
      c.data?.priceUsd && c.followPrice
        ? (c.data.priceUsd / c.followPrice - 1) * 100
        : null,
    []
  );

  const rows = useMemo(() => {
    if (!coins) return [];
    let list = coins.filter((c) =>
      tab === "all" ? true : tab === "hold" ? c.holding : !c.holding
    );
    const val = (c: DashboardCoin): number => {
      if (sortK === "since") return sinceOf(c) ?? -Infinity;
      if (sortK === "c24") return c.data?.change24h ?? -Infinity;
      return c.data?.marketCap ?? c.data?.fdv ?? -Infinity;
    };
    list = [...list].sort((a, b) => (val(a) - val(b)) * sortDir);
    return list;
  }, [coins, tab, sortK, sortDir, sinceOf]);

  const withSince = useMemo(
    () =>
      (coins ?? [])
        .map((c) => ({ c, s: sinceOf(c) }))
        .filter((x): x is { c: DashboardCoin; s: number } => x.s !== null),
    [coins, sinceOf]
  );

  const holdCnt = coins?.filter((c) => c.holding).length ?? 0;
  const watchCnt = (coins?.length ?? 0) - holdCnt;
  const perfAvg =
    withSince.length > 0
      ? withSince.reduce((a, x) => a + x.s, 0) / withSince.length
      : null;

  const sortedBySince = useMemo(
    () => [...withSince].sort((a, b) => b.s - a.s),
    [withSince]
  );
  const best = sortedBySince[0];
  const worst = sortedBySince[sortedBySince.length - 1];

  /* 详情抽屉：K 线按需加载 */
  const activeCoin = coins?.find((c) => c.ca === active) ?? null;
  useEffect(() => {
    if (!activeCoin?.data?.pairAddress) return;
    let cancelled = false;
    setCloses(null);
    fetch(
      `/api/market?type=ohlcv&chain=${activeCoin.data.chainId}&pair=${activeCoin.data.pairAddress}&range=${range}`
    )
      .then((r) => r.json())
      .then((j: { closes?: number[] }) => {
        if (!cancelled) setCloses(j.closes?.length ? j.closes : []);
      })
      .catch(() => !cancelled && setCloses([]));
    return () => {
      cancelled = true;
    };
  }, [activeCoin, range]);

  const sortBtn = (k: typeof sortK, label: string) => (
    <button
      type="button"
      onClick={() => {
        if (sortK === k) setSortDir((v) => -v);
        else {
          setSortK(k);
          setSortDir(-1);
        }
      }}
      className="inline-flex items-center gap-0.5 hover:text-heading"
    >
      {label}
      <span className="text-[9px]">
        {sortK === k ? (sortDir < 0 ? "▼" : "▲") : ""}
      </span>
    </button>
  );

  const copyCa = async (ca: string) => {
    try {
      await navigator.clipboard.writeText(ca);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 剪贴板不可用时静默 */
    }
  };

  /* ---------- 渲染 ---------- */
  if (coins === null) {
    return (
      <p className="py-24 text-center text-sm text-muted">
        {failed ? d.loadFail : d.loading}
      </p>
    );
  }

  const perfCard = (
    tag: string,
    item: { c: DashboardCoin; s: number } | undefined,
    positive: boolean
  ) => (
    <div
      className={`flex items-center gap-4 rounded-2xl border border-line bg-card px-5 py-4 ${
        positive ? "border-l-[3px] border-l-emerald-500" : "border-l-[3px] border-l-red-500"
      }`}
    >
      {item && (
        <>
          <CoinAvatar
            imageUrl={item.c.data?.imageUrl}
            symbol={item.c.data?.symbol ?? item.c.ca.slice(0, 4)}
            hue={avatarHue(item.c.ca)}
            size={40}
          />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold tracking-wider text-muted">
              {tag}
            </div>
            <div className="truncate font-bold text-heading">
              {item.c.data?.name ?? item.c.ca.slice(0, 8)}
              <span className="ml-1.5 text-xs font-normal text-muted">
                ${item.c.data?.symbol}
              </span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className={`text-2xl font-bold tabular-nums ${upCls(positive ? 1 : -1)}`}>
              {fmtPct(item.s)}
            </div>
            <div className="text-xs text-muted">
              {d.since} {item.c.addedAt}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const thCls = "px-3 py-3 text-right text-xs font-medium text-muted whitespace-nowrap";
  const tdNum = "px-3 py-3.5 text-right tabular-nums whitespace-nowrap";

  return (
    <div>
      {/* 页头 */}
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent dark:text-accent-mint">
        {d.eyebrow}
      </div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
        {d.title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">{d.sub}</p>

      {/* 总览：三指标（按确认去掉持仓总盈亏） */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-card px-5 py-4 transition-shadow hover:shadow-lg">
          <div className="text-xs text-muted">{d.statHold}</div>
          <div className="mt-1 text-2xl font-bold text-heading">
            {holdCnt}
            <small className="ml-1 text-sm font-medium text-muted">个</small>
          </div>
          <div className="text-xs text-muted">{d.statHoldSub}</div>
        </div>
        <div className="rounded-2xl border border-line bg-card px-5 py-4 transition-shadow hover:shadow-lg">
          <div className="text-xs text-muted">{d.statWatch}</div>
          <div className="mt-1 text-2xl font-bold text-heading">
            {watchCnt}
            <small className="ml-1 text-sm font-medium text-muted">个</small>
          </div>
          <div className="text-xs text-muted">{d.statWatchSub}</div>
        </div>
        <div className="col-span-2 rounded-2xl border border-line bg-card px-5 py-4 transition-shadow hover:shadow-lg lg:col-span-1">
          <div className="text-xs text-muted">{d.statPerf}</div>
          <div
            className={`mt-1 text-2xl font-bold tabular-nums ${
              perfAvg === null ? "text-heading" : upCls(perfAvg)
            }`}
          >
            {perfAvg === null ? "—" : fmtPct(perfAvg)}
          </div>
          <div className="text-xs text-muted">{d.statPerfSub}</div>
        </div>
      </div>

      {/* Best / Worst */}
      <div className="mt-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {perfCard(d.bestTag, best, true)}
        {perfCard(d.worstTag, worst, false)}
      </div>

      {/* 代币表格 */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex flex-wrap items-center gap-1 border-b border-line px-4 pt-3">
          {(
            [
              ["all", d.tabAll, coins.length],
              ["hold", d.tabHold, holdCnt],
              ["watch", d.tabWatch, watchCnt],
            ] as const
          ).map(([k, label, cnt]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`-mb-px border-b-2 px-3.5 py-2.5 text-sm transition-colors ${
                tab === k
                  ? "border-accent font-semibold text-accent dark:border-accent-mint dark:text-accent-mint"
                  : "border-transparent text-muted hover:text-heading"
              }`}
            >
              {label}
              <span className="ml-1.5 rounded-full bg-codebg px-1.5 py-0.5 text-[11px] text-muted">
                {cnt}
              </span>
            </button>
          ))}
          <span className="ml-auto hidden pb-2 text-xs text-muted sm:block">
            {d.hint}
          </span>
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
                  <th className={thCls}>{sortBtn("mcap", d.colMcap)}</th>
                  <th className={`${thCls} hidden lg:table-cell`}>
                    {d.colFollowP}
                  </th>
                  <th className={thCls}>{d.colPrice}</th>
                  <th className={thCls}>{sortBtn("since", d.colSince)}</th>
                  <th className={thCls}>{sortBtn("c24", d.col24)}</th>
                  <th className={`${thCls} text-left hidden lg:table-cell`}>
                    {d.col7d}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const since = sinceOf(c);
                  const up24 = (c.data?.change24h ?? 0) >= 0;
                  return (
                    <tr
                      key={c.ca}
                      onClick={() => {
                        setActive(c.ca);
                        setRange("7D");
                      }}
                      className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-accent/5"
                    >
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <CoinAvatar
                            imageUrl={c.data?.imageUrl}
                            symbol={c.data?.symbol ?? c.ca.slice(0, 4)}
                            hue={avatarHue(c.ca)}
                            size={36}
                          />
                          <span>
                            <span className="block font-semibold text-heading">
                              {c.data?.name ?? "…"}
                            </span>
                            <span className="block text-xs text-muted">
                              {c.data?.symbol ?? c.ca.slice(0, 6)} ·{" "}
                              {c.data?.chainId ?? "—"}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-left">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                            c.holding
                              ? "bg-accent text-white"
                              : "border border-line text-muted"
                          }`}
                        >
                          {c.holding ? d.statusHold : d.statusWatch}
                        </span>
                      </td>
                      <td className={tdNum}>
                        {formatMcap(c.data?.marketCap ?? c.data?.fdv)}
                      </td>
                      <td className={`${tdNum} hidden lg:table-cell`}>
                        {c.followPrice ? formatPrice(c.followPrice) : "—"}
                      </td>
                      <td className={`${tdNum} font-medium text-heading`}>
                        {c.data ? formatPrice(c.data.priceUsd) : "—"}
                      </td>
                      <td className={tdNum}>
                        {since === null ? (
                          "—"
                        ) : (
                          <span
                            className={`font-bold ${upCls(since)}`}
                          >
                            {fmtPct(since)}
                            <span className="block text-[10px] font-normal text-muted">
                              {d.colSince}
                            </span>
                          </span>
                        )}
                      </td>
                      <td className={tdNum}>
                        <span
                          className={`inline-block rounded-lg px-2 py-0.5 text-xs font-semibold ${
                            up24
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-600 dark:text-red-400"
                          }`}
                        >
                          {c.data ? fmtPct(c.data.change24h) : "—"}
                        </span>
                      </td>
                      <td className="hidden px-3 py-3.5 lg:table-cell">
                        <Sparkline
                          pts={c.spark}
                          up={(c.spark?.[c.spark.length - 1] ?? 0) >= (c.spark?.[0] ?? 0)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-muted">
        行情来自 DexScreener · K 线来自 GeckTerminal · 非投资建议
      </p>

      {/* ============ 详情抽屉 ============ */}
      <div
        className={`fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ${
          active ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setActive(null)}
        aria-hidden="true"
      />
      <aside
        className={`fixed right-0 top-0 bottom-0 z-[90] flex w-full max-w-[460px] transform flex-col border-l border-line bg-paper shadow-2xl transition-transform duration-300 ease-out ${
          active ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!active}
      >
        {activeCoin && (
          <>
            <DrawerHead
              coin={activeCoin}
              t={d}
              onClose={() => setActive(null)}
            />
            <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4">
              {/* 走势图 */}
              <div className="rounded-2xl border border-line bg-card p-4">
                <div className="mx-auto flex w-max gap-1 rounded-xl bg-codebg p-1">
                  {(["24H", "7D", "30D", "ALL"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRange(r)}
                      className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                        range === r
                          ? "bg-card text-heading shadow-sm"
                          : "text-muted hover:text-heading"
                      }`}
                    >
                      {r === "24H"
                        ? d.range24
                        : r === "7D"
                          ? d.range7
                          : r === "30D"
                            ? d.range30
                            : d.rangeAll}
                    </button>
                  ))}
                </div>
                <Chart closes={closes} />
                {closes !== null && closes.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted">
                    {d.chartEmpty}
                  </p>
                )}
              </div>

              <DrawerRecord coin={activeCoin} t={d} since={sinceOf(activeCoin)} />

              {activeCoin.holding &&
                activeCoin.holdAmount &&
                activeCoin.avgCost && (
                  <DrawerHolding coin={activeCoin} t={d} />
                )}

              {/* 我的评价 */}
              {activeCoin.comment && (
                <section className="mt-6">
                  <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
                    {d.myComment}
                  </h3>
                  <p className="rounded-2xl border border-line bg-card px-4 py-3.5 text-sm leading-relaxed text-heading">
                    {activeCoin.comment}
                  </p>
                </section>
              )}

              {/* 链上信息 */}
              <section className="mt-6">
                <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  {d.onchain}
                </h3>
                <div className="overflow-hidden rounded-2xl border border-line bg-card">
                  <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                    <span className="shrink-0 text-sm text-muted">{d.ca}</span>
                    <span className="truncate font-mono text-xs text-muted">
                      {activeCoin.ca}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void copyCa(activeCoin.ca)}
                      className="rounded-lg bg-accent px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-deep"
                    >
                      {copied ? d.copy + " ✓" : d.copy}
                    </button>
                    {activeCoin.data?.url && (
                      <a
                        href={activeCoin.data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-line px-3.5 py-1.5 text-xs font-medium text-heading transition-colors hover:border-accent hover:text-accent"
                      >
                        {d.kline} ↗
                      </a>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

/* ---------------- 抽屉头部 ---------------- */
function DrawerHead({
  coin,
  t,
  onClose,
}: {
  coin: DashboardCoin;
  t: Dictionary["dashboard"];
  onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-3.5 border-b border-line px-5 py-4">
      <CoinAvatar
        imageUrl={coin.data?.imageUrl}
        symbol={coin.data?.symbol ?? coin.ca.slice(0, 4)}
        hue={avatarHue(coin.ca)}
        size={48}
      />
      <div className="min-w-0">
        <div className="truncate text-lg font-bold text-heading">
          {coin.data?.name ?? "…"}
        </div>
        <div className="text-xs text-muted">
          {coin.data?.symbol ? `$${coin.data.symbol} · ` : ""}
          {coin.data?.chainId ?? ""}
        </div>
      </div>
      <div className="ml-auto text-right">
        <div className="text-lg font-bold tabular-nums text-heading">
          {coin.data ? formatPrice(coin.data.priceUsd) : "—"}
        </div>
        <div
          className={`text-xs tabular-nums ${upCls(coin.data?.change24h ?? 0)}`}
        >
          {coin.data ? fmtPct(coin.data.change24h) : ""} 24H
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="rounded-lg p-2 text-muted transition-colors hover:bg-line hover:text-heading"
      >
        ✕
      </button>
    </div>
  );
}

/* ---------------- 关注记录 ---------------- */
function DrawerRecord({
  coin,
  t,
  since,
}: {
  coin: DashboardCoin;
  t: Dictionary["dashboard"];
  since: number | null;
}) {
  const days = Math.max(
    0,
    Math.round(
      (Date.now() - new Date(coin.addedAt).getTime()) / 86_400_000
    )
  );
  const kv = (k: string, v: React.ReactNode) => (
    <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-sm last:border-0">
      <span className="text-muted">{k}</span>
      <span className="font-medium tabular-nums text-heading">{v}</span>
    </div>
  );
  return (
    <section className="mt-6">
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
        {t.record}
      </h3>
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {kv(
          t.followedAt,
          <span>
            {coin.addedAt}
            <span className="ml-1 text-xs text-muted">
              （{t.daysAgo.replace("{d}", String(days))}）
            </span>
          </span>
        )}
        {kv(t.followPrice, coin.followPrice ? formatPrice(coin.followPrice) : "—")}
        {kv(t.followMcap, formatMcap(coin.followMcap))}
        {kv(t.nowMcap, formatMcap(coin.data?.marketCap ?? coin.data?.fdv))}
        {kv(
          t.sinceChg,
          since === null ? (
            "—"
          ) : (
            <span className={upCls(since)}>{fmtPct(since)}</span>
          )
        )}
      </div>
    </section>
  );
}

/* ---------------- 持仓信息 ---------------- */
function DrawerHolding({
  coin,
  t,
}: {
  coin: DashboardCoin;
  t: Dictionary["dashboard"];
}) {
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
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
        {t.holding}
      </h3>
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {kv(t.amount, amount.toExponential(2))}
        {kv(t.avgCost, formatPrice(avgCost))}
        {kv(t.cost, formatMcap(cost))}
        {kv(t.value, formatMcap(value))}
        {kv(
          t.unrealized,
          <span className={upCls(pnl)}>
            {fmtPct(pnl)}（{formatMcap(Math.abs(value - cost))}）
          </span>
        )}
        <div className="px-4 pb-3">
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-codebg">
            <div
              className={`h-full rounded-full ${
                pnl >= 0 ? "bg-emerald-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, Math.abs(pnl))}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- K 线图（canvas） ---------------- */
function Chart({ closes }: { closes: number[] | null }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !closes || closes.length < 2) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = cv.clientWidth;
    const H = cv.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const span = max - min || 1;
    const px = (i: number) => 6 + (i / (closes.length - 1)) * (W - 12);
    const py = (v: number) => H - 12 - ((v - min) / span) * (H - 24);
    const up = closes[closes.length - 1] >= closes[0];
    const col = up ? "#059669" : "#dc2626";

    /* 网格 */
    ctx.strokeStyle = "rgba(128,128,128,.15)";
    ctx.lineWidth = 1;
    for (let g = 0; g < 4; g++) {
      const y = 8 + (g * (H - 20)) / 3;
      ctx.beginPath();
      ctx.moveTo(6, y);
      ctx.lineTo(W - 6, y);
      ctx.stroke();
    }
    /* 面积 */
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, up ? "rgba(5,150,105,.22)" : "rgba(220,38,38,.22)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.moveTo(px(0), py(closes[0]));
    closes.forEach((p, i) => ctx.lineTo(px(i), py(p)));
    ctx.lineTo(px(closes.length - 1), H - 2);
    ctx.lineTo(px(0), H - 2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    /* 线 */
    ctx.beginPath();
    ctx.moveTo(px(0), py(closes[0]));
    closes.forEach((p, i) => ctx.lineTo(px(i), py(p)));
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();
    /* 末点 */
    const lx = px(closes.length - 1);
    const ly = py(closes[closes.length - 1]);
    ctx.beginPath();
    ctx.arc(lx, ly, 3.2, 0, 7);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lx, ly, 6.5, 0, 7);
    ctx.fillStyle = up ? "rgba(5,150,105,.18)" : "rgba(220,38,38,.18)";
    ctx.fill();

    /* 十字光标 */
    const paint = (hover: number | null) => {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(128,128,128,.15)";
      for (let g = 0; g < 4; g++) {
        const y = 8 + (g * (H - 20)) / 3;
        ctx.beginPath();
        ctx.moveTo(6, y);
        ctx.lineTo(W - 6, y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(px(0), py(closes[0]));
      closes.forEach((p, i) => ctx.lineTo(px(i), py(p)));
      ctx.lineTo(px(closes.length - 1), H - 2);
      ctx.lineTo(px(0), H - 2);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px(0), py(closes[0]));
      closes.forEach((p, i) => ctx.lineTo(px(i), py(p)));
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.stroke();
      const li = hover ?? closes.length - 1;
      ctx.beginPath();
      ctx.arc(px(li), py(closes[li]), 3.2, 0, 7);
      ctx.fillStyle = col;
      ctx.fill();
      if (hover !== null) {
        ctx.strokeStyle = "rgba(128,128,128,.5)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(px(hover), 6);
        ctx.lineTo(px(hover), H - 6);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };
    paint(null);
    const onMove = (e: MouseEvent) => {
      const r = cv.getBoundingClientRect();
      const i = Math.round(
        ((e.clientX - r.left - 6) / (W - 12)) * (closes.length - 1)
      );
      paint(Math.max(0, Math.min(closes.length - 1, i)));
    };
    const onLeave = () => paint(null);
    cv.addEventListener("mousemove", onMove);
    cv.addEventListener("mouseleave", onLeave);
    return () => {
      cv.removeEventListener("mousemove", onMove);
      cv.removeEventListener("mouseleave", onLeave);
    };
  }, [closes]);

  if (closes === null)
    return <div className="h-[190px] animate-pulse rounded-xl bg-codebg/60" />;
  if (closes.length < 2) return <div className="h-[190px]" />;
  return <canvas ref={ref} className="mt-2 block h-[190px] w-full" />;
}
