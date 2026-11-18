/**
 * admin/journal —— 研究日志管理页
 */

import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import JournalManager from "@/components/admin/JournalManager";
import { requireAdmin } from "@/lib/adminGuard";
import { readTextFile } from "@/lib/storage";
import { getJournal } from "@/lib/journal";
import { getWatchlist } from "@/lib/watchlist";

export const metadata: Metadata = { title: "研究日志" };

export const dynamic = "force-dynamic";

export default async function AdminJournalPage() {
  requireAdmin();

  const entries = getJournal();
  const coins = getWatchlist().map((c) => ({
    symbol: c.symbol,
    address: c.address,
    name: c.name,
  }));

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading">研究日志</h1>
          <p className="mt-1 text-xs text-muted">
            碎片研究记录（观察/假设/数据速记）。关联代币后会出现在看板该币的时间线里。
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-lg border border-line px-3.5 py-2 text-sm text-muted transition-colors hover:border-heading hover:text-heading"
        >
          ← 返回后台
        </Link>
      </div>
      <div className="mt-8">
        <JournalManager entries={entries} coins={coins} />
      </div>
    </Container>
  );
}
