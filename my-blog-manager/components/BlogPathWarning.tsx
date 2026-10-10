import Link from 'next/link';
import { getBlogRoot } from '../lib/blog-paths';

/**
 * 「博客路径未配置」提示条。
 *
 * 管理端的列表页在路径没配好时会读到空数组，页面看起来和
 * 「确实还没有内容」一模一样，容易让人以为内容丢了。
 * 这里在服务端判断一次，只有未配置时才渲染这条提示。
 */
export default function BlogPathWarning() {
  if (getBlogRoot()) return null;

  return (
    <div className="mb-6 px-5 py-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-left">
      <p className="text-xs font-black text-amber-700 dark:text-amber-300 mb-1">
        还没设置博客目录
      </p>
      <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
        下面显示为空是因为管理端还不知道博客目录在哪，不代表内容不存在。
        请到
        <Link href="/settings" className="mx-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
          【设置 → 项目仓库设置】
        </Link>
        填写本地博客目录并保存。
      </p>
    </div>
  );
}
