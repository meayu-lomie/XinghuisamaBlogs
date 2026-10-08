import Link from 'next/link';

/**
 * 404 页面。
 *
 * 访客输错地址、或内容被删除后从旧链接进来时会看到这里。
 * 保持纸张风格，并给出回到主线的入口。
 */
export default function NotFound() {
  return (
    <div className="min-h-screen relative flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink-faint)] mb-4">
          404 · 找不到这一页
        </p>
        <h1 className="text-3xl md:text-4xl font-black text-[var(--ink)] mb-4">
          这一页不在集子里
        </h1>
        <p className="text-sm text-[var(--ink-soft)] leading-relaxed mb-8">
          可能是地址写错了，也可能是这条记录已经被我收起来了。
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-2xl bg-indigo-500 text-white text-sm font-black shadow-sm hover:bg-indigo-600 transition-colors"
          >
            回到首页
          </Link>
          <Link
            href="/chatter"
            className="px-6 py-2.5 rounded-2xl paper-card text-[var(--ink)] text-sm font-black hover:shadow-md transition-all"
          >
            翻翻杂谈
          </Link>
        </div>
      </div>
    </div>
  );
}
