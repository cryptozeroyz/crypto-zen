/**
 * Container.tsx —— 全站统一的内容宽度容器
 * site：1080px 版心（Hero / 卡片列表等大多数页面）
 * content：680px 窄栏（文章阅读页）
 */

interface ContainerProps {
  children: React.ReactNode;
  size?: "site" | "content";
  className?: string;
}

export default function Container({
  children,
  size = "site",
  className = "",
}: ContainerProps) {
  const width = size === "content" ? "max-w-content" : "max-w-site";
  return (
    <div className={`mx-auto w-full ${width} px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}
