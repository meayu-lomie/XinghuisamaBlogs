import fs from 'fs';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import path from 'path';
import matter from 'gray-matter';
import { Link } from 'next-view-transitions';

// 核心升级：引入 Next.js 现代统一解析流
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm'; // 挂载 GFM 支持删除线
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import rehypeKatex from 'rehype-katex';

// 引入神仙代码高亮主题（Atom One Dark）
import 'highlight.js/styles/atom-one-dark.css';
import { siteConfig } from '../../../siteConfig';
import ClientSocials from '../../../components/ClientSocials';
import BackButton from '../../../components/BackButton';
import Comments from '../../../components/Comments';
import ClientTOC from '../../../components/ClientTOC';
import CodeCopy from '../../../components/CodeCopy';

export async function generateStaticParams() {
  const chattersDirectory = path.join(process.cwd(), 'chatters');
  if (!fs.existsSync(chattersDirectory)) return [];
  const filenames = fs.readdirSync(chattersDirectory);
  return filenames
    .filter((name) => name.endsWith('.md'))
    .map((name) => ({
      slug: name.replace(/\.md$/, ''),
    }));
}

const getChatterData = cache(async (slug: string) => {
  // 防目录穿越：slug 来自 URL，只允许纯文件名
  if (!slug || slug.includes('/') || slug.includes('\\') || slug.includes('..')) {
    notFound();
  }
  const fullPath = path.join(process.cwd(), 'chatters', `${slug}.md`);
  // 访问不存在的 slug 时抛异常会落到默认错误页，这里直接走 404
  if (!fs.existsSync(fullPath)) {
    notFound();
  }
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  let { data, content } = matter(fileContents);

  // ==========================================
  // 前台渲染清洗区：终极防吞换行 + 安全保护补丁！（从 Post 完美移植）
  // ==========================================

  // 1. 基础物理清洗：统一换行符，干掉幽灵占位符和纯空格废行
  content = content.replace(/\r\n/g, '\n');
  content = content.replace(/[\u200B-\u200D\uFEFF]/g, '');
  content = content.replace(/^[ \t]+$/gm, '');

  // 2. 强行修复数字列表缺少空格导致无法渲染为列表的 Bug (1.百度 -> 1. 百度)
  content = content.replace(/^(\s*\d+)\.([^ \n])/gm, '$1. $2');

  // 3. 空间隔离防吞换行阵法（绝对不伤代码块！）
  const blocks = content.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);
  content = blocks.map((block, index) => {
    // 奇数索引是代码块
    if (index % 2 === 1) {
      // 安全注入：如果代码块没写明语言，只在开头安全补上 cpp，绝不破坏结尾！
      if (/^```[ \t]*(\n|$)/.test(block)) {
         return block.replace(/^```[ \t]*/, '```cpp');
      }
      return block;
    }

    // 偶数索引是正文。把 3 个以上的连续 \n 替换为真实的 <br> 标签。
    // （3 个 \n 相当于中间空了 1 行真正的空白）
    return block.replace(/\n{3,}/g, (match) => {
      const brCount = match.length - 2;
      return '\n\n' + '<br>'.repeat(brCount) + '\n\n';
    });
  }).join('');

  // ==========================================

  // ---- 阅读统计：正文纯文本字数 + 阅读时长（中文按 300 字/分钟） ----
  const plainText = content.replace(/```[\s\S]*?```/g, ' ').replace(/~~~[\s\S]*?~~~/g, ' ');
  const charCount = plainText.replace(/\s/g, '').length;
  const readingMinutes = Math.max(1, Math.ceil(charCount / 300));

  // ---- 目录：从 markdown 提取 h1-h3 标题（跳过代码块）；id 由 ClientTOC 内部按规则生成对齐 ----
  const tocItems: { level: number; text: string; id: string }[] = [];
  content.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g).forEach((block, index) => {
    if (index % 2 === 1) return;
    for (const m of block.matchAll(/^(#{1,3})\s+(.+)$/gm)) {
      tocItems.push({ level: m[1].length, text: m[2].trim(), id: '' });
    }
  });

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

  return {
    slug,
    contentHtml: processedContent.toString(),
    title: data.title || '无标题',
    date: data.date,
    mood: data.mood,
    summary: typeof data.summary === 'string' ? data.summary : '',
    tags: data.tags && Array.isArray(data.tags) ? data.tags : [],
    cover: data.cover || siteConfig.defaultPostCover,
    charCount,
    readingMinutes,
    tocItems
  };
});

/** 相邻文章：按日期降序，prev = 更新的一篇，next = 更早的一篇 */
const getPrevNext = cache((currentSlug: string) => {
  const chattersDirectory = path.join(process.cwd(), 'chatters');
  let fileNames: string[] = [];
  try { fileNames = fs.readdirSync(chattersDirectory).filter(f => f.endsWith('.md')); } catch(e) {}

  const sorted = fileNames.map(f => {
    const s = f.replace(/\.md$/, '');
    const c = fs.readFileSync(path.join(chattersDirectory, f), 'utf8');
    const { data } = matter(c);
    return { slug: s, title: data.title || '无标题', date: data.date || '1970-01-01' };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const idx = sorted.findIndex(p => p.slug === currentSlug);
  return {
    prev: idx > 0 ? sorted[idx - 1] : null,
    next: idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null,
  };
});

const getRecentChatters = cache((currentSlug: string) => {
  const chattersDirectory = path.join(process.cwd(), 'chatters');
  let fileNames: string[] = [];
  try { fileNames = fs.readdirSync(chattersDirectory).filter(f => f.endsWith('.md')); } catch(e) {}
  if (!fileNames) return [];

  return fileNames.map(f => {
    const s = f.replace(/\.md$/, '');
    const c = fs.readFileSync(path.join(chattersDirectory, f), 'utf8');
    const { data } = matter(c);
    return { slug: s, title: data.title || '无标题', date: data.date || '1970-01-01' };
  }).filter(p => p.slug !== currentSlug)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
});

function generateCalendarMatrix(year: number, month: number, targetDay: number) {
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const days = [];
  for (let i = 0; i < startDay; i++) { days.push(null); }
  for (let i = 1; i <= daysInMonth; i++) { days.push(i); }
  return { days, targetDay };
}

/**
 * 每篇杂谈独立生成 metadata。
 *
 * UpdateLog 里写过「新增 OpenGraph metadata」，但此前全仓没有任何
 * generateMetadata / openGraph 实现，分享到社交平台时标题与摘要
 * 都是站点默认值。这里按内容补齐。
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getChatterData(slug);

  const title = data.title || slug;
  const description = data.summary || siteConfig.bio;
  const url = `${siteConfig.siteUrl}/chatter/${slug}`;
  const cover = data.cover || siteConfig.defaultPostCover;

  return {
    title: `${title} | ${siteConfig.title}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.title,
      type: 'article',
      publishedTime: data.date,
      images: cover ? [{ url: cover }] : undefined,
    },
  };
}

export default async function ChatterDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const chatterData = await getChatterData(resolvedParams.slug);
  const recentChatters = getRecentChatters(resolvedParams.slug);
  const { prev, next } = getPrevNext(resolvedParams.slug);

  const dateObj = new Date(chatterData.date || '2026-03-24');
  const yearStr = dateObj.getFullYear();
  const monthNum = dateObj.getMonth() + 1;
  const dayNum = dateObj.getDate();

  const { days: calendarDays } = generateCalendarMatrix(yearStr, monthNum, dayNum);
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  // 封面可能是站内相对路径（/images/x.jpg），也可能是历史外链。
  // 只有相对路径才需要拼站点域名，否则会拼成坏 URL。
  const cover = chatterData.cover || siteConfig.defaultPostCover;
  const coverUrl = cover
    ? (/^https?:\/\//.test(cover) ? cover : `${siteConfig.siteUrl}${cover}`)
    : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: chatterData.title,
    datePublished: chatterData.date,
    image: coverUrl ? [coverUrl] : undefined,
    description: chatterData.summary || siteConfig.bio,
    author: { '@type': 'Person', name: siteConfig.authorName },
    mainEntityOfPage: `${siteConfig.siteUrl}/chatter/${resolvedParams.slug}`,
    keywords: chatterData.tags?.join(', '),
  };

  return (
    <div className="min-h-screen relative pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div>
        <main className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 flex flex-col lg:flex-row gap-6 md:gap-8 relative z-10">

          <article className="flex-1 paper-card rounded-2xl shadow-lg border border-[var(--card-border)] overflow-hidden transition-colors duration-700">
            {chatterData.cover && (
              <div className="w-full aspect-video bg-slate-200 dark:bg-slate-700 relative group">
                <img src={chatterData.cover} alt="封面" className="vt-chatter-cover w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" />
              </div>
            )}

            <div className="p-5 md:p-14 relative">
              <BackButton />

              <header className="mb-6 md:mb-10 border-b border-slate-300/30 dark:border-slate-700/50 pb-5 md:pb-8 relative">
                <h1 className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 md:mb-6 tracking-tight transition-colors duration-700 pr-16 md:pr-24 leading-snug md:leading-tight">
                  {chatterData.title}
                </h1>

                {/* 前端展示版：特权修改按钮已彻底移除！ */}

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <div className="flex items-center gap-1.5 md:gap-2 text-indigo-700 dark:text-indigo-400 font-bold bg-indigo-500/5 dark:bg-indigo-400/10 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl text-xs md:text-sm border border-indigo-500/10">
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {chatterData.date}
                  </div>

                  <div className="flex items-center gap-1.5 md:gap-2 text-slate-500 dark:text-slate-400 font-bold bg-slate-500/5 dark:bg-slate-400/10 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl text-xs md:text-sm border border-slate-500/10">
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    约 {chatterData.readingMinutes} 分钟 · {chatterData.charCount} 字
                  </div>

                  {chatterData.mood && (
                    <div className="flex items-center gap-1.5 md:gap-2 text-pink-600 dark:text-pink-400 font-black bg-pink-500/5 dark:bg-pink-400/10 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl text-xs md:text-sm border border-pink-500/10">
                      心情：{chatterData.mood}
                    </div>
                  )}

                  {chatterData.tags.map((tag: string) => (
                    <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold bg-slate-500/5 dark:bg-slate-400/10 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl text-xs md:text-sm border border-slate-500/10 hover:text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] transition-all">
                      <span className="text-[10px] md:text-xs opacity-70">#</span> {tag}
                    </Link>
                  ))}
                </div>
              </header>

              {/* AI 摘要（发布时由模型生成并缓存进 frontmatter，无则不渲染） */}
              {chatterData.summary && (
                <div className="mb-8 rounded-2xl border border-indigo-500/15 border-l-4 border-l-indigo-500 bg-indigo-500/5 dark:bg-indigo-400/10 p-5">
                  <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    AI 摘要 · Summary
                  </div>
                  <p className="text-sm md:text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 font-medium">{chatterData.summary}</p>
                </div>
              )}

              <div className="relative">

                <div
                  id="article-content"
                  className="prose prose-slate dark:prose-invert prose-base md:prose-lg max-w-none text-slate-800 dark:text-slate-200 font-serif transition-colors duration-700 leading-relaxed scroll-smooth"
                  dangerouslySetInnerHTML={{ __html: chatterData.contentHtml }}
                />
                <CodeCopy containerId="article-content" />
              </div>

              {/* 上一篇 / 下一篇 */}
              {(prev || next) && (
                <div className="mt-10 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prev ? (
                    <Link href={`/chatter/${prev.slug}`} className="group rounded-2xl border border-[var(--card-border)] paper-card p-5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">← 上一篇 · Newer</span>
                      <p className="mt-1.5 text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{prev.title}</p>
                    </Link>
                  ) : <div />}
                  {next && (
                    <Link href={`/chatter/${next.slug}`} className="group rounded-2xl border border-[var(--card-border)] paper-card p-5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-right">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">下一篇 · Older →</span>
                      <p className="mt-1.5 text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{next.title}</p>
                    </Link>
                  )}
                </div>
              )}

              <div className="mt-10 md:mt-12">
                <Comments />
              </div>

            </div>
          </article>

          <aside className="w-full lg:w-[320px] flex flex-col gap-6 flex-shrink-0">
            <ClientTOC toc={chatterData.tocItems} />

            <div className="paper-card rounded-2xl p-6 border border-[var(--card-border)] shadow-md text-center">
              <div className="w-20 h-20 mx-auto rounded-full p-1 border-2 border-[var(--accent)] shadow-md mb-4 hover:rotate-3 transition-transform">
                <img src={siteConfig.avatarUrl} alt="avatar" className="vt-avatar w-full h-full rounded-full object-cover bg-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{siteConfig.authorName}</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-4">{siteConfig.bio}</p>
              <ClientSocials />
            </div>

            <div className="paper-card rounded-2xl p-6 border border-[var(--card-border)] shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-wider">{yearStr}年{monthNum}月</h3>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-4 text-center">
                {weekDays.map(day => <div key={day} className="text-[10px] font-black text-slate-400 uppercase">{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
                {calendarDays.map((day, index) => (
                  <div key={index} className="flex justify-center items-center">
                    {day ? (
                      <div className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black transition-all duration-300
                        ${day === dayNum ? 'bg-indigo-500 text-white shadow-lg scale-110' : 'text-slate-600 dark:text-slate-400 hover:paper-card dark:hover:bg-slate-700'}`}>
                        {day}
                      </div>
                    ) : <div className="w-8 h-8"></div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="paper-card rounded-2xl p-6 border border-[var(--card-border)] shadow-md">
              <h3 className="font-black text-slate-900 dark:text-white mb-4 border-l-4 border-indigo-500 pl-2 text-xs tracking-widest uppercase">近期杂谈 · Recent Records</h3>
              <div className="space-y-4">
                {recentChatters.map(p => (
                  <Link key={p.slug} href={`/chatter/${p.slug}`} className="group block">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">{p.title}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold uppercase">{p.date}</p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
