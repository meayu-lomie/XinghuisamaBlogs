import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { siteConfig } from '../../siteConfig';
import TimelineClient from '../../components/TimelineClient';
import { ToastProvider } from '../../components/ToastProvider';

export const metadata = {
  title: "时间线 | " + siteConfig.title,
};

export default function Timeline() {
  // 时间线 = 杂谈(chatters) + 说说(moments) 的自动汇总
  const chattersDirectory = path.join(process.cwd(), 'chatters');
  let posts: any[] = [];
  let tagCounts: Record<string, number> = {};

  const collect = (dir: string) => {
    try {
      if (!fs.existsSync(dir)) return;
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

  collect(chattersDirectory);

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
