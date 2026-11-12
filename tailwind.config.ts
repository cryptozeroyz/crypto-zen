import type { Config } from "tailwindcss";

/**
 * 设计系统说明（v3 —— 参考 Glow 的清爽研究站风格）：
 * - 亮色优先：浅冷灰底 #F7F8FA、深墨蓝标题 #192536、正文 #3B4654
 * - 强调色：深青 #176F68（按钮/链接）、薄荷 #81D8D0（装饰图形）
 * - 大标题用厚重无衬线粗体，正文系统无衬线，衬线仅作点缀
 * - 暗色：近黑 #141719 + 同色系青绿，通过 .dark class 切换（CSS 变量驱动）
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
        /** 品牌强调色（固定，不随主题变化） */
        accent: {
          DEFAULT: "#176f68",
          deep: "#0f4f4a",
          mint: "#81d8d0",
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
