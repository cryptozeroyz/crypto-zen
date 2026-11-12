/**
 * /api/admin/watchlist —— 关注列表的增删查（存 content/watchlist.json）
 * - GET：读取列表
 * - POST：{ ca, comment } 添加（按 CA 去重）
 * - DELETE：{ ca } 移除
 * 均需后台登录。
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { readTextFile, saveTextFile, WATCHLIST_PATH } from "@/lib/storage";

interface WatchCoinEntry {
  ca: string;
  comment: string;
  addedAt: string;
}

function isAuthed(): boolean {
  return verifySessionToken(cookies().get(COOKIE_NAME)?.value);
}

async function readList(): Promise<WatchCoinEntry[]> {
  const raw = await readTextFile(WATCHLIST_PATH);
  if (!raw) return [];
  try {
    const json = JSON.parse(raw);
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

async function writeList(list: WatchCoinEntry[]): Promise<void> {
  await saveTextFile(WATCHLIST_PATH, JSON.stringify(list, null, 2) + "\n");
}

function isValidCa(ca: string): boolean {
  // EVM（0x+40hex）或 Solana base58，长度兜底
  if (!/^[A-Za-z0-9]{8,80}$/.test(ca)) return false;
  return true;
}

export async function GET() {
  if (!isAuthed()) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, coins: await readList() });
}

export async function POST(req: Request) {
  if (!isAuthed()) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }

  let ca = "";
  let comment = "";
  try {
    const body = await req.json();
    ca = String(body.ca ?? "").trim();
    comment = String(body.comment ?? "").trim();
  } catch {
    /* 下方统一校验 */
  }

  if (!isValidCa(ca)) {
    return NextResponse.json(
      { ok: false, message: "合约地址（CA）格式不正确" },
      { status: 400 }
    );
  }

  const list = await readList();
  if (list.some((c) => c.ca.toLowerCase() === ca.toLowerCase())) {
    return NextResponse.json(
      { ok: false, message: "该代币已在关注列表中" },
      { status: 409 }
    );
  }

  list.unshift({
    ca,
    comment,
    addedAt: new Date().toISOString().slice(0, 10),
  });

  try {
    await writeList(list);
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: `保存失败：${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAuthed()) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }

  let ca = "";
  try {
    const body = await req.json();
    ca = String(body.ca ?? "").trim();
  } catch {
    /* 下方统一校验 */
  }
  if (!ca) {
    return NextResponse.json({ ok: false, message: "缺少 ca" }, { status: 400 });
  }

  const list = await readList();
  const next = list.filter((c) => c.ca.toLowerCase() !== ca.toLowerCase());
  if (next.length === list.length) {
    return NextResponse.json({ ok: false, message: "未找到该代币" }, { status: 404 });
  }

  try {
    await writeList(next);
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: `保存失败：${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
