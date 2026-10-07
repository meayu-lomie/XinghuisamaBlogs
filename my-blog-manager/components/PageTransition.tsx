/**
 * 页面切换入场过渡。
 *
 * 为什么用 CSS 动画而不是 JS 动画库：
 * 这是「预定性动效」——每次切页都是同一套入场动作，不需要 JS 参与时序。
 * CSS 动画跑在合成层、不占用主线程，页面在忙着加载数据时也不会掉帧；
 * 而 JS 驱动的入场动画在 App Router 的路由切换期间可能错过启动时机
 * （实测过：元素停在初始状态导致内容不可见）。
 *
 * 动画定义见 globals.css 的 @utility page-enter（含 @keyframes）。
 * 减少动效偏好用 motion-reduce: 变体换成纯淡入。
 */
import { ReactNode } from "react";

export default function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`page-enter motion-reduce:page-enter-soft${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
}
