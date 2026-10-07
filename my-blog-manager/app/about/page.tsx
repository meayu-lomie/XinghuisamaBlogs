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

export const metadata = {
  title: "关于 | " + siteConfig.authorName + " の 控制台",
};

/** 汇总博客目录下某类内容的条目（与管理端详情页路径一致） */
function getDirActivities(dirPath: string, typeLabel: '文章' | '杂谈' | '说说', linkPrefix: string) {
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
  let contentHtml = "博主很懒，还没有写自我介绍哦...";
  let coverImage = "https://bu.dusays.com/2026/03/24/69c23dc278c78.jpg";

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

  const posts = blogRoot ? getDirActivities(path.join(blogRoot, 'posts'), '文章', 'posts') : [];
  const chatters = blogRoot ? getDirActivities(path.join(blogRoot, 'chatters'), '杂谈', 'chatter') : [];
  const moments = blogRoot ? getDirActivities(path.join(blogRoot, 'moments'), '说说', 'moments') : [];

  const allActivities = [...posts, ...chatters, ...moments].sort((a, b) => {
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

          {/* 🌟 注入 About 页面专用的高颜值 Prose 全局样式 */}
          <style dangerouslySetInnerHTML={{ __html: `
            .prose h1 { font-size: 1.8rem !important; font-weight: 900 !important; margin-bottom: 1.2rem !important; margin-top: 2rem !important; line-height: 1.3 !important; color: inherit !important; }
            .prose h2 { font-size: 1.5rem !important; font-weight: 800 !important; margin-bottom: 1rem !important; margin-top: 1.5rem !important; color: inherit !important; }
            .prose h3 { font-size: 1.2rem !important; font-weight: 700 !important; margin-bottom: 0.8rem !important; color: inherit !important; }
            .prose p { font-size: 0.95rem !important; line-height: 1.75 !important; color: inherit !important; }

            .prose a { color: var(--accent) !important; text-decoration: none !important; font-weight: 600 !important; border-bottom: 1px dashed var(--accent) !important; transition: all 0.3s ease !important; }
            .prose a:hover { color: var(--accent) !important; border-bottom-style: solid !important; background-color: color-mix(in srgb, var(--accent) 10%, transparent) !important; padding: 0 0.2rem !important; border-radius: 0.2rem !important; }
            .dark .prose a { color: var(--accent) !important; border-bottom-color: var(--accent) !important; }
            .dark .prose a:hover { color: var(--accent) !important; background-color: color-mix(in srgb, var(--accent) 15%, transparent) !important; }

            .prose ul { list-style-type: disc !important; padding-left: 1.5rem !important; font-size: 0.95rem !important; }
            .prose ol { list-style-type: decimal !important; padding-left: 1.5rem !important; font-size: 0.95rem !important; }
            .prose li { display: list-item !important; margin-bottom: 0.5rem !important; }

            .prose ul ul, .prose ol ul { list-style-type: circle !important; margin-top: 0.25rem !important; margin-bottom: 0.25rem !important; }
            .prose ol ol, .prose ul ol { list-style-type: lower-alpha !important; margin-top: 0.25rem !important; margin-bottom: 0.25rem !important; }

            .prose s, .prose del { text-decoration-line: line-through !important; opacity: 0.6; }

            .prose blockquote {
              border-left: 4px solid var(--accent) !important;
              background-color: color-mix(in srgb, var(--accent) 5%, transparent) !important;
              padding: 1rem 1.5rem !important;
              margin: 1.5rem 0 !important;
              border-radius: 0 1.25rem 1.25rem 0 !important;
              font-style: italic !important;
              color: #64748b !important;
              quotes: none !important;
            }
            .prose blockquote p { margin: 0 !important; color: inherit !important; }
            .prose blockquote p::before, .prose blockquote p::after { display: none !important; content: none !important; }

            .dark .prose blockquote {
              border-left-color: var(--accent) !important;
              background-color: color-mix(in srgb, var(--accent) 10%, transparent) !important;
              color: #94a3b8 !important;
            }

            .prose pre {
              background-color: #282c34 !important; color: #abb2bf !important;
              padding: 1rem !important; border-radius: 1.25rem !important;
              overflow-x: auto !important; box-shadow: inset 0 0 10px rgba(0,0,0,0.3) !important;
              margin-top: 1rem !important; margin-bottom: 1rem !important;
            }

            .prose pre code, .prose p code, .prose li code {
              font-family: ui-rounded, 'Quicksand', 'Nunito', 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, Consolas, monospace !important;
              font-variant-ligatures: contextual !important;
              font-weight: 500 !important;
              letter-spacing: 0.02em !important;
            }

            .prose pre code { background-color: transparent !important; padding: 0 !important; color: inherit !important; font-size: 0.85em !important; }

            .prose code::before, .prose code::after { content: none !important; }

            .prose p code, .prose li code {
              background-color: color-mix(in srgb, var(--accent) 10%, transparent) !important; color: var(--accent) !important;
              padding: 0.2rem 0.4rem !important; border-radius: 0.5rem !important; font-size: 0.85em !important;
            }
            .dark .prose p code, .dark .prose li code { background-color: color-mix(in srgb, var(--accent) 20%, transparent) !important; color: var(--accent) !important; }

            .prose br { display: block !important; content: "" !important; margin-top: 0.5em !important; }

            .prose img { display: block !important; margin: 1.5rem auto !important; border-radius: 1rem !important; box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; max-width: 100% !important; height: auto !important; }

            .prose pre code .hljs-comment, .prose pre code .hljs-quote { color: #5c6370 !important; font-style: italic !important; }
            .prose pre code .hljs-doctag, .prose pre code .hljs-keyword, .prose pre code .hljs-formula { color: #c678dd !important; }
            .prose pre code .hljs-keyword.type_, .prose pre code .hljs-type { color: #c678dd !important; }
            .prose pre code .hljs-section, .prose pre code .hljs-name, .prose pre code .hljs-selector-tag, .prose pre code .hljs-deletion, .prose pre code .hljs-subst { color: #e06c75 !important; }
            .prose pre code .hljs-literal { color: #56b6c2 !important; }
            .prose pre code .hljs-string, .prose pre code .hljs-regexp, .prose pre code .hljs-addition, .prose pre code .hljs-attribute, .prose pre code .hljs-meta-string { color: #98c379 !important; }
            .prose pre code .hljs-built_in, .prose pre code .hljs-class .hljs-title, .prose pre code .hljs-title.class_ { color: #e6c07b !important; }
            .prose pre code .hljs-attr, .prose pre code .hljs-variable, .prose pre code .hljs-template-variable, .prose pre code .hljs-selector-class, .prose pre code .hljs-selector-attr, .prose pre code .hljs-selector-pseudo, .prose pre code .hljs-number { color: #d19a66 !important; }
            .prose pre code .hljs-symbol, .prose pre code .hljs-bullet, .prose pre code .hljs-link, .prose pre code .hljs-meta, .prose pre code .hljs-selector-id, .prose pre code .hljs-title, .prose pre code .hljs-title.function_ { color: #61aeee !important; }

            @media (min-width: 768px) {
              .prose h1 { font-size: 3rem !important; font-weight: 950 !important; margin-bottom: 2rem !important; margin-top: 3rem !important; line-height: 1.1 !important; }
              .prose h2 { font-size: 2.2rem !important; margin-bottom: 1.5rem !important; margin-top: 2rem !important; }
              .prose h3 { font-size: 1.5rem !important; margin-bottom: 1rem !important; }
              .prose p { font-size: 1.15rem !important; line-height: 1.85 !important; }

              .prose ul, .prose ol { padding-left: 2rem !important; font-size: 1.1rem !important; }

              .prose pre { padding: 1.25rem !important; margin-top: 1.5rem !important; margin-bottom: 1.5rem !important; border-radius: 1.5rem !important; }
              .prose pre code { font-size: 0.9em !important; }
              .prose p code, .prose li code { padding: 0.2rem 0.4rem !important; font-size: 0.9em !important; border-radius: 0.375rem !important;}
              .prose img { margin: 2rem auto !important; border-radius: 2rem !important; box-shadow: 0 20px 50px rgba(0,0,0,0.15) !important; }
            }
          `}} />

          <Suspense fallback={<div className="h-96 flex items-center justify-center text-slate-500 font-bold animate-pulse">正在载入档案...</div>}>
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
