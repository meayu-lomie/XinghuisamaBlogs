import { redirect } from 'next/navigation';

/**
 * 控制台没有独立的首页：进入后直接跳到最常用的「写杂谈」。
 * （原首页是博客首页的复制品，已在控制台清理中移除）
 */
export default function Home() {
  redirect('/editor');
}
