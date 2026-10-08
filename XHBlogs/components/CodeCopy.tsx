"use client";

import { useEffect } from 'react';

/**
 * 为文章内的代码块注入右上角「复制」按钮。
 *
 * 正文 HTML 由服务端 dangerouslySetInnerHTML 渲染，无法直接插入 React 节点，
 * 因此挂载后扫描容器内所有 <pre> 动态注入按钮；按钮样式用内联样式，
 * 避免 Tailwind 在构建时清掉动态拼接的类名。
 */
export default function CodeCopy({ containerId }: { containerId: string }) {
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const cleanups: (() => void)[] = [];

    container.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector('.code-copy-btn')) return;
      pre.style.position = 'relative';

      const btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.textContent = '复制';
      Object.assign(btn.style, {
        position: 'absolute',
        top: '0.5rem',
        right: '0.5rem',
        padding: '0.15rem 0.6rem',
        fontSize: '11px',
        fontWeight: '700',
        lineHeight: '1.4',
        color: 'var(--code-fg)',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        zIndex: '10',
        transition: 'all .2s',
      } as CSSStyleDeclaration);

      const onClick = async () => {
        try {
          await navigator.clipboard.writeText(pre.innerText || '');
          btn.textContent = '已复制';
        } catch {
          btn.textContent = '复制失败';
        }
        setTimeout(() => { btn.textContent = '复制'; }, 1500);
      };
      btn.addEventListener('click', onClick);
      pre.appendChild(btn);
      cleanups.push(() => {
        btn.removeEventListener('click', onClick);
        btn.remove();
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [containerId]);

  return null;
}
