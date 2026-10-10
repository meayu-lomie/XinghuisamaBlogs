import os
import io
import uuid
import datetime

import httpx
from fastapi import APIRouter, Body, UploadFile, File, Form

from cms_core.paths import get_blog_root

router = APIRouter()

# ============================================================
# 图片压缩（上传到本地 public/images 前自动执行）
# 用 Pillow：限制最长边 + 转 JPEG 压质，显著减小文件体积
# Pillow 不可用时静默降级为原图直存，不影响上传流程
# ============================================================
try:
    from PIL import Image as PILImage
    _HAS_PIL = True
except ImportError:
    PILImage = None
    _HAS_PIL = False

# 最长边超过此值才缩放（博客展示 2000px 完全够用）
_MAX_SIDE = 2000
# JPEG 压缩质量
_JPEG_QUALITY = 85


def _compress_image(content: bytes, ext: str) -> tuple[bytes, str]:
    """压缩图片，返回 (新字节, 新扩展名)。失败时原样返回不抛错。"""
    if not _HAS_PIL:
        return content, ext
    try:
        img = PILImage.open(io.BytesIO(content))
        img.load()

        # GIF 动图不能压缩（会丢帧），直接原样保留
        if getattr(img, "is_animated", False):
            return content, ext

        # 缩放：最长边超过 2000px 等比缩小
        if max(img.size) > _MAX_SIDE:
            img.thumbnail((_MAX_SIDE, _MAX_SIDE), PILImage.LANCZOS)

        # PNG 带 alpha 通道时保留 PNG 重压；其余统一转 JPEG 压质
        has_alpha = img.mode in ("RGBA", "LA", "P")
        if ext == ".png" and has_alpha:
            buf = io.BytesIO()
            img.save(buf, format="PNG", optimize=True)
            new_bytes = buf.getvalue()
            # 压缩有效才替换，否则保留原图
            if len(new_bytes) < len(content):
                return new_bytes, ext
            return content, ext

        out_ext = ext if ext in (".jpg", ".jpeg") else ".jpg"
        if img.mode != "RGB":
            img = img.convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85, optimize=True)
        new_bytes = buf.getvalue()
        if len(new_bytes) < len(content):
            return new_bytes, out_ext
        return content, ext
    except Exception:
        # 任何压缩失败都退回原图，保证上传不被阻断
        return content, ext


# ============================================================
# 一、第三方图床（Lsky Pro）
# ------------------------------------------------------------
# 需要用户在设置里填 picBedUrl + picBedToken，
# 没填时前端会提示"未配置图床 Token"。这部分原样保留。
# ============================================================

@router.post("/test")
async def test_picbed_connection(payload: dict = Body(...)):
    url = payload.get("url", "").strip().rstrip('/')
    token = payload.get("token", "").strip()

    if not url or not token:
        return {"success": False, "message": "图床 API 地址和 Token 不能为空"}

    test_endpoint = f"{url}/api/v1/profile"
    if not token.startswith("Bearer "):
        token = f"Bearer {token}"

    headers = {"Authorization": token, "Accept": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(test_endpoint, headers=headers)
            if response.status_code != 200:
                return {"success": False, "message": f"校验失败，服务器返回了 {response.status_code} 错误"}

            data = response.json()
            if data.get("status") is True:
                user_email = data.get("data", {}).get("email", "未知用户")
                return {"success": True, "message": f"连接成功，当前账户：{user_email}"}
            else:
                return {"success": False, "message": f"Token 无效: {data.get('message', '未知错误')}"}
    except Exception as e:
        return {"success": False, "message": f"网络异常: {str(e)}"}


@router.post("/upload")
async def upload_image(
        file: UploadFile = File(...),
        url: str = Form(...),
        token: str = Form(...)
):
    url = url.strip().rstrip('/')
    token = token.strip()

    if not token.startswith("Bearer "):
        token = f"Bearer {token}"

    upload_endpoint = f"{url}/api/v1/upload"
    headers = {
        "Authorization": token,
        "Accept": "application/json"
    }

    try:
        content = await file.read()
        files = {'file': (file.filename, content, file.content_type)}

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(upload_endpoint, headers=headers, files=files)

            if response.status_code != 200:
                return {"success": False, "message": f"上传失败，图床返回了 {response.status_code} 错误"}

            data = response.json()
            # 兼容 Lsky Pro 的返回格式
            if data.get("status") is True:
                img_url = data.get("data", {}).get("links", {}).get("url")
                return {"success": True, "message": "上传成功", "url": img_url}
            else:
                return {"success": False, "message": f"图床拒绝接收: {data.get('message', '未知')}"}
    except httpx.ReadTimeout:
        return {"success": False, "message": "图片上传超时，请检查网络或图片是否过大"}
    except Exception as e:
        return {"success": False, "message": f"服务器异常: {str(e)}"}


# ============================================================
# 二、本地图床：图片写进博客前端 public/images/（唯一真相源）
# ------------------------------------------------------------
# 返回 /images/xxx.png 相对路径，本地预览即时可用；
# 部署后由站点自身提供，不依赖任何第三方图床。
# ============================================================

# 允许的图片扩展名（防止上传可执行文件）
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico"}
# 上传大小上限 20MB
MAX_SIZE = 20 * 1024 * 1024


def _images_dir() -> str:
    """前端 public/images 目录"""
    blog_root = get_blog_root()
    if not blog_root:
        return ""
    return os.path.join(blog_root, "public", "images")


@router.get("/local/info")
async def local_picbed_info():
    """告诉前端：本地图片目录是否可用"""
    images_dir = _images_dir()
    return {
        "success": True,
        "images_dir": images_dir,
        "available": bool(images_dir),
    }


@router.post("/local")
async def upload_image_local(file: UploadFile = File(...)):
    """
    把图片存到博客前端的 public/images/ 目录。
    返回 url 为本地相对路径（/images/xxx.png）——本地预览即时可用，
    部署后由站点自身提供，不依赖任何第三方图床。
    """
    images_dir = _images_dir()
    if not images_dir:
        return {
            "success": False,
            "message": "还没设置博客目录，请到【设置 → 项目仓库设置】里填一下",
        }

    try:
        filename = file.filename or "image.png"
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXT:
            return {
                "success": False,
                "message": f"不支持的文件类型 {ext or '(无扩展名)'}，仅支持 {', '.join(sorted(ALLOWED_EXT))}",
            }

        os.makedirs(images_dir, exist_ok=True)

        # 时间戳+随机串，避免重名覆盖
        stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        rand = uuid.uuid4().hex[:6]
        safe_name = f"{stamp}_{rand}{ext}"
        save_path = os.path.join(images_dir, safe_name)

        content = await file.read()
        if not content:
            return {"success": False, "message": "文件内容为空"}
        if len(content) > MAX_SIZE:
            return {"success": False, "message": "图片超过 20MB，请压缩后再传"}

        # 自动压缩：最长边 2000px + JPEG 压质（压缩失败/无效时保留原图）
        content, ext = _compress_image(content, ext)
        # 压缩可能改变扩展名（如 png → jpg），文件名跟随更新
        if not safe_name.endswith(ext):
            safe_name = os.path.splitext(safe_name)[0] + ext
            save_path = os.path.join(images_dir, safe_name)

        with open(save_path, "wb") as f:
            f.write(content)

        local_path = f"/images/{safe_name}"

        return {
            "success": True,
            "message": "已保存到本地图片目录",
            "url": local_path,
            "filename": safe_name,
        }
    except Exception as e:
        return {"success": False, "message": f"保存失败: {str(e)}"}
