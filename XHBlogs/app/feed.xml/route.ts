import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { siteConfig } from '../../siteConfig';

/**
 * RSS 2.0 订阅源：/feed.xml
 * 运行时读取 chatters 目录生成，发布新杂谈后无需重新构建即可被订阅器读到。
 * 站点地址优先取 siteConfig.siteUrl，未配置时回退到当前请求的 origin。
 */

// 与 sitemap / robots 保持一致：构建期生成静态订阅源
export const dynamic = 'force-static';

const xmlEscape = (s: string) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export async function GET(request: Request) {
  const base = (siteConfig.siteUrl || new URL(request.url).origin).replace(/\/+$/, '');

  const dir = path.join(process.cwd(), 'chatters');
  const items: string[] = [];
  try {
    fs.readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .forEach((f) => {
        const { data, content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
        const slug = f.replace(/\.md$/, '');
        const title = xmlEscape(data.title || '无标题');
        const link = `${base}/chatter/${encodeURIComponent(slug)}`;
        const description = xmlEscape(
          data.description || content.replace(/[#>*`~\[\]!]/g, '').trim().slice(0, 120)
        );
        const pubDate = new Date(data.date || '1970-01-01').toUTCString();
        items.push(
          `    <item>\n      <title>${title}</title>\n      <link>${link}</link>\n      <guid isPermaLink="true">${link}</guid>\n      <pubDate>${pubDate}</pubDate>\n      <description>${description}</description>\n    </item>`
        );
      });
  } catch (e) {
    // 目录不存在时输出空频道，保持 feed 可访问
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(siteConfig.title)}</title>
    <link>${base}</link>
    <description>${xmlEscape(siteConfig.bio)}</description>
    <language>zh-CN</language>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
${items.join('\n')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
