/**
 * admin/research —— 投研统一工作台（原 关注列表/研究日志/判断记录 三页合一）
 * 服务端只负责取数：calls + journal（走 storage 适配器，与后台写入一致）。
 */

import type { Metadata } from "next";
import Container from "@/components/Container";
import ResearchHub from "@/components/admin/ResearchHub";
import { requireAdmin } from "@/lib/adminGuard";
import { readCallRecords } from "@/lib/calls-store";
import { readTextFile } from "@/lib/storage";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = { title: "投研工作台" };

export const dynamic = "force-dynamic";

export default async function AdminResearchPage() {
  requireAdmin();

  const [records, rawJournals] = await Promise.all([
    readCallRecords(),
    readTextFile("content/journal.json"),
  ]);

  /* 轻量校验：坏条目跳过不拖垮页面 */
  let journals: unknown[] = [];
  try {
    const parsed = rawJournals ? JSON.parse(rawJournals) : [];
    if (Array.isArray(parsed)) {
      journals = parsed.filter(
        (j) => j && typeof (j as { id?: unknown }).id === "string" && typeof (j as { body?: unknown }).body === "string"
      );
    }
  } catch {
    /* 空日志 */
  }

  /* 每个判断关联的研报（按 tokens 匹配，与公开详情页同规则） */
  const posts = getAllPosts("zh");
  const relatedMap: Record<string, { slug: string; title: string }[]> = {};
  for (const r of records) {
    const sym = r.call.symbol.toLowerCase();
    const addr = r.call.contractAddress.toLowerCase();
    const matched = posts
      .filter((pt) =>
        (pt.tokens ?? []).some((tk) => {
          const t = tk.trim().toLowerCase();
          return t.length > 0 && (t === sym || t === addr);
        })
      )
      .map((pt) => ({ slug: pt.slug, title: pt.title }));
    const merged = new Map<string, { slug: string; title: string }>();
    for (const slug of r.call.relatedReports) {
      const pt = posts.find((x) => x.slug === slug);
      merged.set(slug, { slug, title: pt?.title ?? slug });
    }
    for (const m of matched) merged.set(m.slug, m);
    relatedMap[r.call.id] = [...merged.values()];
  }

  return (
    <Container className="py-8 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight text-heading">投研工作台</h1>
      <p className="mt-1 max-w-[720px] text-xs leading-relaxed text-muted">
        以币为中心：左侧选币，右侧维护<b>判断 / 快记 / 持仓</b>。建立关注 = 新建 stance=watch 的判断；
        判断发布后锁定不可改写，改错只能追加「论点修正」或关闭复盘；披露与证伪条件必填。
      </p>
      <div className="mt-6">
        <ResearchHub
          initialRecords={records}
          initialJournals={journals as never}
          relatedMap={relatedMap}
        />
      </div>
    </Container>
  );
}
