import ProjectsBoard from './ProjectsBoard';
import {siteConfig} from "@/siteConfig";

export const metadata = {
  title: "项目 | " + siteConfig.title,
  description: "我写过的开源项目",
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
