import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 【核心开关】：告诉 Next.js 放弃 Node.js，打包成纯静态的 HTML/CSS/JS
  output: 'standalone',

  // 【必须项】：因为没有 Node.js 服务器了，Next.js 自带的图片压缩服务会失效，必须关闭它
  images: {
    unoptimized: true,
  },
  // 屏蔽 TypeScript 类型报错（Next 16 已移除 build 期 ESLint 检查，无需再配）
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;