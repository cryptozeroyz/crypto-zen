/**
 * middleware.ts —— 语言前缀重定向
 *
 * 公开页面都以 /zh 或 /en 开头。访问不带前缀的路径时：
 * 优先 cookie（cz_locale），其次 Accept-Language，默认中文。
 * /admin 与 /api 不受影响。
 */

import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "cz_locale";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 后台与 API 不走路由前缀
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const first = pathname.split("/")[1];
  if (first === "zh" || first === "en") return NextResponse.next();

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const acceptLang = (req.headers.get("accept-language") ?? "").toLowerCase();
  const locale =
    cookie === "zh" || cookie === "en"
      ? cookie
      : !acceptLang || acceptLang.startsWith("zh")
        ? "zh"
        : "en";

  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // 排除 api、admin、_next 与带扩展名的静态资源
  matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
};
