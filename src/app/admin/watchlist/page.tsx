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
            添加合约地址（CA）与一句话评价，前台 watchlist 页面会自动抓取头像与行情。
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
