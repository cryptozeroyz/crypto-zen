/**
 * DexChart.tsx —— DexScreener 嵌入式 K 线
 * 传入交易对页面链接（如 https://dexscreener.com/ethereum/0x…），
 * 自动拼接 embed 参数以 iframe 嵌入。数据来自 DexScreener 第三方服务。
 */

interface DexChartProps {
  url: string;
  title: string;
  liveLabel: string;
}

export default function DexChart({ url, title, liveLabel }: DexChartProps) {
  const embedUrl = url.includes("embed=1")
    ? url
    : `${url}${url.includes("?") ? "&" : "?"}embed=1&theme=light&chartTheme=light&trades=0`;

  return (
    <figure className="my-8 overflow-hidden rounded-2xl border border-line bg-card">
      <figcaption className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <p className="text-xs text-muted">{liveLabel}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-accent transition-colors hover:underline dark:text-accent-mint"
        >
          DexScreener ↗
        </a>
      </figcaption>
      <iframe
        src={embedUrl}
        title={`${title} 的 K 线图`}
        loading="lazy"
        className="h-[440px] w-full"
      />
    </figure>
  );
}
