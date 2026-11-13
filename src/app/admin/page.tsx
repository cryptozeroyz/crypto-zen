/**
 * admin —— 后台首页：文章列表（含草稿）
 * 数据来自存储适配器（本地文件或 GitHub），随写随存。
 * 「英文版」列显示自动翻译的生成状态。
 * 注意：公开页面是构建期静态生成的，线上修改后需等待重新部署生效。
 */

import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import LogoutButton from "@/components/admin/LogoutButton";
import DeleteButton from "@/components/admin/DeleteButton";
import { requireAdmin } from "@/lib/adminGuard";
import { listRawPosts, getAdapterName, POSTS_DIR, POSTS_EN_DIR } from "@/lib/storage";
import { parseMarkdown } from "@/lib/frontmatter";

export const metadata: Metadata = { title: "后台管理" };

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  research: "研究报告",
  essay: "个人随笔",
  ops: "产品运营",
};

export default async function AdminPage() {
  requireAdmin();

  const [files, enFiles] = await Promise.all([
    listRawPosts(POSTS_DIR),
    listRawPosts(POSTS_EN_DIR),
  ]);
  const enSlugs = new Set(enFiles.map((f) => f.slug));

  const posts = files
    .map((f) => {
      const { fields } = parseMarkdown(f.content);
      return { slug: f.slug, ...fields };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const adapterName = getAdapterName();

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading">
            内容管理
          </h1>
          <p className="mt-1 font-sans text-xs text-muted">
            存储模式：{adapterName === "github" ? "GitHub（提交后自动部署生效）" : "本地文件（开发模式，刷新页面即可见）"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-lg border border-line px-3.5 py-2 text-sm text-muted transition-colors hover:border-heading hover:text-heading"
          >
            ← 返回站点
          </Link>
          <Link
            href="/admin/watchlist"
            className="rounded-lg border border-line px-3.5 py-2 text-sm text-muted transition-colors hover:border-heading hover:text-heading"
          >
            关注列表
          </Link>
          <Link
            href="/admin/links"
            className="rounded-lg border border-line px-3.5 py-2 text-sm text-muted transition-colors hover:border-heading hover:text-heading"
          >
            链接收藏
          </Link>
          <Link
            href="/admin/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
          >
            + 新建文章
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="px-4 py-3 font-medium">标题</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 font-medium">日期</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">英文版</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.slug} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-heading">{p.title}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted">{p.slug}</p>
                </td>
                <td className="px-4 py-3 text-muted">
                  {CATEGORY_LABEL[p.category] ?? "个人随笔"}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted">{p.date}</td>
                <td className="px-4 py-3">
                  {p.draft ? (
                    <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
                      草稿
                    </span>
                  ) : (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent dark:text-accent-mint">
                      已发布
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {enSlugs.has(p.slug) ? (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-xs text-accent dark:text-accent-mint">
                      EN ✓
                    </span>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/edit/${p.slug}`}
                      className="text-accent hover:underline dark:text-accent-mint"
                    >
                      编辑
                    </Link>
                    <DeleteButton slug={p.slug} />
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  还没有文章，点击「新建文章」开始写作。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
