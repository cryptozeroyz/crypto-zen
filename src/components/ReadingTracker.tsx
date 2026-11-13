"use client";

/**
 * ReadingTracker.tsx —— 阅读记录器（无 UI）
 * 文章页挂载后把当前 slug 写入 localStorage 阅读历史。
 */

import { useEffect } from "react";
import { recordRead } from "@/lib/reading";

export default function ReadingTracker({ slug }: { slug: string }) {
  useEffect(() => {
    recordRead(slug);
  }, [slug]);

  return null;
}
