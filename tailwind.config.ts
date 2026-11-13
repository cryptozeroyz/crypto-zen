import type { Config } from "tailwindcss";

/**
 * 设计系统说明（v4 —— 蓝色系动态主题）：
 * - 亮色：浅蓝灰底 #f5f8fc、深墨蓝标题、品牌蓝 #2563eb 强调
 * - 暗色：深夜蓝底 #0a1424（深蓝不再是非黑），同族蓝色提亮
 * - 主题随系统/时间自动切换，也可手动锁定浅色或深色（globals.css 的 .dark class）
 * - 字体：无衬线正文，衬线仅作点缀
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /** 以下颜色全部是 CSS 变量，定义在 globals.css，随亮暗主题切换 */
        paper: "var(--bg)",
        card: "var(--card)",
        ink: "var(--text)",
        heading: "var(--heading)",
        muted: "var(--muted)",
        line: "var(--line)",
        codebg: "var(--code-bg)",
        /** 品牌强调色（蓝色系，固定） */
        accent: {
          DEFAULT: "#2563eb",
          deep: "#1d4ed8",
          mint: "#38bdf8",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          "sans-serif",
        ],
        serif: [
          '"Iowan Old Style"',
          '"Palatino Linotype"',
          "Palatino",
          "Georgia",
          '"Songti SC"',
          '"Noto Serif SC"',
          "SimSun",
          "serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          '"SF Mono"',
          "Menlo",
          "Consolas",
          '"Liberation Mono"',
          "monospace",
        ],
      },
      maxWidth: {
        /** 文章阅读宽度 */
        content: "680px",
        /** 全站版心宽度（Hero / 卡片列表） */
        site: "1080px",
      },
      keyframes: {
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "spin-slow": "spin-slow 90s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
