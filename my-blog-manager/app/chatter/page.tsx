import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import ChatterBoard from './ChatterBoard';
import { getBlogDir } from '../../lib/blog-paths';

export const metadata = {
  title: "杂谈 | XingHuiSama の 博客",
  description: "日常碎片与灵感记录",
};

export default function ChatterPage() {
  // 内容只存在博客目录里（管理端写入也写那边），所以这里要读博客目录
  const chattersDirectory = getBlogDir('chatters');
  let chatters: any[] = [];

  try {
    if (!chattersDirectory) {
      console.warn('未配置博客物理路径，无法读取杂谈列表');
    } else if (!fs.existsSync(chattersDirectory)) {
      fs.mkdirSync(chattersDirectory, { recursive: true });
    }

    const fileNames = chattersDirectory
      ? fs.readdirSync(chattersDirectory).filter(fileName => fileName.endsWith('.md'))
      : [];

    chatters = fileNames.map(fileName => {
      const slug = fileName.replace(/\.md$/, '');
      const fileContents = fs.readFileSync(path.join(chattersDirectory, fileName), 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || '',
        date: data.date || '1970-01-01', // 👇 核心修复：加上日期兜底防崩溃
        tags: data.tags || [],
        mood: data.mood || '',
        cover: data.cover || '',
        content: content.replace(/^#+ .*\n/m, '')
      };
    }).sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()));
  } catch (e) {
    console.error("读取杂谈文件失败:", e);
  }

  return (
    <div className="min-h-screen relative pb-10">
      <div>
        <ChatterBoard chatters={chatters} />
      </div>
    </div>
  );
}