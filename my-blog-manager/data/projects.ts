// 类型定义（与博客前端 XHBlogs/data/projects.ts 保持一致）。
// 项目数据本身只存博客目录，这里不再保存任何数据副本。
export type Project = {
  id: string;
  name: string;
  description: string;
  icon: string;
  githubUrl: string;
  tags: string[];
};
