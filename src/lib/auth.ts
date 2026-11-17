/**
 * auth.ts —— 后台登录认证（HMAC 签名的会话 Cookie）
 *
 * 安全约定（2026-11 安全整改）：
 * - 密码：环境变量 ADMIN_PASSWORD，生产环境未配置或短于 8 位 → 直接抛错禁用登录（无默认值）
 * - 密钥：环境变量 ADMIN_SECRET（≥16 位随机串），生产环境缺失 → 抛错禁用（不再回退用密码）
 * - 仅本地开发（NODE_ENV≠production）保留 dev 兜底，方便零配置跑起来
 * - 会话：cookie 值为 `${过期时间戳}.${HMAC-SHA256 签名}`，默认有效期 7 天
 *
 * 仅在服务端（API 路由 / Server Component）中使用。
 */

import crypto from "crypto";

const COOKIE_NAME = "cz_admin";
/* 会话有效期 24 小时：无状态 HMAC 会话无法单独撤销，
   缩短有效期是控制被盗 cookie 暴露窗口的主要手段。
   紧急吊销全部会话：更换 ADMIN_SECRET，所有已签发的 cookie 立即失效。 */
const SESSION_MS = 24 * 60 * 60 * 1000;

/**
 * 后台登录密码。生产环境必须显式配置 ADMIN_PASSWORD（≥8 位），
 * 否则抛出错误、登录流程失败关闭（fail-closed），杜绝弱默认口令。
 */
export function getAdminPassword(): string {
  const pwd = process.env.ADMIN_PASSWORD;
  if (pwd && pwd.length >= 8) return pwd;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_PASSWORD 未配置或过短（至少 8 位），后台登录已被禁用。请在服务器 .env / Vercel 环境变量中设置。"
    );
  }
  // 仅本地开发兜底
  return "admin123";
}

/**
 * 会话签名密钥。生产环境必须显式配置 ADMIN_SECRET（≥16 位随机串），
 * 且必须与 ADMIN_PASSWORD 不同 —— 密钥一旦与口令同源，密码泄露即会话伪造。
 * 生成：node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
function getSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_SECRET 未配置或过短（至少 16 位随机字符），后台会话校验已被禁用。"
    );
  }
  // 仅本地开发兜底
  return getAdminPassword();
}

/** 自检 ADMIN_SECRET 配置是否可用（不返回密钥本身，避免意外泄露） */
export function assertSecretConfigured(): void {
  getSecret();
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
