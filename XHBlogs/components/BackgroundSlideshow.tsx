"use client";

import { useEffect, useState } from 'react';

/**
 * 全站背景轮播。
 *
 * 挂在 layout 里，固定在最底层（z-0，在纸张纹理之下、页面内容之上），
 * 按固定间隔淡入淡出切换 siteConfig.bgImages 里的图片。
 *
 * 只在「视觉背景配置」的开关打开、且至少有一张图时才渲染；
 * 关闭时返回 null，页面回到纯纸张底色。
 * 图片数量为 1 时不做轮播，只静态展示。
 */
export default function BackgroundSlideshow({
  images,
  intervalMs = 8000,
}: {
  images: string[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [images.length, intervalMs]);

  if (!images || images.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
    >
      {images.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt=""
          loading={i === 0 ? 'eager' : 'lazy'}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out"
          style={{ opacity: i === index ? 0.22 : 0 }}
        />
      ))}

      {/* 压一层纸张色，保证文字始终可读（深浅主题都成立） */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'var(--paper)', opacity: 0.55 }}
      />
    </div>
  );
}
