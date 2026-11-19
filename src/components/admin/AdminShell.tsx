"use client";

/**
 * AdminShell.tsx —— 后台全局顶栏
 * 所有后台页面（/admin/*）共享：品牌区 / 主导航（文章·投研·链接收藏）/
 * 新建文章主按钮 / 退出登录。当前菜单珊瑚橙下划线，登录页自动隐藏。
 * 解决旧版「进入新建/编辑页后导航消失、只能浏览器回退」的问题。
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { label: "文章", href: "/admin", match: (p: string) => p === "/admin" || p.startsWith("/admin/edit") || p.startsWith("/admin/new") },
  { label: "投研", href: "/admin/research", match: (p: string) => p.startsWith("/admin/research") || p.startsWith("/admin/watchlist") || p.startsWith("/admin/journal") },
  { label: "链接收藏", href: "/admin/links", match: (p: string) => p.startsWith("/admin/links") },
] as const;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    /* 登录页保持极简，不显示后台导航 */
    return <main id="main-content">{children}</main>;
  }

  return (
    <>
      <header className="adm-bar">
        <div className="adm-in">
          <Link href="/admin" className="adm-brand">
            Crypto Zen<span className="adm-brand-tag">后台</span>
          </Link>

          <nav className="adm-nav" aria-label="后台导航">
            {NAV.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={it.match(pathname) ? "on" : ""}
              >
                {it.label}
              </Link>
            ))}
          </nav>

          <div className="adm-tools">
            <Link
              href="/admin/new"
              className="rounded-[6px_10px_6px_12px] bg-accent px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px hover:bg-accent-deep"
            >
              + 新建文章
            </Link>
            <Logout />
          </div>
        </div>
      </header>
      {/* pt 为固定顶栏预留空间 */}
      <main id="main-content" className="pt-[56px]">
        {children}
      </main>
    </>
  );
}

function Logout() {
  const onClick = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      window.location.href = "/admin/login";
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-line px-3.5 py-2 text-sm text-muted transition-colors hover:border-heading hover:text-heading"
    >
      退出
    </button>
  );
}
