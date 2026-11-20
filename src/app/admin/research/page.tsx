/**
 * admin/research —— 「投研」合并页：关注列表 + 研究日志
 * 一个菜单下的两个 tab（?tab=watchlist|journal，默认关注列表），
 * 只加载当前 tab 的数据。旧路由 /admin/watchlist、/admin/journal 已重定向到这里。
 */

import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import WatchlistManager from "@/components/admin/WatchlistManager";
import JournalManager from "@/components/admin/JournalManager";
import CallsManager from "@/components/admin/CallsManager";
import { requireAdmin } from "@/lib/adminGuard";
import { readTextFile, WATCHLIST_PATH } from "@/lib/storage";
import { fetchCoinData, getWhyTags, getWatchlist, type WatchCoin } from "@/lib/watchlist";
import { getJournal } from "@/lib/journal";
import { readCallRecords } from "@/lib/calls-store";

export const metadata: Metadata = { title: "投研管理" };

export const dynamic = "force-dynamic";

const TABS = [
  { key: "watchlist", label: "关注列表", sub: "添加合约地址（CA）与评价；新增时自动记录关注时价格/市值，前台看板实时展示行情、关注以来涨跌幅与持仓盈亏。" },
  { key: "journal", label: "研究日志", sub: "碎片研究记录（观察/假设/数据速记）。关联代币后会出现在看板该币的时间线里。" },
  { key: "calls", label: "判断记录", sub: "Track Record：判断发布后锁定不可改写，只能追加更新或关闭复盘；披露与证伪条件必填。" },
] as const;

export default async function AdminResearchPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  requireAdmin();

  const active =
    searchParams.tab === "journal"
      ? "journal"
      : searchParams.tab === "calls"
        ? "calls"
        : "watchlist";
  const meta = TABS.find((t) => t.key === active)!;

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-2xl font-bold tracking-tight text-heading">投研</h1>

      {/* 子菜单：关注列表 | 研究日志 */}
      <div className="mt-5 flex gap-1 border-b border-line" role="tablist" aria-label="投研子菜单">
        {TABS.map((t) => (
          <Link
            key={t.key}
            role="tab"
            aria-selected={t.key === active}
            href={`/admin/research?tab=${t.key}`}
            className={`relative -mb-px border-b-2 px-4 py-2.5 text-sm transition-colors ${
              t.key === active
                ? "border-accent font-semibold text-accent dark:text-accent-mint"
                : "border-transparent text-muted hover:border-line hover:text-heading"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted">{meta.sub}</p>

      <div className="mt-6">
        {active === "watchlist" ? (
          <WatchlistTab />
        ) : active === "calls" ? (
          <CallsTab />
        ) : (
          <JournalTab />
        )}
      </div>
    </Container>
  );
}

/** 关注列表：读 watchlist.json + 实时行情辅助展示 */
async function WatchlistTab() {
  const raw = await readTextFile(WATCHLIST_PATH);
  let coins: Array<Record<string, unknown>> = [];
  try {
    const json = raw ? JSON.parse(raw) : [];
    if (Array.isArray(json)) coins = json;
  } catch {
    /* 空列表 */
  }

  const rows = await Promise.all(
    coins.map(async (raw) => {
      const c = raw as Partial<WatchCoin> & { ca?: string; holding?: boolean };
      const d = await fetchCoinData(c.address ?? c.ca ?? "", c);
      const addr = c.address ?? c.ca ?? "";
      return {
        ca: addr,
        chain: c.chain ?? d?.chainId ?? "",
        symbol: c.symbol ?? d?.symbol,
        name: c.name ?? d?.name,
        dex: c.dex ?? d?.dexId,
        pairAddress: c.pairAddress ?? d?.pairAddress,
        image: c.image,
        status: c.status ?? (c.holding ? "holding" : "watching"),
        why: Array.isArray(c.why) ? c.why : [],
        comment: String(c.comment ?? ""),
        addedAt: String(c.addedAt ?? ""),
        holding: c.holding ?? c.status === "holding",
        holdAmount: c.holdAmount,
        avgCost: c.avgCost,
        followPrice: c.followPrice,
        profile: c.profile,
        events: Array.isArray(c.events) ? c.events : [],
        priceUsd: d?.priceUsd,
        change24h: d?.change24h,
      };
    })
  );

  return <WatchlistManager coins={rows} tags={getWhyTags()} />;
}

/** 判断记录：Track Record（calls.json） */
async function CallsTab() {
  const records = await readCallRecords();
  return <CallsManager initialRecords={records} />;
}

/** 研究日志：journal.json + 关注币下拉 */
async function JournalTab() {
  const entries = getJournal();
  const coins = getWatchlist().map((c) => ({
    symbol: c.symbol,
    address: c.address,
    name: c.name,
  }));

  return <JournalManager entries={entries} coins={coins} />;
}
