import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { Suspense } from 'react';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import rehypeKatex from 'rehype-katex';

import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.min.css';

import AboutClient from '../../components/AboutClient';
import { siteConfig } from '../../siteConfig';
import { getBlogRoot } from '../../lib/blog-paths';

// 管理端是本机控制台，内容随时会被后端改写（发布杂谈/说说、改相册等），
// 页面必须在每次请求时实时读盘，不能被构建期静态化固化。
export const dynamic = 'force-dynamic';


export const metadata = {
  title: "关于 | " + siteConfig.authorName + " の 控制台",
};

/** 汇总博客目录下某类内容的条目（与管理端详情页路径一致） */
function getDirActivities(dirPath: string, typeLabel: '杂谈' | '说说', linkPrefix: string) {
  if (!fs.existsSync(dirPath)) return [];

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));

  return files.map(file => {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
    const { data } = matter(content);
    return {
      id: `${typeLabel}-${file}`,
      type: typeLabel,
      title: data.title || file.replace('.md', ''),
      date: data.date || '1970-01-01 00:00:00',
      url: `/${linkPrefix}/${file.replace('.md', '')}`
    };
  });
}

export default async function AboutPage() {
  const blogRoot = getBlogRoot();
  let contentHtml = "博主很懒，还没有写自我介绍…";
  let coverImage = "/images/20261007_103854_34868a.jpg";

  // 与管理端其他页面一致：about.md 也只读博客目录
  const fullPath = blogRoot ? path.join(blogRoot, 'app', 'about', 'about.md') : '';

  try {
    if (!fullPath || !fs.existsSync(fullPath)) throw new Error('about.md 不存在或未配置博客路径');
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    let { data, content } = matter(fileContents);
    if (data.cover) coverImage = data.cover;

    // 解析前物理清洗（与博客前端保持一致）
    content = content.replace(/^```\s*$/gm, '```cpp');
    content = content.replace(/^(\s*\d+)\.([^ \n])/gm, '$1. $2');
    content = content.replace(/\r\n/g, '\n').replace(/^[ \t]+$/gm, '');
    const blocks = content.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);
    content = blocks.map((block, index) => {
      if (index % 2 === 1) return block;
      return block.replace(/\n{3,}/g, (match) => {
        const brCount = match.length - 2;
        return '\n\n' + '<br>'.repeat(brCount) + '\n\n';
      });
    }).join('');

    const processedContent = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
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

  const chatters = blogRoot ? getDirActivities(path.join(blogRoot, 'chatters'), '杂谈', 'chatter') : [];
  const moments = blogRoot ? getDirActivities(path.join(blogRoot, 'moments'), '说说', 'moments') : [];

  const allActivities = [...chatters, ...moments].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="min-h-screen relative pb-20">
      <div>
        <main className="w-[95%] md:w-[90%] max-w-4xl mx-auto mt-24 md:mt-28 relative z-10">

          {/* 控制台专属：编辑入口 */}
          <div className="flex justify-end mb-6">
            <Link
              href="/editor?id=about&type=about"
              className="px-5 py-2.5 rounded-2xl paper-card border border-[var(--card-border)] text-xs font-black uppercase tracking-widest text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all shadow-sm flex items-center gap-2"
            >
              编辑关于页
            </Link>
          </div>

          {/* 注入 About 页面专用的高颜值 Prose 全局样式 */}

          <Suspense fallback={<div className="h-96 flex items-center justify-center text-slate-500 font-bold animate-pulse">正在载入…</div>}>
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
