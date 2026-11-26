/**
 * opengraph-image.tsx —— Track Record 详情 OG 分享图（Next.js 约定式文件）
 * 1200×630 PNG：币种 + 立场 + 判断时间 + 结论/表现 + 历史标注 + 站点署名。
 * satori + resvg（同文章 OG 方案），字体走本地预置/Google 回退。
 */

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readCallRecords } from "@/lib/calls-store";
import { safeTokenSlug } from "@/lib/coin-format";
import { siteConfig } from "@/lib/siteConfig";
import { loadOgFont, type OgFont } from "@/lib/og-fonts";

export const runtime = "nodejs";
export const alt = "Track Record · CryptoZen";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STANCE_COLOR: Record<string, string> = {
  watch: "#64748b",
  bullish: "#059669",
  bearish: "#d97706",
  avoid: "#dc2626",
};
const VERDICT_COLOR: Record<string, string> = {
  correct: "#059669",
  partly: "#d97706",
  wrong: "#dc2626",
  unresolved: "#64748b",
};
const STANCE_ZH: Record<string, string> = {
  watch: "观望", bullish: "看多", bearish: "看空", avoid: "避雷",
};
const VERDICT_ZH: Record<string, string> = {
  correct: "判断正确", partly: "部分正确", wrong: "判断错误", unresolved: "未结论",
};

export default async function OgImage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const records = await readCallRecords();
  const record = records
    .filter((r) => safeTokenSlug(r.call.symbol) === params.slug)
    .sort((a, b) => b.call.calledAt.localeCompare(a.call.calledAt))[0];
  if (!record) return new Response("Not Found", { status: 404 });

  const { call, outcome } = record;
  const [regular, bold] = await Promise.all([loadOgFont(400), loadOgFont(700)]);
  const fonts = [regular, bold].filter((f): f is OgFont => f !== null);
  if (fonts.length === 0) return new Response("Font unavailable", { status: 500 });

  const perf = outcome?.returnAtClose ?? null;
  const perfColor = perf !== null && perf >= 0 ? "#059669" : "#dc2626";

  const svg = await satori(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "linear-gradient(135deg, #2a2230 0%, #5c2a52 55%, #7a3a5f 100%)",
          color: "#f6f3ee",
          fontFamily: "NotoSansSC",
        }}
      >
        {/* 顶部：Track Record + 日期 */}
        <div style={{ position: "absolute", left: 72, top: 64, display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: "#ff8a70", letterSpacing: 2 }}>
            TRACK RECORD
          </span>
          <span style={{ fontSize: 22, marginLeft: 24, opacity: 0.75 }}>
            {call.calledAt.slice(0, 10)}
          </span>
        </div>

        {/* 右上：stance 徽章 */}
        <span
          style={{
            position: "absolute",
            top: 60,
            right: 72,
            fontSize: 24,
            fontWeight: 700,
            padding: "10px 26px",
            borderRadius: 12,
            background: STANCE_COLOR[call.stance] ?? "#64748b",
            color: "#fff",
          }}
        >
          {STANCE_ZH[call.stance] ?? call.stance}
        </span>

        {/* 主体：币名 + 叙事 */}
        <div style={{ position: "absolute", left: 72, top: 180, display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 30, opacity: 0.8 }}>
            ${call.symbol} · {call.chain}
          </span>
          <span style={{ fontSize: 76, fontWeight: 700, marginTop: 8, maxWidth: 1000 }}>
            {call.tokenName}
          </span>
          <span style={{ fontSize: 28, opacity: 0.85, marginTop: 20, maxWidth: 1000 }}>
            {call.narrative}
          </span>
        </div>

        {/* 底部：verdict/表现 或 进行中 */}
        <div style={{ position: "absolute", left: 72, bottom: 72, display: "flex", alignItems: "center" }}>
          {outcome ? (
            <>
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  padding: "10px 26px",
                  borderRadius: 12,
                  background: VERDICT_COLOR[outcome.verdict] ?? "#64748b",
                  color: "#fff",
                }}
              >
                {VERDICT_ZH[outcome.verdict] ?? outcome.verdict}
              </span>
              <span style={{ fontSize: 56, fontWeight: 700, marginLeft: 30, color: perfColor }}>
                {perf !== null && perf >= 0 ? "+" : ""}
                {perf}%
              </span>
            </>
          ) : (
            <span style={{ fontSize: 34, fontWeight: 700, color: "#ff8a70" }}>
              ◉ 进行中 · 判断以来全程留痕
            </span>
          )}
        </div>

        {/* 历史标注 */}
        {call.isHistorical && (
          <span
            style={{
              position: "absolute",
              bottom: 72,
              right: 72,
              fontSize: 20,
              padding: "8px 18px",
              borderRadius: 10,
              border: "2px dashed rgba(255,138,112,.8)",
              color: "#ffb3a0",
            }}
          >
            ⚑ 历史记录，非事前判断
          </span>
        )}

        {/* 站点署名 */}
        <span style={{ position: "absolute", bottom: 26, right: 72, fontSize: 18, opacity: 0.55, letterSpacing: 3 }}>
          {siteConfig.url.replace("https://", "").toUpperCase()}
        </span>
      </div>
    ),
    { ...size, fonts }
  );

  const png = new Resvg(svg, { fitTo: { mode: "width", value: size.width } })
    .render()
    .asPng();
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
}
