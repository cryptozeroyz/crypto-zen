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
};

export default nextConfig;
