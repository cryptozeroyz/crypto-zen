/**
 * admin/watchlist —— 旧路由，重定向到投研合并页的关注列表 tab。
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "关注列表管理" };

export const dynamic = "force-dynamic";

export default function AdminWatchlistRedirect() {
  redirect("/admin/research?tab=watchlist");
}
