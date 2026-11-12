/**
 * admin/edit/[slug] —— 编辑文章
 * 从存储适配器读取原始 Markdown 传给编辑器；hasEn 表示已存在英文版。
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import PostEditor from "@/components/admin/PostEditor";
import { requireAdmin } from "@/lib/adminGuard";
import { listRawPosts, POSTS_DIR, POSTS_EN_DIR } from "@/lib/storage";

export const metadata: Metadata = { title: "编辑文章" };

export const dynamic = "force-dynamic";

export default async function AdminEditPage({
  params,
}: {
  params: { slug: string };
}) {
  requireAdmin();

  const [files, enFiles] = await Promise.all([
    listRawPosts(POSTS_DIR),
    listRawPosts(POSTS_EN_DIR),
  ]);
  const file = files.find((f) => f.slug === params.slug);
  if (!file) notFound();

  const hasEn = enFiles.some((f) => f.slug === params.slug);

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-2xl font-bold tracking-tight text-heading">编辑文章</h1>
      <p className="mt-1 font-mono text-xs text-muted">{file.slug}.md</p>
      <div className="mt-8 rounded-2xl border border-line bg-card p-6 sm:p-8">
        <PostEditor
          initialSlug={file.slug}
          initialMarkdown={file.content}
          hasEn={hasEn}
        />
      </div>
    </Container>
  );
}
