import Link from 'next/link';

/**
 * 管理端 404。
 *
 * 控制台只有固定几个页面，走到这里基本是手改地址或旧链接。
 */
export default function NotFound() {
  return (
    <div className="min-h-screen relative flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink-faint)] mb-4">
          404 · 页面不存在
        </p>
        <h1 className="text-3xl font-black text-[var(--ink)] mb-4">
          控制台里没有这一页
        </h1>
        <p className="text-sm text-[var(--ink-soft)] leading-relaxed mb-8">
          请从上方导航进入需要的功能。
        </p>
        <Link
          href="/editor"
          className="inline-block px-6 py-2.5 rounded-2xl bg-indigo-500 text-white text-sm font-black shadow-sm hover:bg-indigo-600 transition-colors"
        >
          去写杂谈
        </Link>
      </div>
    </div>
  );
}
