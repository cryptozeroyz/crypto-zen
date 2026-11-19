/**
 * admin/journal —— 旧路由，重定向到投研合并页的研究日志 tab。
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "研究日志" };

export const dynamic = "force-dynamic";

export default function AdminJournalRedirect() {
  redirect("/admin/research?tab=journal");
}
