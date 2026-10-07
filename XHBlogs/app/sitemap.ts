import type { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { siteConfig } from '../siteConfig';
import { collectTags } from '../lib/tags-data';

/**
 * 站点地图：构建时生成 /sitemap.xml。
 * 域名取 siteConfig.siteUrl（部署域名变化时在 siteConfig 里改）。
 */
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (siteConfig.siteUrl || 'https://example.com').replace(/\/+$/, '');

  const staticPages: MetadataRoute.Sitemap = [
    '',
    '/chatter',
    '/moments',
    '/photowall',
    '/projects',
    '/about',
    '/timeline',
    '/tags',
  ].map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.8 }));

  const chatters: MetadataRoute.Sitemap = [];
  try {
    const dir = path.join(process.cwd(), 'chatters');
    fs.readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .forEach((f) => {
        const { data } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
        chatters.push({
          url: `${base}/chatter/${encodeURIComponent(f.replace(/\.md$/, ''))}`,
          lastModified: data.date ? new Date(data.date) : undefined,
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      });
  } catch (e) {
    // 目录缺失时跳过杂谈条目
  }

  const tagPages: MetadataRoute.Sitemap = Array.from(collectTags().keys()).map((tag) => ({
    url: `${base}/tags/${encodeURIComponent(tag)}`,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticPages, ...chatters, ...tagPages];
}
