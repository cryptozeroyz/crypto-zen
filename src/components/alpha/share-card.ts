/**
 * share-card.ts —— Daily Alpha 分享签卡（Canvas 生成 PNG）
 * 竖版签卡：黑底金字 + 红色等级印章，与 /alpha 页视觉一致。
 */

import { TIERS, type AlphaFortune } from "@/lib/alpha";

const BG = "#0B0D12";
const CARD = "#151922";
const GOLD = "#D8B56D";
const WHITE = "#F5F5F5";
const MUTED = "#9298A5";
const SEAL = "#B83A35";

const SERIF = `Georgia, "Times New Roman", "Songti SC", "SimSun", serif`;
const SANS = `ui-sans-serif, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`;

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawAsterisk(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const a = (Math.PI / 3) * i;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}

/** 渲染签卡到 canvas（1000×1250） */
export function renderShareCard(
  fortune: AlphaFortune,
  dateKey: string,
  locale: "zh" | "en"
): HTMLCanvasElement {
  const W = 1000;
  const H = 1250;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const tier = TIERS[fortune.tier];
  const L = locale === "zh" ? fortune.zh : fortune.en;

  // 背景
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = CARD;
  ctx.fillRect(30, 30, W - 60, H - 60);

  // 双线金框
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(52, 52, W - 104, H - 104);
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.strokeRect(64, 64, W - 128, H - 128);
  ctx.globalAlpha = 1;

  // 顶部 ✦ + 眉题
  drawAsterisk(ctx, W / 2, 150, 20);
  ctx.textAlign = "center";
  ctx.fillStyle = GOLD;
  ctx.font = `600 30px ${SANS}`;
  ctx.fillText("D A I L Y   A L P H A", W / 2, 215);
  ctx.fillStyle = MUTED;
  ctx.font = `20px ${SANS}`;
  ctx.fillText("YOUR DAILY FORTUNE", W / 2, 250);

  // 印章（等级）
  const sealText = locale === "zh" ? tier.label : tier.en;
  const sealSize = locale === "zh" ? 64 : 96;
  ctx.save();
  ctx.translate(W / 2, 330);
  ctx.fillStyle = SEAL;
  const sw = sealText.length > 2 ? sealSize * 2.4 : sealSize * 1.6;
  ctx.beginPath();
  ctx.roundRect(-sw / 2, -sealSize / 2, sw, sealSize, 8);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.font = `700 ${locale === "zh" ? 34 : 22}px ${SANS}`;
  ctx.textBaseline = "middle";
  ctx.fillText(sealText, 0, 2);
  ctx.restore();
  ctx.textBaseline = "alphabetic";

  // 等级 + 编号 + 日期
  ctx.fillStyle = tier.color;
  ctx.font = `700 46px ${SERIF}`;
  ctx.fillText(locale === "zh" ? tier.zh : tier.en, W / 2, 440);
  ctx.fillStyle = MUTED;
  ctx.font = `18px ${SANS}`;
  ctx.fillText(
    `NO. ${String(fortune.id).padStart(3, "0")}  ·  ${dateKey}`,
    W / 2,
    478
  );

  // 签文标题 + 正文
  ctx.fillStyle = WHITE;
  ctx.font = `700 52px ${SERIF}`;
  ctx.fillText(L.title, W / 2, 590);

  ctx.font = `30px ${SANS}`;
  ctx.fillStyle = WHITE;
  const lines = wrapText(ctx, L.text, W - 280);
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, 660 + i * 48);
  });

  // 签解
  const noteTop = 660 + lines.length * 48 + 30;
  ctx.fillStyle = MUTED;
  ctx.font = `22px ${SANS}`;
  const noteLines = wrapText(ctx, L.note, W - 320).slice(0, 3);
  noteLines.forEach((line, i) => {
    ctx.fillText(line, W / 2, noteTop + i * 38);
  });

  // 底部
  ctx.fillStyle = GOLD;
  ctx.font = `600 24px ${SANS}`;
  ctx.fillText("CRYPTO ZEN", W / 2, H - 150);
  ctx.fillStyle = MUTED;
  ctx.font = `18px ${SANS}`;
  ctx.fillText("Come back tomorrow for your next Alpha.", W / 2, H - 112);
  ctx.font = `16px ${SANS}`;
  ctx.fillText("One day. One draw. One Alpha. WAGMI.", W / 2, H - 80);

  return canvas;
}

/** 触发下载 */
export function downloadShareCard(
  fortune: AlphaFortune,
  dateKey: string,
  locale: "zh" | "en"
): void {
  const canvas = renderShareCard(fortune, dateKey, locale);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `daily-alpha-${dateKey}.png`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, "image/png");
}
