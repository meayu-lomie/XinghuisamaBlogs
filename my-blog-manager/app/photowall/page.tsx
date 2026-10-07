import PhotoWallClient from './PhotoWallClient';
import { readBlogDataArray } from '../../lib/blog-data';
import type { Album } from '../../data/albums';

export default function PhotoWallPage() {
  // 相册数据只存在博客目录里（管理端写入也写那边），所以服务端直接读博客目录
  const albums = readBlogDataArray('albums.ts', 'albums') as Album[];

  return <PhotoWallClient initialAlbums={albums} />;
}
