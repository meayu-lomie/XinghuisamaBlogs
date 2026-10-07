import fs from 'fs';
import path from 'path';

/**
 * 服务端读取博客目录的工具。
 *
 * 背景：内容现在只有一份 —— 存在博客前端项目（XHBlogs）里。
 * 管理端写内容走 Python API（直接写博客目录），但管理端的页面是
 * Next.js 服务端组件，需要自己读文件，所以这里必须指向同一个博客目录，
 * 否则会出现"写了但列表里看不到"。
 *
 * 博客路径来自 my-blog-manager/data/deploy_config.json 的 blogPath
 * （在【项目仓库设置】里填写并保存）。
 */

const DEPLOY_CONFIG = path.join(process.cwd(), 'data', 'deploy_config.json');

/** 博客前端根目录；未配置或路径不存在时返回空字符串 */
export function getBlogRoot(): string {
  try {
    if (fs.existsSync(DEPLOY_CONFIG)) {
      const cfg = JSON.parse(fs.readFileSync(DEPLOY_CONFIG, 'utf8'));
      const p = String(cfg.blogPath || '').trim();
      if (p && fs.existsSync(p)) return p;
    }
  } catch {
    // 读不到就当未配置，由调用方兜底
  }
  return '';
}

/** 博客目录下的某个子目录；未配置时返回空字符串 */
export function getBlogDir(...parts: string[]): string {
  const root = getBlogRoot();
  if (!root) return '';
  return path.join(root, ...parts);
}
