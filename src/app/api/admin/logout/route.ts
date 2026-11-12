/**
 * POST /api/admin/logout —— 退出登录，清除会话 cookie
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  cookies().delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
