/**
 * random.ts —— 随机抽取工具（客户端专用，勿在服务端调用以避免缓存问题）
 * 后续的命令面板等功能会复用这里的函数。
 */

/**
 * 从文章 slug 列表里随机挑一个。
 * @param excludeSlug 要排除的 slug（例如当前正在阅读的文章）
 * @returns 选中的 slug；无可选项（空列表或排除后为空）时返回 null
 */
export function getRandomPostSlug(
  slugs: string[],
  excludeSlug?: string
): string | null {
  const pool = excludeSlug ? slugs.filter((s) => s !== excludeSlug) : [...slugs];
  if (pool.length === 0) return null;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
