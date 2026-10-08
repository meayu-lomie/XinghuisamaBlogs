import os
import json
from fastapi import APIRouter, Request

router = APIRouter()

# 目标文件改为博客前端的 data/projects.ts（唯一真相源）
from cms_core.paths import get_blog_root


def projects_ts_path() -> str:
    root = get_blog_root()
    if not root:
        return ""
    return os.path.join(root, "data", "projects.ts")


@router.post("/sync")
async def sync_projects(request: Request):
    try:
        payload = await request.json()
        projects_list = payload.get("projects", [])

        target = projects_ts_path()
        if not target:
            return {"success": False, "message": "还没配置博客物理路径，请先在【项目仓库设置】里保存本地 Blog 路径"}

        print(f"写入项目数据: {target}")

        # 序列化
        json_str = json.dumps(projects_list, ensure_ascii=False, indent=2)

        # 构造格式
        ts_content = (
            "// 本文件由控制台自动生成，请勿手动修改\n\n"
            "export type Project = {\n"
            "  id: string;\n"
            "  name: string;\n"
            "  description: string;\n"
            "  icon: string;\n"
            "  githubUrl: string;\n"
            "  tags: string[];\n"
            "};\n\n"
            f"export const projectsData: Project[] = {json_str};"
        )

        # 执行覆盖写入
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8") as f:
            f.write(ts_content)

        print("项目数据写入成功")
        return {"success": True, "message": "写入成功"}
    except Exception as e:
        print(f"写入失败: {str(e)}")
        return {"success": False, "message": str(e)}