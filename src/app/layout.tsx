/**
 * layout.tsx —— 根布局（最简 HTML 外壳）
 * 负责：主题初始化脚本、跳转链接。<html lang> 固定中文，
 * 公开站点的 Header/Footer 在 [locale]/layout.tsx 中按语言渲染，后台页面保持精简。
 */

import type { Viewport } from "next";
import "./globals.css";

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

/* 移动端浏览器主题色：亮暗分别适配 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#141719" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col">
        {/* 主题初始化：必须在首个可见元素之前执行，避免暗色用户看到白屏闪烁 */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />

        {/* 无障碍：跳转链接，仅在键盘聚焦时可见 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-focus focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          跳到主要内容
        </a>

        {children}
      </body>
    </html>
  );
}
