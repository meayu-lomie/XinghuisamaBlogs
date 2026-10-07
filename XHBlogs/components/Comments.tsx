"use client";

import { useEffect, useState } from 'react';
import Giscus from '@giscus/react';
import { useTheme } from './ThemeProvider';
import { siteConfig } from '../siteConfig';

const giscusConfig = siteConfig.giscusConfig as {
  repo: `${string}/${string}`;
  repoId: string;
  category: string;
  categoryId: string;
};

/**
 * 按当前纸张主题映射到 Giscus 内置主题。
 * Giscus 支持自定义主题 URL，但内置主题在暗色下对比度更可靠，
 * 因此这里只用内置主题，避免额外维护一份 CSS。
 */
function resolveGiscusTheme(isDark: boolean) {
  return isDark ? 'dark_dimmed' : 'light';
}

export default function Comments() {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Giscus 是客户端 iframe，挂载后再渲染，避免 SSR 期间访问 window
  useEffect(() => setMounted(true), []);

  // 配置未填写时给出明确提示，而不是渲染一个空白区域
  const configured = Boolean(giscusConfig.repo && giscusConfig.repoId && giscusConfig.categoryId);

  if (!configured) {
    return (
      <div className="w-full mt-16 pt-6 border-t" style={{ borderColor: 'var(--rule)' }}>
        <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>
          评论未配置：请在 siteConfig.ts 的 giscusConfig 中填写 repo、repoId 与 categoryId。
        </p>
      </div>
    );
  }

  return (
    <div className="w-full mt-16 pt-6 border-t" style={{ borderColor: 'var(--rule)' }}>
      {mounted && (
        <Giscus
          repo={giscusConfig.repo}
          repoId={giscusConfig.repoId}
          category={giscusConfig.category}
          categoryId={giscusConfig.categoryId}
          mapping="pathname"
          strict="0"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="top"
          theme={resolveGiscusTheme(isDark)}
          lang="zh-CN"
          loading="lazy"
        />
      )}
    </div>
  );
}
