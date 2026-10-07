/**
 * 路由切换模板。
 *
 * Next.js 会给 template 一个随路由变化的 key，因此每次切页它都会重新挂载 ——
 * 这正是"每次切页重放一次入场动画"所需要的机制（layout 不会重挂载，无法做到）。
 *
 * 动画本体在 globals.css 的 .page-enter 里（CSS 动画，跑在合成层）。
 * 导航栏放在 layout 里，不受这里影响，切页时不会被重建。
 */
import PageTransition from "../components/PageTransition";

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
