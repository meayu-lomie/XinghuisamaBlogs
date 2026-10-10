// 本文件由控制台自动生成，请勿手动修改
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    "title": "测试",
    "description": "",
    "cover": "/images/20261008_185939_da2d66.jpg",
    "id": "album_1791308761210",
    "photos": [],
    "date": "2026-10-06"
  }
];