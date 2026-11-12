/**
 * coin-format.ts —— 代币展示的纯工具函数（客户端/服务端通用，无 fs 依赖）
 */

/** 价格格式化：小额用科学记数法简写，大额保留位数 */
export function formatPrice(price: number): string {
  if (!price || price <= 0) return "—";
  if (price < 0.000001) return `$${price.toExponential(2)}`;
  if (price < 0.01) return `$${price.toPrecision(3)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
}

/** 由 CA 生成稳定的头像底色（用于图片加载失败时的字母头像） */
export function avatarHue(ca: string): number {
  let h = 0;
  for (let i = 0; i < ca.length; i++) h = (h * 31 + ca.charCodeAt(i)) % 360;
  return h;
}
