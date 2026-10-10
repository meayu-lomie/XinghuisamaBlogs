import ProjectsBoard from './ProjectsBoard';
import BlogPathWarning from '../../components/BlogPathWarning';
import { readBlogDataArray } from '../../lib/blog-data';
import type { Project } from '../../data/projects';
import { siteConfig } from '../../siteConfig';

// 管理端是本机控制台，内容随时会被后端改写（发布杂谈/说说、改相册等），
// 页面必须在每次请求时实时读盘，不能被构建期静态化固化。
export const dynamic = 'force-dynamic';


export const metadata = {
  title: "项目 | " + siteConfig.authorName + " の 控制台",
  description: "我写过的开源项目",
};

export default function ProjectsPage() {
  // 项目数据只存在博客目录里（管理端写入也写那边），所以服务端直接读博客目录
  const projects = readBlogDataArray('projects.ts', 'projectsData') as Project[];

  return (
    <div className="min-h-screen relative pb-20">
      <div>
        <div className="mt-28">
          <BlogPathWarning />
          <ProjectsBoard initialProjects={projects} />
        </div>
      </div>
    </div>
  );
}
