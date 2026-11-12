/**
 * cover-template.tsx —— 自动文章封面的 satori 模板
 * 版式与 ArticleCard 的手写降级封面一致：
 * 分类渐变底 + 左上分类徽章 + 右上日期 + 左下大标题 + 右下星芒水印。
 * 注意 satori 布局限制：根节点不设 padding，全部绝对定位。
 */

import satori from "satori";
import { loadOgFont, type OgFont } from "@/lib/og-fonts";

export const COVER_SIZE = { width: 1200, height: 675 };

/** 分类 → 渐变配色（研究=品牌青绿，随笔=蓝灰，运营=雾紫，均低饱和） */
const GRADIENTS: Record<string, [string, string]> = {
  research: ["#176f68", "#0d3f3b"],
  essay: ["#2b4c63", "#17293a"],
  ops: ["#5b4a6b", "#382d44"],
};

interface CoverInput {
  title: string;
  category: string;
  date: string;
  /** 分类的本地化标签（如「研究报告」） */
  label: string;
}

export async function renderCoverSvg(input: CoverInput): Promise<string> {
  const [regular, bold] = await Promise.all([loadOgFont(400), loadOgFont(700)]);
  const fonts = [regular, bold].filter((f): f is OgFont => f !== null);
  if (fonts.length === 0) throw new Error("字体不可用");

  const [c1, c2] = GRADIENTS[input.category] ?? GRADIENTS.essay;

  return satori(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
          fontFamily: "NotoSansSC",
        }}
      >
        {/* 左上：分类徽章 */}
        <div
          style={{
            position: "absolute",
            left: 64,
            top: 56,
            display: "flex",
            background: "rgba(255,255,255,0.16)",
            borderRadius: 999,
            padding: "10px 26px",
            color: "#ffffff",
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          {input.label}
        </div>

        {/* 右上：日期 */}
        <div
          style={{
            position: "absolute",
            right: 64,
            top: 68,
            color: "rgba(255,255,255,0.65)",
            fontSize: 24,
          }}
        >
          {input.date}
        </div>

        {/* 左下：标题 */}
        <div
          style={{
            position: "absolute",
            left: 64,
            bottom: 130,
            width: 900,
            display: "flex",
            color: "#ffffff",
            fontSize: 66,
            fontWeight: 700,
            lineHeight: 1.3,
          }}
        >
          {input.title}
        </div>

        {/* 底部：品牌字 */}
        <div
          style={{
            position: "absolute",
            left: 64,
            bottom: 62,
            color: "rgba(255,255,255,0.55)",
            fontSize: 22,
            letterSpacing: 8,
          }}
        >
          CRYPTO ZEN
        </div>

        {/* 右下：星芒水印 */}
        <svg
          viewBox="0 0 200 200"
          style={{
            position: "absolute",
            right: 44,
            bottom: 36,
            width: 150,
            height: 150,
            opacity: 0.2,
          }}
        >
          <g
            stroke="#ffffff"
            strokeWidth="14"
            strokeLinecap="round"
            transform="translate(100,100)"
          >
            <line y1="-78" y2="78" />
            <line y1="-78" y2="78" transform="rotate(36)" opacity="0.55" />
            <line y1="-78" y2="78" transform="rotate(72)" />
            <line y1="-78" y2="78" transform="rotate(108)" opacity="0.55" />
            <line y1="-78" y2="78" transform="rotate(144)" />
          </g>
        </svg>
      </div>
    ),
    { ...COVER_SIZE, fonts }
  );
}
