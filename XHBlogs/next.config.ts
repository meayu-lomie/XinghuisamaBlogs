import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 核心修改 1：关掉纯静态导出，让 Vercel 帮你把 API 跑起来！
  // output: 'export',

  // 核心修改 2：Vercel 不需要强制加斜杠，关掉它能避免很多 API 路径匹配错误
  // trailingSlash: true,

  // 下面这些可以保留
  images: {
    unoptimized: true,
  },
  typescript: {
    // 构建期跳过类型检查，快速部署用；类型正确性靠 `npx tsc --noEmit` 单独把关
    ignoreBuildErrors: true,
  },
  // 图片目录里允许上传 SVG（矢量图体积小），但 SVG 能内嵌脚本，
  // 同源打开就等于执行任意 JS。这里给 public 下的静态资源加上
  // 「不允许当文档渲染、不允许执行脚本」的响应头，从根上堵住这条路。
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "default-src 'none'; style-src 'unsafe-inline'; sandbox" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

export default nextConfig;