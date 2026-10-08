import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { siteConfig } from '../../siteConfig';
import TimelineClient from '../../components/TimelineClient';
import BlogPathWarning from '../../components/BlogPathWarning';
import { ToastProvider } from '../../components/ToastProvider';
import { getBlogRoot } from '../../lib/blog-paths';

// 管理端是本机控制台，内容随时会被后端改写（发布杂谈/说说、改相册等），
// 页面必须在每次请求时实时读盘，不能被构建期静态化固化。
export const dynamic = 'force-dynamic';


export const metadata = {
  title: "时间线 | " + siteConfig.authorName + " の 控制台",
};

export default function TimelinePage() {
  // 与管理端其他页面一致：内容只读博客目录（唯一真相源）
  // 时间线 = 杂谈(chatters) 的自动汇总
  const blogRoot = getBlogRoot();
  let posts: any[] = [];
  let tagCounts: Record<string, number> = {};

  const collect = (dir: string) => {
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
          type: 'chatter',
          title: data.title || '无标题',
          date: data.date || '1970-01-01',
          description: data.description || (data.mood ? `心情：${data.mood}` : ''),
          tags: itemTags,
          cover: data.cover || siteConfig.defaultPostCover,
        });
      });
    } catch (e) {
      console.error('读取杂谈列表失败', e);
    }
  };

  if (blogRoot) {
    collect(path.join(blogRoot, 'chatters'));
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
          <BlogPathWarning />
          <TimelineClient posts={posts} tags={tagsArray} />
        </div>
      </div>
    </ToastProvider>
  );
}
