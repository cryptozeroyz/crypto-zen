/**
 * admin/new —— 新建文章
 */

import type { Metadata } from "next";
import Container from "@/components/Container";
import PostEditor from "@/components/admin/PostEditor";
import { requireAdmin } from "@/lib/adminGuard";

export const metadata: Metadata = { title: "新建文章" };

export const dynamic = "force-dynamic";

export default function AdminNewPage() {
  requireAdmin();

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-2xl font-bold tracking-tight text-heading">
        新建文章
      </h1>
      <div className="mt-8 rounded-2xl border border-line bg-card p-6 sm:p-8">
        <PostEditor />
      </div>
    </Container>
  );
}
