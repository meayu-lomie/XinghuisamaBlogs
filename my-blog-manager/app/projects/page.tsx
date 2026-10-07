import ProjectsBoard from './ProjectsBoard';
import { readBlogDataArray } from '../../lib/blog-data';
import type { Project } from '../../data/projects';

export const metadata = {
  title: "项目矩阵 | XingHuiSama の 博客",
  description: "开源项目与代码仓库展示",
};

export default function ProjectsPage() {
  // 项目数据只存在博客目录里（管理端写入也写那边），所以服务端直接读博客目录
  const projects = readBlogDataArray('projects.ts', 'projectsData') as Project[];

  return (
    <div className="min-h-screen relative pb-20">
      <div>
        <div className="mt-28">
          <ProjectsBoard initialProjects={projects} />
        </div>
      </div>
    </div>
  );
}
