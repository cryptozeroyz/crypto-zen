"use client";

/**
 * CoinAvatar.tsx —— 代币头像
 * DexScreener 的头像常托管在 IPFS/CDN，国内直连失败，
 * 这里统一走本站 /api/market?type=img 代理（首尔服务器中转 + 7 天缓存）。
 * 加载失败时降级为「符号首字母 + CA 生成的稳定底色」。
 */

import { useState } from "react";

interface CoinAvatarProps {
  imageUrl?: string;
  symbol: string;
  hue: number;
  size?: number;
}

export default function CoinAvatar({ imageUrl, symbol, hue, size = 48 }: CoinAvatarProps) {
  const [failed, setFailed] = useState(false);

  const letter = (symbol || "?").slice(0, 1).toUpperCase();
  // 第三方图片经本站代理；本站自身的图片直接用原始路径
  const proxied = imageUrl
    ? imageUrl.startsWith("/")
      ? imageUrl
      : `/api/market?type=img&url=${encodeURIComponent(imageUrl)}`
    : undefined;

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 45% 88%)`,
        color: `hsl(${hue} 55% 32%)`,
        fontSize: size * 0.42,
        fontWeight: 700,
      }}
      aria-hidden="true"
    >
      {!failed && proxied ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={proxied}
          alt={`${symbol} logo`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        letter
      )}
    </span>
  );
}
