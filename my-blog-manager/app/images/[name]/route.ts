import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getBlogDir } from '../../../lib/blog-paths';

/**
 * 博客图片代理（管理端侧）。
 *
 * 内容里保存的是博客相对路径（/images/xxx.png），这个路径只在博客站点有效。
 * 管理端是另一个项目，public/ 里没有这些图片，直接引用会 404（裂图）。
 *
 * 这里接管管理端的 /images/* 请求，转发到博客目录去读实际文件。
 * 好处：内容里存的路径保持统一，管理端任何地方（头像、说说配图、编辑器预览…）
 * 都不用单独处理路径转换。
 */

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  // 防目录穿越：只允许纯文件名
  if (!name || name.includes('/') || name.includes('\\') || name.includes('..')) {
    return new NextResponse('Invalid file name', { status: 400 });
  }

  const imagesDir = getBlogDir('public', 'images');
  if (!imagesDir) {
    return new NextResponse('Blog image directory not configured', { status: 503 });
  }

  const filePath = path.join(imagesDir, name);
  if (!fs.existsSync(filePath)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const ext = path.extname(name).toLowerCase();
  const buf = fs.readFileSync(filePath);

  return new NextResponse(buf as any, {
    status: 200,
    headers: {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      // 图片名带时间戳，不会重复，可以放心缓存
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
