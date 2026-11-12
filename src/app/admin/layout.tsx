/**
 * admin/layout.tsx —— 后台的公共布局
 * 提供独立的标题模板和无障碍主内容区（公开站点的 Header/Footer 不进入后台）。
 */

import type { Metadata } from "next";

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
  return <main id="main-content">{children}</main>;
}
