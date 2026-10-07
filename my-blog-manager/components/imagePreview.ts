/**
 * 图片路径工具（管理端）。
 *
 * 内容里保存的是博客相对路径（/images/xxx.png）。
 * 管理端通过 app/images/[name]/route.ts 接管了 /images/* 请求，
 * 把它转发到博客目录去读文件，所以这些路径在管理端可以直接使用 ——
 * 不需要做任何转换。
 *
 * 这个函数保留为「显式的语义标记」：调用它表示"这是要显示给用户看的图片路径"，
 * 将来若管理端的图片来源策略再变（比如加 CDN 前缀），只需改这里一处。
 */
export function toPreviewSrc(url: string | undefined | null): string {
  if (!url) return '';
  return String(url).trim();
}
