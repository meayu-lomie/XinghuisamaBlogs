import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from cms_core.paths import get_blog_root, safe_id

router = APIRouter()


class MomentPayload(BaseModel):
    id: str
    date: str
    content: str
    location: Optional[str] = ""
    images: List[str] = []


@router.post("/save")
def save_moment(payload: MomentPayload):
    try:
        project_root = get_blog_root()
        if not project_root:
            return {"success": False, "message": "还没配置博客物理路径，请先在【项目仓库设置】里保存本地 Blog 路径"}

        MOMENTS_DIR = os.path.join(project_root, "moments")

        if not os.path.exists(MOMENTS_DIR):
            os.makedirs(MOMENTS_DIR, exist_ok=True)

        # 文件名使用前端传来的唯一 id（格式如 moment-17123456789.md），
        # 这样同一天发多条说说，文件也不会互相覆盖。
        # id 来自请求体，必须净化后才能拼进路径，否则可被 ../ 穿越。
        moment_id = safe_id(payload.id)
        if not moment_id:
            return {"success": False, "message": "说说的 id 不合法，已取消保存"}

        file_path = os.path.join(MOMENTS_DIR, f"{moment_id}.md")

        # 构造 Markdown Front-matter
        frontmatter_lines = ["---"]
        frontmatter_lines.append(f'id: "{moment_id}"')
        frontmatter_lines.append(f'date: "{payload.date}"')

        if payload.location:
            frontmatter_lines.append(f'location: "{payload.location}"')

        if payload.images:
            frontmatter_lines.append("images:")
            for img in payload.images:
                frontmatter_lines.append(f"  - '{img}'")

        frontmatter_lines.append("---")
        frontmatter_lines.append("")  # 留一个空行

        file_content = "\n".join(frontmatter_lines) + "\n" + payload.content

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(file_content)

        print(f"\n[成功] 说说已落盘：{file_path}\n")

        return {"success": True, "message": "说说已保存"}

    except Exception as e:
        print(f"\n[报错] 写入失败：{str(e)}\n")
        return {"success": False, "message": f"写入物理文件失败: {str(e)}"}


class DeletePayload(BaseModel):
    id: str

@router.post("/delete")
def delete_moment(payload: DeletePayload):
    try:
        project_root = get_blog_root()
        if not project_root:
            return {"success": False, "message": "还没配置博客物理路径，请先在【项目仓库设置】里保存本地 Blog 路径"}
        MOMENTS_DIR = os.path.join(project_root, "moments")

        moment_id = safe_id(payload.id)
        if not moment_id:
            return {"success": False, "message": "说说的 id 不合法，已取消删除"}

        file_path = os.path.join(MOMENTS_DIR, f"{moment_id}.md")

        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"\n[删除成功] 物理文件已删除：{file_path}\n")
            return {"success": True, "message": "文件已删除"}
        else:
            return {"success": False, "message": "文件不存在，无法删除"}

    except Exception as e:
        print(f"\n[删除报错] {str(e)}\n")
        return {"success": False, "message": f"删除失败: {str(e)}"}
