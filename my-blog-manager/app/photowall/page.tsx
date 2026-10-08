import PhotoWallClient from './PhotoWallClient';
import BlogPathWarning from '../../components/BlogPathWarning';
import { readBlogDataArray } from '../../lib/blog-data';
import type { Album } from '../../data/albums';

// 管理端是本机控制台，内容随时会被后端改写（发布杂谈/说说、改相册等），
// 页面必须在每次请求时实时读盘，不能被构建期静态化固化。
export const dynamic = 'force-dynamic';


export default function PhotoWallPage() {
  // 相册数据只存在博客目录里（管理端写入也写那边），所以服务端直接读博客目录
  const albums = readBlogDataArray('albums.ts', 'albums') as Album[];

  return (
    <>
      <BlogPathWarning />
      <PhotoWallClient initialAlbums={albums} />
    </>
  );
}
