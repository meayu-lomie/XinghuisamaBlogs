from fastapi import APIRouter, Body
import os
import re
import json
from typing import Dict, Any

from cms_core.paths import get_blog_root

router = APIRouter()

# ---------------------------------------------------------
# 🛠️ 寻址引擎：物理锁死 Manager 本地根目录！(终极修复版)
# ---------------------------------------------------------
CURRENT_API_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_API_DIR, "..", ".."))


def get_config_path():
    """后端自己的 siteConfig.ts"""
    possible_paths = [
        os.path.join(PROJECT_ROOT, 'siteConfig.ts'),
        os.path.join(PROJECT_ROOT, 'src', 'siteConfig.ts'),
        os.path.join(os.path.dirname(CURRENT_API_DIR), 'siteConfig.ts')
    ]

    for p in possible_paths:
        if os.path.exists(p):
            return p

    print(f"❌ 警告：在 Manager 目录未找到 siteConfig.ts！正在搜索的根目录是: {PROJECT_ROOT}")
    return None


def get_blog_config_path():
    """博客前端的 siteConfig.ts（真正的展示来源）"""
    root = get_blog_root()
    if not root:
        return None
    p = os.path.join(root, "siteConfig.ts")
    return p if os.path.exists(p) else None


def dict_to_ts_string(data, indent=2):
    """安全地将字典转为 TypeScript 格式，自动处理多行字符串转义"""
    if isinstance(data, dict):
        lines = ["{"]
        for k, v in data.items():
            # 🌟 核心修复：无论是字典还是外层，全部使用 json.dumps 强制安全转义，彻底消灭 Unterminated string constant
            val = json.dumps(v, ensure_ascii=False)
            lines.append(f"{' ' * (indent + 2)}{k}: {val},")
        lines.append(" " * indent + "}")
        return "\n".join(lines)
    return json.dumps(data, ensure_ascii=False)


# =========================================================
# 🚀 接口 1：读取配置 (GET) - 终极安全隔离版 (🌟 修复布尔值读取)
# =========================================================
@router.get("/get")
def get_site_config():
    config_path = get_config_path()
    if not config_path:
        return {"success": False, "message": "未能找到 siteConfig.ts 文件"}

    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            content = f.read()

        parsed_config = {}
        root_content = content

        # 1. 🌟 预先提取并隔离所有已知的“嵌套对象”，防止内部属性泄露到外层！
        known_dicts = ['social', 'giscusConfig', 'geminiConfig', 'icpConfig']
        for dict_name in known_dicts:
            dict_match = re.search(rf'{dict_name}\s*:\s*\{{([\s\S]+?)\}}', content)
            if dict_match:
                dict_str = dict_match.group(1)
                # 从根内容中剔除，防止下面的通用正则去抓里面的零散数据
                root_content = re.sub(rf'{dict_name}\s*:\s*\{{[\s\S]+?\}},?', '', root_content)

                sub_dict = {}
                # 提取字符串（支持安全匹配包含 \n 的字符串）
                for m in re.finditer(r'([a-zA-Z0-9_]+)\s*:\s*(["\'])([\s\S]*?)\2', dict_str):
                    # 将转义的 \\n 恢复为真实的换行，供前端显示
                    sub_dict[m.group(1)] = m.group(3).replace('\\n', '\n')



                parsed_config[dict_name] = sub_dict

        # 2. 🌟 核心升级：提取外层基础变量（现在支持 字符串、布尔值、数字！）
        for match in re.finditer(r'([a-zA-Z0-9_]+)\s*:\s*(?:(["\'])([\s\S]*?)\2|(true|false|\d+))', root_content):
            key = match.group(1)
            str_val = match.group(3) # 匹配到的字符串
            raw_val = match.group(4) # 匹配到的布尔或数字

            if str_val is not None:
                parsed_config[key] = str_val.replace('\\n', '\n')
            elif raw_val == 'true':
                parsed_config[key] = True
            elif raw_val == 'false':
                parsed_config[key] = False
            elif raw_val.isdigit():
                parsed_config[key] = int(raw_val)

        return {"success": True, "data": parsed_config}
    except Exception as e:
        return {"success": False, "message": f"解析失败: {str(e)}"}


# =========================================================
# 🚀 接口 2：写入配置 (POST) - 白名单防漏防崩溃版
# =========================================================
@router.post("/update")
def update_site_config(payload: Dict[str, Any] = Body(...)):
    updates = payload.get("updates", {})
    if not updates:
        return {"success": False, "message": "没有收到需要更新的数据"}

    config_path = get_config_path()
    if not config_path:
        return {"success": False, "message": "未能扫描到 siteConfig.ts"}

    # 🌟 核心防线：绝对安全的根节点白名单！
    VALID_ROOT_KEYS = {
        "title", "authorName", "bio", "avatarUrl", "useGradient", "themeColors",
        "bgImages", "defaultPostCover", "photoWallImage", "social",
        "counts", "chatterTitle", "chatterDescription", "picBedName", "picBedUrl",
        "picBedToken", "giscusConfig", "buildDate", "footerBadges",
        "icpConfig", "geminiConfig",
        "faviconUrl",
        "navTitle",
        "navSuffix",
        "navAfter",
        "enableLevelSystem" # 👈 你加的字段在这里，完美！
    }

    def apply_updates(path: str) -> int:
        """把 updates 应用到指定文件，返回成功改动的字段数"""
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        print(f"🔥 写入目标文件: {path}")
        count = 0

        for key, value in updates.items():
            # 拦截非白名单字段，防止误写危险字段
            if key not in VALID_ROOT_KEYS:
                print(f"  🛑 拦截非根节点字段 -> [{key}]")
                continue

            if isinstance(value, str):
                val_str = json.dumps(value, ensure_ascii=False)
            elif isinstance(value, bool):
                val_str = str(value).lower()   # bool 转 'true' / 'false'
            elif isinstance(value, dict):
                val_str = dict_to_ts_string(value, indent=2)
            else:
                val_str = json.dumps(value, ensure_ascii=False)

            if isinstance(value, dict):
                pattern = rf"({key}\s*:\s*)\{{[\s\S]*?\}}"
            elif isinstance(value, list):
                pattern = rf"({key}\s*:\s*)\[[\s\S]*?\]"
            else:
                pattern = rf"({key}\s*:\s*)(['\"`][\s\S]*?['\"`]|true|false|\d+)"

            if re.search(pattern, content):
                content = re.sub(pattern, lambda m: m.group(1) + val_str, content, count=1)
                print(f"  ✅ 已更新 -> [{key}]")
                count += 1

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return count

    try:
        # 1. 写后端自己的配置（设置页读取的就是它）
        n_manager = apply_updates(config_path)

        # 2. 同步写博客前端的配置 —— 否则设置页改的站点信息在博客上看不到
        blog_config = get_blog_config_path()
        n_blog = 0
        if blog_config:
            n_blog = apply_updates(blog_config)
        else:
            print("⚠️ 未找到博客前端的 siteConfig.ts，本次只更新了管理端配置")

        print("=" * 50 + "\n")

        if blog_config:
            msg = f"已更新管理端 {n_manager} 个字段、博客前端 {n_blog} 个字段"
        else:
            msg = (f"已更新管理端 {n_manager} 个字段。"
                   "未找到博客前端 siteConfig.ts（请检查【项目仓库设置】里的博客路径）")

        return {"success": True, "message": msg}

    except Exception as e:
        print(f"❌ 写入发生错误: {str(e)}")
        return {"success": False, "message": f"文件读写错误: {str(e)}"}