"use client";

/**
 * CoinAvatar.tsx —— 代币头像
 * 优先展示 DexScreener 的头像（可能是 IPFS，存在加载失败的情况），
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
      {!failed && imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
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
