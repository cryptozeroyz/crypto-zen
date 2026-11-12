/**
 * not-found.tsx —— 自定义 404 页面
 * 大号数字 + 一句玩笑 + 两个文字链接。
 */

import Link from "next/link";
import Container from "@/components/Container";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center py-24 text-center sm:py-32">
      <p
        aria-hidden="true"
        className="text-7xl font-bold tracking-[-0.04em] text-accent dark:text-accent-mint sm:text-8xl"
      >
        404
      </p>
      <h1 className="mt-6 text-xl font-bold text-heading">
        这条链上什么都没有找到
      </h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
        你访问的页面可能已经被转移、删除，或者从一开始就不存在——就像 99%
        的 Meme 币一样。
      </p>

      <p className="mt-8 flex gap-6 text-sm">
        <Link
          href="/"
          className="font-medium text-accent underline-offset-4 hover:underline dark:text-accent-mint"
        >
          回到首页
        </Link>
        <Link
          href="/writing"
          className="font-medium text-accent underline-offset-4 hover:underline dark:text-accent-mint"
        >
          去看看文章
        </Link>
      </p>
    </Container>
  );
}
