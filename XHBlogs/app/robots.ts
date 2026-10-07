import type { MetadataRoute } from 'next';
import { siteConfig } from '../siteConfig';

/** 生成 /robots.txt，向爬虫开放全站并指向 sitemap */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const base = (siteConfig.siteUrl || 'https://example.com').replace(/\/+$/, '');
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${base}/sitemap.xml`,
  };
}
