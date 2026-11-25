/**
 * /api/admin/[...path] —— 后台 API 的统一入口（单函数）
 *
 * Vercel Hobby 限制每个部署 12 个 Serverless Function，
 * 原 7 个独立 admin 路由合并为这一个 catch-all 函数。
 * 对外路径保持不变：
 *   POST /api/admin/login
 *   POST /api/admin/logout
 *   GET|POST /api/admin/posts      PUT|DELETE /api/admin/posts/[slug]
 *   POST /api/admin/translate
 *   POST /api/admin/upload
 *   GET|POST|DELETE /api/admin/watchlist
 */

import { NextResponse } from "next/server";
import * as H from "@/lib/adminHandlers";

type Ctx = { params: { path: string[] } };

const NOT_FOUND = () =>
  NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });

export async function GET(_req: Request, { params }: Ctx) {
  const [a, b] = params.path ?? [];
  if (a === "posts" && !b) return H.postsGET();
  if (a === "watchlist" && !b) return H.watchlistGET();
  if (a === "links" && !b) return H.linksGET();
  if (a === "journal" && !b) return H.journalGET();
  if (a === "calls" && !b) return H.callsGET();
  return NOT_FOUND();
}

export async function POST(req: Request, { params }: Ctx) {
  const [a, b] = params.path ?? [];
  switch (a) {
    case "login":
      return H.loginPOST(req);
    case "logout":
      return H.logoutPOST(req);
    case "translate":
      return H.translatePOST(req);
    case "upload":
      return H.uploadPOST(req);
    case "watchlist":
      if (b === "events") return H.watchlistEventPOST(req);
      if (b === "tags") return H.tagsPOST(req);
      return H.watchlistPOST(req);
    case "journal":
      return H.journalPOST(req);
    case "calls":
      if (b === "update") return H.callsUpdatePOST(req);
      if (b === "close") return H.callsClosePOST(req);
      if (b === "disclosure") return H.callsDisclosurePOST(req);
      if (b === "stance") return H.callsStancePOST(req);
      return H.callsPOST(req);
    case "ai-report":
      return H.aiReportPOST(req);
    case "links":
      return H.linksPOST(req);
    case "posts":
      return b ? H.postPUT(b, req) : H.postsPOST(req);
    default:
      return NOT_FOUND();
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  const [a, b] = params.path ?? [];
  if (a === "posts" && b) return H.postPUT(b, req);
  return NOT_FOUND();
}

export async function DELETE(req: Request, { params }: Ctx) {
  const [a, b] = params.path ?? [];
  if (a === "posts" && b) return H.postDELETE(b);
  if (a === "watchlist" && !b) return H.watchlistDELETE(req);
  if (a === "journal" && !b) return H.journalDELETE(req);
  if (a === "links" && !b) return H.linksDELETE(req);
  if (a === "calls" && !b) return H.callsDELETE(req);
  return NOT_FOUND();
}
