from fastapi import APIRouter, Body
import os
import re
import json
from typing import Dict, Any

from cms_core.paths import get_blog_root

router = APIRouter()

# ---------------------------------------------------------
# 寻址：定位管理端本地根目录
# ---------------------------------------------------------
CURRENT_API_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_API_DIR, "..", ".."))

# TS 字符串字面量：双引号 / 单引号 / 反引号，内容允许任意转义序列。
# 必须识别 \" 这类转义，否则含引号的配置值在第二次写入时会破坏文件
# （旧模式用 [\s\S]*? 会在第一个转义引号处收尾，把余下内容留成裸文本）。
# 用命名组 (?P<ts>) 捕获内容，避免多个顶层分支导致组编号漂移。
TS_STRING = r'"(?:[^"\\]|\\.)*"|' + r"'(?:[^'\\]|\\.)*'|" + r'`(?:[^`\\]|\\.)*`'
TS_STR_CAP = (r'"(?P<ts_dq>(?:[^"\\]|\\.)*)"|'
              r"'(?P<ts_sq>(?:[^'\\]|\\.)*)'|"
              r'`(?P<ts_bq>(?:[^`\\]|\\.)*)`')


def _captured(match) -> str | None:
    """取出 TS 字符串内容（三种引号任一命中），未命中返回 None。"""
    for name in ('ts_dq', 'ts_sq', 'ts_bq'):
        val = match.group(name)
        if val is not None:
            return val
    return None


def _unescape_ts(raw: str) -> str:
    """把 TS 字符串字面量里的转义序列还原为真实字符。"""
    out = []
    i = 0
    while i < len(raw):
        ch = raw[i]
        if ch == '\\' and i + 1 < len(raw):
            nxt = raw[i + 1]
            mapping = {'n': '\n', 'r': '\r', 't': '\t', '"': '"', "'": "'", '`': '`', '\\': '\\'}
            out.append(mapping.get(nxt, '\\' + nxt))
            i += 2
        else:
            out.append(ch)
            i += 1
    return ''.join(out)


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

    print(f"警告：在管理端目录未找到 siteConfig.ts，搜索根目录是: {PROJECT_ROOT}")
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
            # 无论字典还是外层，统一用 json.dumps 安全转义，避免字符串未闭合
            val = json.dumps(v, ensure_ascii=False)
            lines.append(f"{' ' * (indent + 2)}{k}: {val},")
        lines.append(" " * indent + "}")
        return "\n".join(lines)
    return json.dumps(data, ensure_ascii=False)


# =========================================================
# 接口 1：读取配置 (GET)
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

        # 1. 先提取已知的嵌套对象，避免内部属性泄露到外层
        known_dicts = ['social', 'giscusConfig', 'icpConfig']
        for dict_name in known_dicts:
            dict_match = re.search(rf'{dict_name}\s*:\s*\{{([\s\S]+?)\}}', content)
            if dict_match:
                dict_str = dict_match.group(1)
                # 从根内容中剔除，防止下面的通用正则去抓里面的零散数据
                root_content = re.sub(rf'{dict_name}\s*:\s*\{{[\s\S]+?\}},?', '', root_content)

                sub_dict = {}
                # 提取字符串（识别转义序列，避免在 \" 处提前收尾）
                for m in re.finditer(rf'([a-zA-Z0-9_]+)\s*:\s*({TS_STR_CAP})', dict_str):
                    sub_dict[m.group(1)] = _unescape_ts(_captured(m) or '')

                parsed_config[dict_name] = sub_dict

        # 2. 提取外层基础变量（字符串、布尔值、数字）
        for match in re.finditer(rf'([a-zA-Z0-9_]+)\s*:\s*(?:{TS_STR_CAP}|(true|false|\d+))', root_content):
            key = match.group(1)
            str_raw = _captured(match)
            raw_val = match.group(5)  # 布尔或数字（命名组 ts_dq/ts_sq/ts_bq 占 2-4）

            if str_raw is not None:
                parsed_config[key] = _unescape_ts(str_raw)
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
# 接口 2：写入配置 (POST)，带根节点白名单
# =========================================================
@router.post("/update")
def update_site_config(payload: Dict[str, Any] = Body(...)):
    updates = payload.get("updates", {})
    if not updates:
        return {"success": False, "message": "没有收到需要更新的数据"}

    config_path = get_config_path()
    if not config_path:
        return {"success": False, "message": "未能扫描到 siteConfig.ts"}

    # 根节点白名单：拦截非配置字段
    VALID_ROOT_KEYS = {
        "siteUrl", "title", "authorName", "bio", "avatarUrl", "useGradient", "themeColors",
        "bgImages", "bgEnabled", "defaultPostCover", "photoWallImage", "social",
        "counts", "chatterTitle", "chatterDescription", "picBedName", "picBedUrl",
        "picBedToken", "giscusConfig", "buildDate",
        "icpConfig",
        "faviconUrl",
        "navTitle",
        "navSuffix",
        "navAfter",
    }

    def apply_updates(path: str) -> int:
        """把 updates 应用到指定文件，返回成功改动的字段数"""
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        print(f"写入目标文件: {path}")
        count = 0

        for key, value in updates.items():
            # 拦截非白名单字段，防止误写危险字段
            if key not in VALID_ROOT_KEYS:
                print(f"  拦截非根节点字段 -> [{key}]")
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
                # 用能识别转义的 TS_STRING：旧写法 [\s\S]*? 会在 \" 处提前收尾，
                # 含引号的值被二次写入后，文件里会留下裸文本 → 语法错误。
                pattern = rf"({key}\s*:\s*)({TS_STRING}|true|false|\d+)"

            if re.search(pattern, content):
                content = re.sub(pattern, lambda m: m.group(1) + val_str, content, count=1)
                print(f"  已更新 -> [{key}]")
                count += 1
            else:
                # 字段不在文件里（前端加了新字段但 siteConfig 还没写），
                # 静默跳过会让用户以为保存成功，这里如实打印。
                print(f"  文件中没有该字段，已跳过 -> [{key}]")

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
            print("未找到博客前端的 siteConfig.ts，本次只更新了管理端配置")

        print("=" * 50 + "\n")

        if blog_config:
            msg = f"已更新管理端 {n_manager} 个字段、博客前端 {n_blog} 个字段"
        else:
            msg = (f"已更新管理端 {n_manager} 个字段。"
                   "未找到博客前端 siteConfig.ts（请检查【项目仓库设置】里的博客路径）")

        # 3. 一个字都没写进去 = 字段全被白名单拦截（多半是后端版本落后于代码），
        #    必须如实报错，否则前端会显示"成功"的假消息
        if n_manager == 0 and n_blog == 0:
            return {
                "success": False,
                "message": f"没有字段被写入：请求的 {', '.join(updates.keys())} 不在后端白名单里，"
                           "请重启管理端后端后再试",
            }

        return {"success": True, "message": msg}

    except Exception as e:
        print(f"写入发生错误: {str(e)}")
        return {"success": False, "message": f"文件读写错误: {str(e)}"}