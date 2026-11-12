/**
 * POST /api/admin/login —— 后台登录
 * body: { password: string }
 * 验证成功设置 httpOnly 会话 cookie（7 天）。
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAdminPassword,
  createSessionToken,
  COOKIE_NAME,
  SESSION_MS,
} from "@/lib/auth";

export async function POST(req: Request) {
  let password = "";
  try {
    const body = await req.json();
    password = String(body.password ?? "");
  } catch {
    /* 空 body 按密码错误处理 */
  }

  if (!password || password !== getAdminPassword()) {
    return NextResponse.json(
      { ok: false, message: "密码不正确" },
      { status: 401 }
    );
  }

  cookies().set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_MS / 1000),
  });

  return NextResponse.json({ ok: true });
}
