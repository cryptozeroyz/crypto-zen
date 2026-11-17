/**
 * admin/watchlist —— 关注列表管理
 * 读取 content/watchlist.json，并实时抓取代币名/价格辅助展示。
 */

import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import WatchlistManager from "@/components/admin/WatchlistManager";
import { requireAdmin } from "@/lib/adminGuard";
import { readTextFile, WATCHLIST_PATH } from "@/lib/storage";
import { fetchCoinData, type WatchCoin } from "@/lib/watchlist";

export const metadata: Metadata = { title: "关注列表管理" };

export const dynamic = "force-dynamic";

export default async function AdminWatchlistPage() {
  requireAdmin();

  const raw = await readTextFile(WATCHLIST_PATH);
  let coins: WatchCoin[] = [];
  try {
    const json = raw ? JSON.parse(raw) : [];
    if (Array.isArray(json)) coins = json;
  } catch {
    /* 空列表 */
  }

  const rows = await Promise.all(
    coins.map(async (c) => {
      const d = await fetchCoinData(c.ca);
      return {
        ca: c.ca,
        comment: c.comment,
        addedAt: c.addedAt,
        holding: c.holding === true,
        holdAmount: c.holdAmount,
        avgCost: c.avgCost,
        followPrice: c.followPrice,
        name: d?.name,
        symbol: d?.symbol,
        priceUsd: d?.priceUsd,
        change24h: d?.change24h,
      };
    })
  );

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading">
            关注列表管理
          </h1>
          <p className="mt-1 text-xs text-muted">
            添加合约地址（CA）与评价；新增时代币自动记录关注时价格/市值，前台 /dashboard
            看板实时展示行情、关注以来涨跌幅与持仓盈亏。
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-lg border border-line px-3.5 py-2 text-sm text-muted transition-colors hover:border-heading hover:text-heading"
        >
          ← 返回文章管理
        </Link>
      </div>

      <div className="mt-8">
        <WatchlistManager coins={rows} />
      </div>
    </Container>
  );
}
