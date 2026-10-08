"""
统一的路径解析模块。

背景：早期设计里，后端把内容写进自己的目录（my-blog-manager/posts 等），
再靠"同步"按钮整体覆盖到博客前端；这样同一份内容存在两个位置，
必须记得手动同步，否则线上看不到最新内容。

现在改为：后端直接读写博客前端目录（XHBlogs/），前端目录是唯一真相源，
"同步"这个环节不再需要。

博客前端目录从"项目仓库设置"里的 blogPath 读取，
配置文件：my-blog-manager/data/deploy_config.json
"""

import os
import re
import json

CURRENT_CORE_DIR = os.path.dirname(os.path.abspath(__file__))
# 后端根目录（my-blog-manager）
MANAGER_ROOT = os.path.dirname(CURRENT_CORE_DIR)
DEPLOY_CONFIG_FILE = os.path.join(MANAGER_ROOT, "data", "deploy_config.json")

BLOG_NOT_CONFIGURED_MSG = (
    "还没配置博客物理路径，请先在【项目仓库设置】里填写本地 Blog 路径并保存"
)


def get_blog_root() -> str:
    """博客前端根目录；未配置或路径不存在时返回空字符串"""
    try:
        if os.path.exists(DEPLOY_CONFIG_FILE):
            with open(DEPLOY_CONFIG_FILE, "r", encoding="utf-8") as f:
                cfg = json.load(f)
            path = (cfg.get("blogPath") or "").strip()
            if path and os.path.isdir(path):
                return path
    except Exception:
        pass
    return ""


def blog_path_or_none():
    """给写操作用：返回 (blog_root, None) 或 (None, 错误响应)"""
    root = get_blog_root()
    if not root:
        return None, {"success": False, "message": BLOG_NOT_CONFIGURED_MSG}
    return root, None


def blog_dir(*parts) -> str:
    """拼出博客目录下的路径；未配置时返回空字符串"""
    root = get_blog_root()
    if not root:
        return ""
    return os.path.join(root, *parts)


def safe_id(raw, fallback: str = "") -> str:
    """把前端传来的 id 净化为安全的文件名片段。

    这些 id 会被直接拼进 os.path.join 当文件名用，而它们来自请求体，
    不做过滤时 "../" 之类的输入可以跳到目标目录之外去读写文件。
    这里只保留字母、数字、下划线、连字符与中文，其余一律丢弃；
    结果为空时返回 fallback（调用方可据此报错或生成新 id）。
    """
    text = str(raw or "")
    cleaned = re.sub(r"[^0-9A-Za-z_\-\u4e00-\u9fff]", "", text)
    return cleaned or fallback
