/**
 * POST /api/admin/upload —— 图片上传（multipart/form-data，字段名 file）
 * 校验类型（png/jpg/webp/gif/svg）与大小（≤5MB），
 * 保存到 public/uploads/ 并返回可访问路径。需要后台登录。
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { saveUpload } from "@/lib/storage";

const ALLOWED: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: Request) {
  if (!verifySessionToken(cookies().get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }

  let buffer: Buffer | null = null;
  let ext = "";
  let mime = "";

  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      // base64 上传（Word 导入内嵌图片等场景）
      const body = await req.json();
      const dataBase64 = String(body.dataBase64 ?? "");
      mime = String(body.contentType ?? "image/png");
      ext = ALLOWED[mime] ?? ".png";
      buffer = Buffer.from(dataBase64, "base64");
    } else {
      // multipart 表单上传（编辑器/封面的文件选择）
      const form = await req.formData();
      const f = form.get("file");
      if (!(f instanceof File)) throw new Error("缺少文件");
      mime = f.type;
      ext = ALLOWED[mime] ?? "";
      if (!ext) {
        return NextResponse.json(
          { ok: false, message: "仅支持 PNG / JPG / WebP / GIF / SVG 图片" },
          { status: 400 }
        );
      }
      buffer = Buffer.from(await f.arrayBuffer());
    }
  } catch {
    return NextResponse.json({ ok: false, message: "缺少文件或格式不正确" }, { status: 400 });
  }

  if (!buffer || buffer.length === 0) {
    return NextResponse.json({ ok: false, message: "文件内容为空" }, { status: 400 });
  }
  if (buffer.length > MAX_SIZE) {
    return NextResponse.json(
      { ok: false, message: "图片不能超过 5MB" },
      { status: 400 }
    );
  }

  // 随机文件名，避免覆盖与路径注入
  const filename = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}${ext}`;

  try {
    const url = await saveUpload(filename, buffer);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: `上传失败：${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }
}
