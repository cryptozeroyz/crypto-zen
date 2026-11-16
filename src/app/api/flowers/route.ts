/**
 * api/flowers/route.ts —— 「送花」计数器接口
 *
 * 数据存 content/flowers.json（{ "count": number }），复用 storage.ts 的
 * 本地/GitHub 双模式适配层：本地开发直接写文件，Vercel 上走 GitHub Contents API。
 *
 * GET  /api/flowers        → { count }            读取当前总数
 * POST /api/flowers        body { add: n } → { count }  累计 n 朵（客户端批量上报）
 *
 * 设计要点：
 * - force-dynamic：计数是实时数据，绝不能被静态化到构建期。
 * - 乐观计数在客户端完成，这里只负责持久化批量增量，
 *   避免每次点击都写一次 GitHub（每次写入 = 一次提交 = 一次 Vercel 重新部署）。
 * - 并发冲突（两个请求同时改文件，后者拿到旧 sha 409）重试一次。
 */

import { NextResponse } from "next/server";
import { readTextFile, saveTextFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

const FLOWERS_PATH = "content/flowers.json";

function parseCount(raw: string | null): number {
  if (!raw) return 0;
  try {
    const n = (JSON.parse(raw) as { count?: unknown }).count;
    return typeof n === "number" && Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

async function readCount(): Promise<number> {
  return parseCount(await readTextFile(FLOWERS_PATH));
}

/** 读-改-写；遇到并发 sha 冲突（409）整体重试一次 */
async function addCount(add: number): Promise<number> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const next = (await readCount()) + add;
      await saveTextFile(FLOWERS_PATH, JSON.stringify({ count: next }, null, 2) + "\n");
      return next;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

export async function GET() {
  try {
    return NextResponse.json({ count: await readCount() });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

export async function POST(req: Request) {
  let add = 1;
  try {
    const body = (await req.json()) as { add?: unknown };
    if (typeof body.add === "number" && Number.isFinite(body.add)) {
      add = Math.max(1, Math.min(1000, Math.floor(body.add)));
    }
  } catch {
    /* sendBeacon 发的是 text/plain，解析失败按 1 朵处理 */
  }
  try {
    const count = await addCount(add);
    return NextResponse.json({ count });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "save failed" },
      { status: 500 }
    );
  }
}
