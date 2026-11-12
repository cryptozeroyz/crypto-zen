/**
 * adminGuard.ts —— 后台页面的登录守卫（Server Component 用）
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

/** 未登录则跳转登录页 */
export function requireAdmin(): void {
  if (!verifySessionToken(cookies().get(COOKIE_NAME)?.value)) {
    redirect("/admin/login");
  }
}

/** 已登录则直接进后台（登录页用） */
export function redirectIfAuthed(): void {
  if (verifySessionToken(cookies().get(COOKIE_NAME)?.value)) {
    redirect("/admin");
  }
}
