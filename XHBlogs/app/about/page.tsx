// src/app/about/page.tsx
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm'; // 引入 GFM 以支持 ~~删除线~~
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

// 引入高亮主题
import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.min.css';
import AboutClient from '../../components/AboutClient';
import { Suspense } from 'react';
import { siteConfig } from '../../siteConfig';

export const metadata = {
  title: '关于 | ' + siteConfig.title,
  description: siteConfig.bio,
};

function getDirActivities(dirName: string, typeLabel: '杂谈' | '说说', linkPrefix: string) {
  const dirPath = path.join(process.cwd(), dirName);
  if (!fs.existsSync(dirPath)) return [];

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));

  return files.map(file => {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
    const { data } = matter(content);
    return {
      id: `${dirName}-${file}`,
      type: typeLabel,
      title: data.title || file.replace('.md', ''),
      date: data.date || '1970-01-01 00:00:00',
      url: `/${linkPrefix}/${file.replace('.md', '')}`
    };
  });
}

export default async function AboutPage() {
  const fullPath = path.join(process.cwd(), 'app', 'about', 'about.md');
  let contentHtml = "博主很懒，还没有写自我介绍哦...";
  let coverImage = "/images/20261007_103854_34868a.jpg";

  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    // 改为 let，以便进行文本预清洗
    let { data, content } = matter(fileContents);
    if (data.cover) coverImage = data.cover;

    // ==========================================
    // 解析前物理清洗区
    // ==========================================
    // 1. 强行给没有语言标记的代码块加上 cpp 标签，防止侦测失败
    content = content.replace(/^```\s*$/gm, '```cpp');
    // 2. 强行修复数字列表缺少空格导致无法渲染为列表的 Bug (1.百度 -> 1. 百度)
    content = content.replace(/^(\s*\d+)\.([^ \n])/gm, '$1. $2');

    // 3. 拯救被 Markdown 引擎吞噬的“连续空行” (同步前台展示页的阵法)
    content = content.replace(/\r\n/g, '\n').replace(/^[ \t]+$/gm, '');
    const blocks = content.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);
    content = blocks.map((block, index) => {
      if (index % 2 === 1) return block; // 代码块绝对不碰
      return block.replace(/\n{3,}/g, (match) => {
        const brCount = match.length - 2;
        return '\n\n' + '<br>'.repeat(brCount) + '\n\n';
      });
    }).join('');
    // ==========================================

    const processedContent = await unified()
      .use(remarkParse)
      .use(remarkGfm) // 挂载 GFM 解析
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      // 核心修复：开启自动语言侦测，并限制语言白名单！
      // @ts-ignore
      .use(rehypeHighlight, {
        detect: true,
        ignoreMissing: true,
        subset: ['cpp', 'c', 'python', 'java', 'javascript', 'typescript', 'go', 'rust', 'bash', 'json', 'html', 'css', 'sql', 'xml']
      })
      .use(rehypeKatex)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(content);

    contentHtml = processedContent.toString();
  } catch (e) {
    console.error("读取 about.md 失败", e);
  }

  const chatters = getDirActivities('chatters', '杂谈', 'chatter');
  const moments = getDirActivities('moments', '说说', 'moments');

  const allActivities = [...chatters, ...moments].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="min-h-screen relative pb-20">
      <div>
        <main className="w-[95%] md:w-[90%] max-w-4xl mx-auto mt-24 md:mt-28 relative z-10">

          {/* 注入 About 页面专用的高颜值 Prose 全局样式 */}

          <Suspense fallback={<div className="h-96 flex items-center justify-center text-slate-500 font-bold animate-pulse">正在载入…</div>}>
            {/* 组件原封不动，安全可靠 */}
            <AboutClient
              contentHtml={contentHtml}
              coverImage={coverImage}
              activities={allActivities}
            />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
