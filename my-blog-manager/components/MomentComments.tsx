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

interface MomentCommentsProps {
  id: string; // 说说的专属 ID，用于区分各自的评论区
}

/** 与 Comments.tsx 保持一致的纸张主题映射 */
function resolveGiscusTheme(isDark: boolean) {
  return isDark ? 'dark_dimmed' : 'light';
}

export default function MomentComments({ id }: MomentCommentsProps) {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const configured = Boolean(giscusConfig.repo && giscusConfig.repoId && giscusConfig.categoryId);

  if (!configured) return null;

  return (
    <div className="w-full">
      {mounted && (
        <Giscus
          repo={giscusConfig.repo}
          repoId={giscusConfig.repoId}
          category={giscusConfig.category}
          categoryId={giscusConfig.categoryId}
          // 用 specific + term 让每条说说拥有独立讨论串
          mapping="specific"
          term={id}
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
