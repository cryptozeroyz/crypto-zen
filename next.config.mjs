/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 独立运行模式：构建产物自带最小化 node_modules 与 server.js，
  // 可直接在普通 Linux 服务器上用 PM2/systemd 运行（自托管 VPS 用），Vercel 部署不受影响。
  output: "standalone",
  experimental: {
    // resvg-js 是原生模块（.node），不参与打包，运行时按需加载
    serverComponentsExternalPackages: ["@resvg/resvg-js"],
  },
  async redirects() {
    /* 文章 slug 关键词化后的旧链接 301（SEO 权重传递），新增重命名时同步追加 */
    const renamed = [
      ["variationalperps", "variational-perp-dex-research"],
      ["morifinance", "mori-finance-research"],
      ["singularity", "singularity-project-research"],
      ["ringsrun", "ringsrun-project-report"],
      ["vibecoding", "ai-vibecoding-personal-website"],
      ["baske", "basket-launchpad-token-research"],
    ];
    return renamed.flatMap(([oldSlug, newSlug]) => [
      { source: `/zh/writing/${oldSlug}`, destination: `/zh/writing/${newSlug}`, permanent: true },
      { source: `/en/writing/${oldSlug}`, destination: `/en/writing/${newSlug}`, permanent: true },
    ]);
  },
};

export default nextConfig;
