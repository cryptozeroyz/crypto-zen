/**
 * admin/layout.tsx —— 后台的公共布局
 * AdminShell 提供全后台统一顶栏（文章/投研/链接收藏 + 新建文章 + 退出），
 * 登录页由 AdminShell 自行降级为无导航。公开站点的 Header/Footer 不进后台。
 */

import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: {
    default: "后台管理",
    template: "%s · Crypto Zen 后台",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
