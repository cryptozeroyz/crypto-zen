/**
 * opengraph-image.tsx —— 全站默认 OG 分享图（1200×630，satori）
 * [locale] 段约定式文件：首页及未自定义 OG 的子页自动继承；
 * 文章/投研详情有各自 opengraph-image 覆盖。
 */

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { loadOgFont, type OgFont } from "@/lib/og-fonts";
import { siteConfig } from "@/lib/siteConfig";

export const runtime = "nodejs";
export const alt = "CryptoZen · Memecoin Research";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale === "en" ? "en" : "zh";
  const [regular, bold] = await Promise.all([loadOgFont(400), loadOgFont(700)]);
  const fonts = [regular, bold].filter((f): f is OgFont => f !== null);
  if (fonts.length === 0) return new Response("Font unavailable", { status: 500 });

  const tagline =
    locale === "en"
      ? "Memecoin research and on-chain analysis. Every call, update and post-mortem is on the record."
      : "Memecoin 研究与链上分析。每一次判断、更新与复盘全部留痕，可查可验。";

  const svg = await satori(
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
        <div style={{ position: "absolute", left: 64, top: 64, width: 44, height: 44, borderLeft: "5px solid #ff5b3a", borderTop: "5px solid #ff5b3a" }} />
        <div style={{ position: "absolute", right: 64, bottom: 64, width: 44, height: 44, borderRight: "5px solid #ff5b3a", borderBottom: "5px solid #ff5b3a" }} />
        <div style={{ position: "absolute", left: 100, top: 130, display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 28, letterSpacing: 6, color: "#ff5b3a", fontWeight: 700 }}>TRACK RECORD · RESEARCH</span>
          <span style={{ fontSize: 96, fontWeight: 700, color: "#5c2a52", marginTop: 18 }}>CRYPTOZEN</span>
          <span style={{ fontSize: 30, color: "#2a2230", marginTop: 26, maxWidth: 940, lineHeight: 1.6 }}>{tagline}</span>
        </div>
        <div style={{ position: "absolute", left: 100, bottom: 96, display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 26, color: "#5c2a52", fontWeight: 700, letterSpacing: 2 }}>cryptozen.fun</span>
          <span style={{ fontSize: 26, color: "#ff5b3a", fontWeight: 700, marginLeft: 26 }}>@0CryptoZero</span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
  const png = new Resvg(svg, { fitTo: { mode: "width", value: size.width } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
