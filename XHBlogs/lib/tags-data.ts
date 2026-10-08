import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * 扫描 chatters 目录，收集所有杂谈 frontmatter 里的 tags，
 * 返回 标签 -> 该标签下的杂谈列表（按日期降序）。
 */
export function collectTags(): Map<string, { slug: string; title: string; date: string }[]> {
  const dir = path.join(process.cwd(), 'chatters');
  const map = new Map<string, { slug: string; title: string; date: string }[]>();
  try {
    fs.readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .forEach((f) => {
        const { data } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
        const tags = Array.isArray(data.tags) ? data.tags : [];
        for (const tag of tags) {
          const t = String(tag).trim();
          if (!t) continue;
          if (!map.has(t)) map.set(t, []);
          map.get(t)!.push({
            slug: f.replace(/\.md$/, ''),
            title: data.title || '无标题',
            date: data.date || '',
          });
        }
      });
  } catch (e) {
    // 目录不存在或读取失败时返回空集合，页面会渲染空状态
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  return map;
}
