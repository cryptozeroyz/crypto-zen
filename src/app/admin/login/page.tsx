/**
 * admin/login —— 后台登录页
 */

import type { Metadata } from "next";
import Container from "@/components/Container";
import LoginForm from "@/components/admin/LoginForm";
import { redirectIfAuthed } from "@/lib/adminGuard";

export const metadata: Metadata = { title: "后台登录" };

export default function AdminLoginPage() {
  redirectIfAuthed();

  return (
    <Container className="py-20 sm:py-28">
      <div className="mx-auto max-w-sm rounded-2xl border border-line bg-card p-8">
        <h1 className="text-xl font-bold tracking-tight text-heading">
          后台管理
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          登录后可以新建、编辑和删除文章。
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </Container>
  );
}
