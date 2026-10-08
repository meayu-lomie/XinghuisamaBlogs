'use client';

/**
 * 路由级错误边界。
 *
 * 管理端页面会读博客目录里的文件，路径没配好、文件被占用等情况都可能
 * 抛异常。这里给一个中文兜底页，并把错误信息露出来方便排查。
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
      <div className="max-w-lg w-full text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink-faint)] mb-4">
          出错了
        </p>
        <h1 className="text-3xl font-black text-[var(--ink)] mb-4">
          这个页面没能加载
        </h1>
        <p className="text-sm text-[var(--ink-soft)] leading-relaxed mb-3">
          常见原因：博客物理路径未配置或已变动、内容文件读取失败。
        </p>
        {error?.message && (
          <p className="text-xs font-mono break-all mb-8 px-3 py-2 rounded-xl bg-[var(--code-bg)] text-[var(--code-fg)] text-left">
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
