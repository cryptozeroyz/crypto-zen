/**
 * loginRateLimit.ts —— 登录失败限流（进程内内存实现）
 *
 * 策略：同一 IP 10 分钟内失败 5 次 → 锁定 10 分钟；成功后清零。
 * 注意：内存级限流对多实例部署（Vercel 多函数实例）不是全局的，
 * 但作为免费/轻量方案已能挡住绝大多数在线爆破；VPS 单实例则是完整的。
 * 定期清理过期条目，避免 Map 无限增长。
 */

interface Entry {
  count: number;
  first: number;
  lockedUntil: number;
}

const MAX_FAILS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const LOCK_MS = 10 * 60 * 1000;

const attempts = new Map<string, Entry>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of attempts) {
    if (v.lockedUntil < now && now - v.first > WINDOW_MS) attempts.delete(k);
  }
}, 10 * 60 * 1000).unref?.();

/** 从请求头取客户端 IP（经 Caddy/Vercel 的 X-Forwarded-For） */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 45);
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** 是否允许尝试登录；不允许时返回剩余锁定秒数 */
export function loginAllowed(
  ip: string
): { ok: true } | { ok: false; retryAfterSec: number } {
  const e = attempts.get(ip);
  if (!e) return { ok: true };
  const now = Date.now();
  if (e.lockedUntil > now) {
    return { ok: false, retryAfterSec: Math.ceil((e.lockedUntil - now) / 1000) };
  }
  return { ok: true };
}

/** 记录一次失败；返回剩余锁定秒数（>=0，0 表示未锁定） */
export function recordLoginFail(ip: string): number {
  const now = Date.now();
  const e = attempts.get(ip);
  if (!e || now - e.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now, lockedUntil: 0 });
    return 0;
  }
  e.count += 1;
  if (e.count >= MAX_FAILS) {
    e.lockedUntil = now + LOCK_MS;
    return Math.ceil(LOCK_MS / 1000);
  }
  return 0;
}

/** 登录成功清零 */
export function clearLoginFails(ip: string): void {
  attempts.delete(ip);
}
