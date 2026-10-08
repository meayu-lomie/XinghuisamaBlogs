import ProjectsBoard from './ProjectsBoard';
import {siteConfig} from "@/siteConfig";

export const metadata = {
  title: "项目 | " + siteConfig.title,
  description: "开源项目与代码仓库展示",
};

export default function ProjectsPage() {
  return (
    <div className="min-h-screen relative pb-20">
      <div>
        <div className="mt-28">
          <ProjectsBoard />
        </div>
      </div>
    </div>
  );
}
