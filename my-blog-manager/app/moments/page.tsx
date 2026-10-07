import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import MomentList from './MomentList';
import { siteConfig } from '../../siteConfig';
import { getBlogRoot } from '../../lib/blog-paths';

export const metadata = {
  title: "说说 | " + siteConfig.authorName + " の 博客",
  description: "生活动态与瞬间记录",
};

export default function MomentsPage() {
  let allMoments: any[] = [];

  try {
    // 内容只存在博客目录里（管理端写入也写那边），所以这里要读博客目录
    const blogRoot = getBlogRoot();
    const possibleDirs = blogRoot
      ? [
          path.join(blogRoot, 'posts', 'moments'),
          path.join(blogRoot, 'moments'),
        ]
      : [];

    if (!blogRoot) {
      console.warn('未配置博客物理路径，无法读取说说列表');
    }

    possibleDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const fileNames = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
        fileNames.forEach(fileName => {
          const fullPath = path.join(dir, fileName);
          const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));

          allMoments.push({
            id: fileName.replace(/\.md$/, ''),
            date: data.date || '1970-01-01',
            location: data.location || '',
            images: data.images || [],
            content: content.trim()
          });
        });
      }
    });

    // 去重，防止你在两个文件夹放了同名文件
    allMoments = Array.from(new Map(allMoments.map(item => [item.id, item])).values());

  } catch (e) {
    console.error("读取说说数据失败:", e);
  }

  return (
    <div className="min-h-screen relative pb-10 flex flex-col">
      <div className="flex-1 flex flex-col">
        <MomentList
          moments={allMoments}
          authorName={siteConfig.authorName}
          avatarUrl={siteConfig.avatarUrl}
        />
      </div>
    </div>
  );
}