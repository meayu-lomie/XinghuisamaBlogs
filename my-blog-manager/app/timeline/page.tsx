import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { siteConfig } from '../../siteConfig';
import TimelineClient from '../../components/TimelineClient';
import { ToastProvider } from '../../components/ToastProvider';
import { getBlogRoot } from '../../lib/blog-paths';

export const metadata = {
  title: "时间线 | " + siteConfig.authorName + " の 控制台",
};

export default function TimelinePage() {
  // 与管理端其他页面一致：内容只读博客目录（唯一真相源）
  // 时间线 = 文章(posts) + 杂谈(chatters) 的自动汇总
  const blogRoot = getBlogRoot();
  let posts: any[] = [];
  let tagCounts: Record<string, number> = {};

  const collect = (dir: string, type: 'post' | 'chatter') => {
    try {
      if (!blogRoot || !fs.existsSync(dir)) return;
      const fileNames = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

      fileNames.forEach(fileName => {
        const slug = fileName.replace(/\.md$/, '');
        const fullPath = path.join(dir, fileName);
        const { data } = matter(fs.readFileSync(fullPath, 'utf8'));

        const itemTags = data.tags && Array.isArray(data.tags) ? data.tags : ['未分类'];
        itemTags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });

        posts.push({
          slug,
          type,
          title: data.title || (type === 'chatter' ? '碎片记录' : '无标题'),
          date: data.date || '1970-01-01',
          description: data.description || (type === 'chatter' && data.mood ? `心情：${data.mood}` : ''),
          tags: itemTags,
          cover: data.cover || siteConfig.defaultPostCover,
        });
      });
    } catch (e) {
      console.error(`读取${type === 'chatter' ? '杂谈' : '文章'}列表失败`, e);
    }
  };

  if (blogRoot) {
    collect(path.join(blogRoot, 'chatters'), 'chatter');
  }

  posts.sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    return dateDiff !== 0 ? dateDiff : b.slug.localeCompare(a.slug);
  });

  const tagsArray = Object.keys(tagCounts)
    .map(name => ({ name, count: tagCounts[name] }))
    .sort((a, b) => b.count - a.count);

  return (
    <ToastProvider>
      <div className="min-h-screen relative pb-32">
        <div>
          <TimelineClient posts={posts} tags={tagsArray} />
        </div>
      </div>
    </ToastProvider>
  );
}
