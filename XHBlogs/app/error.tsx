'use client';

/**
 * 路由级错误边界。
 *
 * 页面在渲染/取数据阶段抛异常时会落到这里（例如某篇内容的 frontmatter
 * 解析失败）。默认的 Next.js 错误页是英文的，这里给一个中文的、
 * 可重试的兜底页面。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen relative flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink-faint)] mb-4">
          出错了
        </p>
        <h1 className="text-3xl md:text-4xl font-black text-[var(--ink)] mb-4">
          这一页没能打开
        </h1>
        <p className="text-sm text-[var(--ink-soft)] leading-relaxed mb-3">
          页面在加载时遇到了问题，可以重试一次。
        </p>
        {error?.message && (
          <p className="text-xs text-[var(--ink-faint)] font-mono break-all mb-8 px-3 py-2 rounded-xl bg-[var(--code-bg)] text-[var(--code-fg)]">
            {error.message}
          </p>
        )}
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-2xl bg-indigo-500 text-white text-sm font-black shadow-sm hover:bg-indigo-600 transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  );
}
