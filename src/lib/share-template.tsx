/**
 * share-template.tsx —— Track Record 分享卡 satori 模板（1080×1350 PNG）
 * 手绘风：纸底、衬线紫标题、stance 徽章、涨绿跌红大数字、判断依据（超 4 行截断省略）、
 * 底部 cryptozen.fun + @0CryptoZero。与文章 OG 同管线（satori + resvg + 本地字体）。
 */

import satori from "satori";
import { loadOgFont, type OgFont } from "@/lib/og-fonts";

export const SHARE_SIZE = { width: 1080, height: 1350 };

export interface ShareInput {
  tokenName: string;
  symbol: string;
  chain: string;
  /** 已本地化的立场文案（看多/观望/…） */
  stanceLabel: string;
  stance: "watch" | "bullish" | "bearish" | "avoid";
  priceNow: number;
  changePct: number; // 判断以来 %
  calledAt: string; // 已格式化
  priceAtCall: number;
  thesis: string;
  avatarUrl?: string;
  historicalNote?: string; // 历史记录提示
}

const STANCE_COLOR: Record<string, string> = {
  bullish: "#059669",
  bearish: "#d97706",
  watch: "#64748b",
  avoid: "#dc2626",
};

/** 按“显示宽度单位”截断：CJK=1、拉丁≈0.55；超 maxUnits 加省略号 */
export function truncateUnits(text: string, maxUnits: number): string {
  let units = 0;
  let out = "";
  for (const ch of text) {
    const u = /[⺀-鿿豈-﫿＀-￯]/.test(ch) ? 1 : 0.55;
    if (units + u > maxUnits) return `${out.trimEnd()}…`;
    units += u;
    out += ch;
  }
  return out;
}

const fmtPrice = (p: number) =>
  p >= 1
    ? `$${p.toFixed(2)}`
    : p >= 0.01
      ? `$${p.toFixed(4)}`
      : `$${p.toPrecision(3)}`;

export async function renderShareSvg(input: ShareInput): Promise<string> {
  const [regular, bold] = await Promise.all([loadOgFont(400), loadOgFont(700)]);
  const fonts = [regular, bold].filter((f): f is OgFont => f !== null);
  if (fonts.length === 0) throw new Error("字体不可用");

  const up = input.changePct >= 0;
  const changeColor = up ? "#059669" : "#dc2626";
  // 判断依据：30px 字体、内容宽约 920px → CJK 每行约 30 字，4 行 ≈ 120 单位
  const thesis = truncateUnits(input.thesis.replace(/\s+/g, " ").trim(), 118);
  const initial = (input.symbol || "?").slice(0, 1).toUpperCase();

  return satori(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#f6f3ee",
          color: "#2a2230",
          fontFamily: "NotoSansSC",
        }}
      >
        {/* 手绘角标 */}
        <div style={{ position: "absolute", left: 48, top: 48, width: 44, height: 44, borderLeft: "5px solid #ff5b3a", borderTop: "5px solid #ff5b3a" }} />
        <div style={{ position: "absolute", right: 48, bottom: 48, width: 44, height: 44, borderRight: "5px solid #ff5b3a", borderBottom: "5px solid #ff5b3a" }} />

        {/* 顶部：TRACK RECORD */}
        <div style={{ position: "absolute", left: 110, top: 62, fontSize: 24, letterSpacing: 6, color: "#ff5b3a", fontWeight: 700 }}>
          TRACK RECORD
        </div>
        <div style={{ position: "absolute", right: 110, top: 60, fontSize: 22, color: "#857a8a" }}>
          {input.calledAt}
        </div>

        {/* 头部：头像 + 名称 */}
        <div style={{ position: "absolute", left: 110, top: 150, display: "flex", alignItems: "center" }}>
          {input.avatarUrl ? (
            <img
              src={input.avatarUrl}
              style={{ width: 108, height: 108, borderRadius: 54, border: "3px solid #2a223033" }}
            />
          ) : (
            <div
              style={{
                width: 108,
                height: 108,
                borderRadius: 54,
                background: "#5c2a52",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 44,
                fontWeight: 700,
              }}
            >
              {initial}
            </div>
          )}
          <div style={{ marginLeft: 28, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 52, fontWeight: 700, color: "#5c2a52" }}>{input.tokenName}</span>
              <span
                style={{
                  marginLeft: 22,
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#fff",
                  background: STANCE_COLOR[input.stance] ?? "#64748b",
                  padding: "6px 20px",
                  borderRadius: 999,
                }}
              >
                {input.stanceLabel}
              </span>
            </div>
            <div style={{ marginTop: 10, fontSize: 26, color: "#857a8a" }}>
              ${input.symbol} · {input.chain}
              {input.historicalNote ? `  ·  ${input.historicalNote}` : ""}
            </div>
          </div>
        </div>

        {/* 大数字：现价 + 判断以来 */}
        <div style={{ position: "absolute", left: 110, top: 400, display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 24, color: "#857a8a" }}>当前价格</span>
          <span style={{ fontSize: 96, fontWeight: 700, color: "#2a2230", lineHeight: 1.15 }}>{fmtPrice(input.priceNow)}</span>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontSize: 62, fontWeight: 700, color: changeColor }}>
              {up ? "+" : ""}
              {input.changePct.toFixed(1)}%
            </span>
            <span style={{ marginLeft: 18, fontSize: 26, color: "#857a8a" }}>判断以来</span>
          </div>
        </div>

        {/* 判断信息条 */}
        <div style={{ position: "absolute", left: 110, right: 110, top: 690, display: "flex", borderTop: "2px dashed #2a223033", borderBottom: "2px dashed #2a223033", padding: "22px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span style={{ fontSize: 22, color: "#857a8a" }}>判断时价格</span>
            <span style={{ fontSize: 34, fontWeight: 700, fontFamily: "NotoSansSC" }}>{fmtPrice(input.priceAtCall)}</span>
          </div>
        </div>

        {/* 判断依据 */}
        <div style={{ position: "absolute", left: 110, right: 110, top: 800 }}>
          <span style={{ fontSize: 22, letterSpacing: 4, color: "#ff5b3a", fontWeight: 700 }}>◉ 判断依据 THESIS</span>
          <div style={{ marginTop: 18, fontSize: 30, lineHeight: 1.65, color: "#2a2230" }}>{thesis}</div>
        </div>

        {/* 底部 */}
        <div style={{ position: "absolute", left: 110, right: 110, bottom: 110, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 26, color: "#5c2a52", fontWeight: 700, letterSpacing: 2 }}>cryptozen.fun</span>
          <span style={{ fontSize: 26, color: "#ff5b3a", fontWeight: 700 }}>@0CryptoZero</span>
        </div>
      </div>
    ),
    { ...SHARE_SIZE, fonts }
  );
}
