/**
 * admin/links —— 链接收藏管理
 */

import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import LinksManager from "@/components/admin/LinksManager";
import { requireAdmin } from "@/lib/adminGuard";
import { readTextFile, LINKS_PATH } from "@/lib/storage";
import type { LinkItem } from "@/lib/links";

export const metadata: Metadata = { title: "链接收藏管理" };

export const dynamic = "force-dynamic";

export default async function AdminLinksPage() {
  requireAdmin();

  const raw = await readTextFile(LINKS_PATH);
  let links: LinkItem[] = [];
  try {
    const json = raw ? JSON.parse(raw) : [];
    if (Array.isArray(json)) links = json;
  } catch {
    /* 空列表 */
  }

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading">
            链接收藏管理
          </h1>
          <p className="mt-1 text-xs text-muted">
            收集好用的工具、文章、网站，带一句话推荐，前台首页「推荐」区块展示。
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
        <LinksManager links={links} />
      </div>
    </Container>
  );
}
