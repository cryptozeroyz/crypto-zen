/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // resvg-js 是原生模块（.node），不参与打包，运行时按需加载
    serverComponentsExternalPackages: ["@resvg/resvg-js"],
  },
};

export default nextConfig;
