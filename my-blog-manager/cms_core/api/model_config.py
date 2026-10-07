"""
模型设置 API：管理端「AI 润色」功能的模型配置。

配置存储在 my-blog-manager/data/model_config.json（本地文件，不入 Git），
API Key 只落在这份本地文件里；读取接口一律脱敏返回（只回末四位）。
字段：protocol（openai=OpenAI 兼容 / gemini=Gemini 原生）、baseUrl、modelId、apiKey。
"""

import json
import os
import urllib.error
import urllib.request

from fastapi import APIRouter, Body

from cms_core.paths import MANAGER_ROOT

router = APIRouter()

DEFAULT_CONFIG = {
    "protocol": "openai",  # openai=OpenAI 兼容 / gemini=Gemini 原生
    "baseUrl": "https://api.deepseek.com",
    "modelId": "deepseek-chat",
    "apiKey": "",
    # 润色提示词（用户可在模型设置里改；清空 = 恢复以下默认值）
    "polishPromptHtml": (
        "你是一位中文博客文字编辑。用户会给你一段博客正文的 HTML。请润色其中的文字，让表达更流畅、准确、有文采。硬性要求：\n"
        "1. 保持 HTML 标签结构完全不变：所有标签、属性、style、class 原样保留，只允许修改标签内的中文文字；\n"
        "2. 不改变事实、叙述顺序和信息量，不添加原文没有的内容；\n"
        "3. 代码块（pre/code 内）整体原样保留，图片地址、链接地址原样保留；\n"
        "4. 直接输出润色后的完整 HTML，不要任何解释，不要用代码块包裹。"
    ),
    "polishPromptText": (
        "你是一位中文编辑。请润色下面这段文字：表达更流畅自然、修正错别字、去掉口水话，"
        "但保持作者原来的语气和风格，不改变事实，不添加内容。直接输出润色后的文字，不要解释。"
    ),
}


def _config_path() -> str:
    return os.path.join(MANAGER_ROOT, "data", "model_config.json")


def _load_config() -> dict:
    """读取本地配置文件；缺字段用默认值补齐，文件坏了退回默认"""
    cfg = dict(DEFAULT_CONFIG)
    try:
        if os.path.exists(_config_path()):
            with open(_config_path(), "r", encoding="utf-8") as f:
                stored = json.load(f)
            cfg.update({k: v for k, v in stored.items() if k in DEFAULT_CONFIG})
    except Exception:
        pass
    return cfg


def _mask(key: str) -> str:
    if not key:
        return ""
    return f"****{key[-4:]}" if len(key) > 8 else "****"


def _masked_view(cfg: dict) -> dict:
    return {
        **cfg,
        "apiKey": _mask(cfg.get("apiKey", "")),
        "hasKey": bool(cfg.get("apiKey")),
        # 附带默认提示词，前端「恢复默认」按钮用
        "defaultPromptHtml": DEFAULT_CONFIG["polishPromptHtml"],
        "defaultPromptText": DEFAULT_CONFIG["polishPromptText"],
    }

def _merge_updates(cfg: dict, updates: dict) -> dict:
    """把前端提交的字段合并进配置。
    - 脱敏值（****开头）或空 Key：未修改，跳过
    - 提示词字段：空值 = 恢复默认提示词
    - 其他字段：空值跳过"""
    for k in DEFAULT_CONFIG:
        if k not in updates:
            continue
        v = str(updates[k]).strip()
        if k == "apiKey":
            if not v or v.startswith("****"):
                continue
        elif k.startswith("polishPrompt"):
            if not v:
                v = DEFAULT_CONFIG[k]
        elif not v:
            continue
        cfg[k] = v
    return cfg


@router.get("/get")
def get_model_config():
    cfg = _load_config()
    return {"success": True, "data": _masked_view(cfg)}


@router.post("/update")
def update_model_config(payload: dict = Body(...)):
    updates = payload.get("updates") or {}
    cfg = _merge_updates(_load_config(), updates)

    if not cfg.get("apiKey"):
        return {"success": False, "message": "请先填写 API Key"}
    if not cfg.get("baseUrl"):
        return {"success": False, "message": "请求地址不能为空"}
    if not cfg.get("modelId"):
        return {"success": False, "message": "模型 ID 不能为空"}

    try:
        os.makedirs(os.path.dirname(_config_path()), exist_ok=True)
        with open(_config_path(), "w", encoding="utf-8") as f:
            json.dump(cfg, f, ensure_ascii=False, indent=2)
    except Exception as e:
        return {"success": False, "message": f"写入配置文件失败: {e}"}
    return {"success": True, "data": _masked_view(cfg)}


# ==========================================================
# 请求外部模型的最小封装（Python 侧只用于「测试连接」；
# 正文润色走管理端 Next.js 的 /api/polish，两边读同一份配置）
# ==========================================================
def _openai_chat(cfg: dict, prompt: str, timeout: int = 30, max_tokens: int = 16) -> str:
    url = cfg["baseUrl"].rstrip("/") + "/chat/completions"
    body = json.dumps({
        "model": cfg["modelId"],
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
    }).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {cfg['apiKey']}",
    }, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        result = json.loads(resp.read().decode("utf-8"))
    return (result.get("choices") or [{}])[0].get("message", {}).get("content", "").strip()


def _gemini_chat(cfg: dict, prompt: str, timeout: int = 30) -> str:
    base = cfg["baseUrl"].rstrip("/")
    if "/models/" in base:
        url = f"{base}:generateContent"
    elif base.endswith("/v1beta") or base.endswith("/v1"):
        url = f"{base}/models/{cfg['modelId']}:generateContent"
    else:
        url = f"{base}/v1beta/models/{cfg['modelId']}:generateContent"
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
    req = urllib.request.Request(f"{url}?key={cfg['apiKey']}", data=body, headers={
        "Content-Type": "application/json",
    }, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        result = json.loads(resp.read().decode("utf-8"))
    parts = ((result.get("candidates") or [{}])[0].get("content") or {}).get("parts") or [{}]
    return str(parts[0].get("text", "")).strip()


@router.post("/test")
def test_model_connection(payload: dict = Body(...)):
    """用「当前已保存 + 表单里未保存的值」发一条最小请求，验证连通性"""
    cfg = _merge_updates(_load_config(), payload.get("updates") or {})
    if not cfg.get("apiKey"):
        return {"success": False, "message": "请先填写 API Key"}
    try:
        if cfg.get("protocol") == "gemini":
            reply = _gemini_chat(cfg, "连接测试，请只回复：OK")
        else:
            reply = _openai_chat(cfg, "连接测试，请只回复：OK")
        return {"success": True, "message": f"连接成功，模型回复：{reply[:50] or '(空)'}"}
    except urllib.error.HTTPError as e:
        detail = ""
        try:
            detail = e.read().decode("utf-8", "ignore")[:200]
        except Exception:
            pass
        return {"success": False, "message": f"请求失败 HTTP {e.code}：{detail}"}
    except Exception as e:
        return {"success": False, "message": f"连接失败：{e}"}
