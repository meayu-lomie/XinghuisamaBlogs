import os
import json
from fastapi import APIRouter, Request

router = APIRouter()

# 目标文件改为博客前端的 data/albums.ts（唯一真相源）
from cms_core.paths import get_blog_root


def albums_ts_path() -> str:
    root = get_blog_root()
    if not root:
        return ""
    return os.path.join(root, "data", "albums.ts")


@router.post("/sync")
async def sync_gallery(request: Request):
    """
    接收前端传来的全量相册数组，并将其物理重写回 data/albums.ts
    """
    try:
        payload = await request.json()
        albums_data = payload.get("albums", [])

        target = albums_ts_path()
        if not target:
            return {"success": False, "message": "还没配置博客物理路径，请先在【项目仓库设置】里保存本地 Blog 路径"}

        if not isinstance(albums_data, list):
            return {"success": False, "message": "数据格式非法，预期为数组"}

        # 1. 序列化数据（确保中文不乱码，缩进漂亮）
        json_str = json.dumps(albums_data, ensure_ascii=False, indent=2)

        # 2. 构造标准的 TypeScript 导出模板
        # 不依赖绝对路径，只要相对位置不变就能跑
        ts_content = (
            "// 本文件由控制台自动生成，请勿手动修改\n"
            "export interface Photo { url: string; caption?: string; }\n"
            "export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }\n\n"
            f"export const albums: Album[] = {json_str};"
        )

        # 3. 确保目录存在并执行覆盖写入
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8") as f:
            f.write(ts_content)

        return {
            "success": True,
            "message": f"照片墙已更新，共 {len(albums_data)} 个相册"
        }
    except Exception as e:
        # 这里把具体的报错抛给前端方便排查
        return {"success": False, "message": f"同步失败: {str(e)}"}


@router.get("/debug_path")
async def debug_path():
    """用于检查当前后端锁定的物理路径"""
    target = albums_ts_path()
    return {
        "blog_root": get_blog_root(),
        "target_file": target,
        "exists": bool(target) and os.path.exists(target)
    }