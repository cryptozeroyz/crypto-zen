/**
 * auth.ts —— 后台登录认证（HMAC 签名的会话 Cookie）
 *
 * - 密码：环境变量 ADMIN_PASSWORD（本地开发默认 admin123，部署前务必修改）
 * - 密钥：环境变量 ADMIN_SECRET（缺省时用密码本身，建议单独设置）
 * - 会话：cookie 值为 `${过期时间戳}.${HMAC-SHA256 签名}`，默认有效期 7 天
 *
 * 仅在服务端（API 路由 / Server Component）中使用。
 */

import crypto from "crypto";

const COOKIE_NAME = "cz_admin";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

/** 后台登录密码（可通过环境变量覆盖） */
export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin123";
}

/** 签名密钥 */
function getSecret(): string {
  return process.env.ADMIN_SECRET || getAdminPassword();
}

/** 生成一个新的会话 token */
export function createSessionToken(): string {
  const exp = Date.now() + SESSION_MS;
  const payload = String(exp);
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/** 校验会话 token 是否有效（未过期且签名正确） */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(payload);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const expect = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export { COOKIE_NAME, SESSION_MS };
