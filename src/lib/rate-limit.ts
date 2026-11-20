/**
 * rate-limit.ts —— 进程内令牌桶限流（公开 API 用）
 * 单实例部署（pm2 单进程）下够用；不引入外部存储依赖。
 * 超限返回剩余冷却秒数，调用方据此返回 429。
 */

export interface Bucket {
  tokens: number;
  updatedAt: number;
}

/** 纯函数：消费一个令牌。返回 [是否允许, 新桶状态, 超限剩余秒数] */
export function takeToken(
  bucket: Bucket | undefined,
  now: number,
  capacity: number,
  refillPerSec: number
): [boolean, Bucket, number] {
  const b = bucket ?? { tokens: capacity, updatedAt: now };
  const elapsed = Math.max(0, now - b.updatedAt) / 1000;
  const tokens = Math.min(capacity, b.tokens + elapsed * refillPerSec);
  if (tokens >= 1) {
    return [true, { tokens: tokens - 1, updatedAt: now }, 0];
  }
  const retryAfter = Math.ceil((1 - tokens) / refillPerSec);
  return [false, { tokens, updatedAt: now }, retryAfter];
}

/** 简单内存限流器（按 key，如 IP） */
export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  constructor(
    private capacity = 60,
    private refillPerSec = 1,
    private sweepEvery = 300
  ) {
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.sweep(), this.sweepEvery * 1000).unref?.();
    }
  }

  /** 允许返回 null；超限返回 retryAfter 秒 */
  check(key: string, now = Date.now()): number | null {
    const [ok, next, retryAfter] = takeToken(
      this.buckets.get(key),
      now,
      this.capacity,
      this.refillPerSec
    );
    this.buckets.set(key, next);
    return ok ? null : retryAfter;
  }

  private sweep() {
    const now = Date.now();
    for (const [k, b] of this.buckets) {
      if (now - b.updatedAt > this.sweepEvery * 1000) this.buckets.delete(k);
    }
  }
}
