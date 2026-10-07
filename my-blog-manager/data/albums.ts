// 类型定义（与博客前端 XHBlogs/data/albums.ts 保持一致）。
// 相册数据本身只存博客目录，这里不再保存任何数据副本。
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }
