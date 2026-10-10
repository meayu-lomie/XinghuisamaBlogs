import os
import json
import time
import yaml
from fastapi import APIRouter, Request
from datetime import datetime
import re
import markdown  # 确保你已经安装了 markdown 库 (pip install markdown)
from markdownify import markdownify as md

router = APIRouter()

# 内容读写统一走博客前端目录（见 cms_core/paths.py），不再有"同步"环节
from cms_core.paths import get_blog_root, blog_path_or_none, MANAGER_ROOT, safe_id
from cms_core.api.model_config import _load_config, _openai_chat, _gemini_chat


def _generate_ai_summary(md_text: str) -> str:
    """
    发布杂谈时调用已配置的模型生成文章摘要，写入 frontmatter 的 summary 字段。
    模型未配置、调用失败都不阻塞发布——返回空字符串即可，前端有 summary 才渲染摘要卡。
    """
    try:
        cfg = _load_config()
        if not cfg.get("apiKey") or not cfg.get("modelId"):
            print("[drafts] AI 摘要跳过：模型未配置（API Key / 模型 ID 为空）")
            return ""
        excerpt = md_text[:3000]  # 截断正文，控制 token 消耗
        prompt = (
            "请为下面这篇博客文章生成一段简短的中文摘要，"
            "要求不超过 80 字、只输出摘要本身、不要任何前缀、引号或解释：\n\n" + excerpt
        )
        if cfg.get("protocol") == "gemini":
            summary = _gemini_chat(cfg, prompt, timeout=45)
        else:
            summary = _openai_chat(cfg, prompt, timeout=45, max_tokens=200)
        summary = summary.strip().strip('"').strip('"').replace("\n", " ")
        print(f"[drafts] AI 摘要生成成功（{len(summary)} 字）")
        return summary[:200]
    except Exception as e:
        # 摘要是锦上添花的功能，失败必须如实记日志但不能拦住发布主流程
        print(f"[drafts] AI 摘要生成失败（不影响发布）: {e}")
        return ""


def get_manager_drafts_dir() -> str:
    # 草稿仍留在后端自己的 manager_data 下（草稿属于"未发布"状态，不该进博客仓库）
    drafts_dir = os.path.join(MANAGER_ROOT, "manager_data", "drafts")
    if not os.path.exists(drafts_dir):
        os.makedirs(drafts_dir)
    return drafts_dir


@router.post("/save")
async def save_draft(request: Request):
    try:
        payload = await request.json()
    except Exception:
        return {"success": False, "message": "后端无法解析传来的 JSON 数据"}

    drafts_dir = get_manager_drafts_dir()
    # id 来自请求体，会被拼成文件名，先净化防止 ../ 穿越
    raw_id = payload.get("id")
    draft_id = safe_id(raw_id) if raw_id and raw_id != 'new' else ""

    if not draft_id:
        draft_id = f"draft_{int(time.time() * 1000)}"
    elif payload.get("type") == "about":
        draft_id = "about"

    draft_data = {
        "id": draft_id,
        "type": payload.get("type", "chatter"),
        "title": payload.get("title", ""),
        "description": payload.get("description", ""),
        "content": payload.get("content", ""),
        "cover": payload.get("cover", ""),
        "tags": payload.get("tags", []),
        "mood": payload.get("mood", ""),
        "date": payload.get("date", ""),
        "lastModified": int(time.time() * 1000)
    }

    file_path = os.path.join(drafts_dir, f"{draft_id}.json")
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(draft_data, f, ensure_ascii=False, indent=2)
        return {"success": True, "message": "草稿已保存", "id": draft_id}
    except Exception as e:
        return {"success": False, "message": f"草稿保存失败: {str(e)}"}


@router.post("/list")
async def list_drafts(request: Request):
    drafts_dir = get_manager_drafts_dir()
    drafts = []
    if not os.path.exists(drafts_dir):
        return {"success": True, "drafts": []}

    for filename in os.listdir(drafts_dir):
        if filename.endswith(".json"):
            file_path = os.path.join(drafts_dir, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    content = data.get("content", "")
                    data["contentPreview"] = content[:100] if content else ""
                    if "content" in data: del data["content"]
                    drafts.append(data)
            except Exception:
                continue
    drafts.sort(key=lambda x: x.get("lastModified", 0), reverse=True)
    return {"success": True, "drafts": drafts}


@router.post("/get")
async def get_draft(request: Request):
    try:
        payload = await request.json()
    except Exception:
        return {"success": False, "message": "JSON 解析失败"}

    # id 会被拼成文件名，先净化防止 ../ 穿越
    raw_id = safe_id(payload.get("id", "").replace(".md", ""))
    doc_type = payload.get("type", "chatter")
    base_dir = get_blog_root()
    if not base_dir:
        return {"success": False, "message": "还没设置博客目录，请到【设置 → 项目仓库设置】里填一下"}

    drafts_dir = get_manager_drafts_dir()
    # 1. 优先从草稿箱读取 JSON
    file_path = os.path.join(drafts_dir, f"{raw_id}.json")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return {"success": True, "draft": json.load(f)}

    # 2. 如果没有草稿，从物理 MD 文件读取并解析
    target_md = None
    if raw_id == "about" or doc_type == "about":
        target_md = os.path.join(base_dir, "app", "about", "about.md")
    else:
        target_md = os.path.join(base_dir, "chatters", f"{raw_id}.md")

    if target_md and os.path.exists(target_md):
        try:
            with open(target_md, "r", encoding="utf-8") as f:
                raw_content = f.read()

            title, cover, description, mood, date = "", "", "", "", ""
            tags = []
            md_body = raw_content

            # 拆解 YAML Front Matter
            if raw_content.strip().startswith("---"):
                parts = raw_content.split("---", 2)
                if len(parts) >= 3:
                    try:
                        fm = yaml.safe_load(parts[1])
                        if fm:
                            title = fm.get("title", "")
                            cover = fm.get("cover", "")
                            description = fm.get("description", "")
                            mood = fm.get("mood", "")
                            date = fm.get("date", "")
                            tags = fm.get("tags", [])
                            if not isinstance(tags, list): tags = [tags] if tags else []
                        md_body = parts[2].strip()
                    except:
                        pass

            # 将 Markdown 转换为编辑器认识的 HTML
            html_content = markdown.markdown(md_body, extensions=['fenced_code', 'tables', 'nl2br'])

            draft_data = {
                "id": raw_id,
                "type": doc_type,
                "title": title or ("关于我" if doc_type == "about" else ""),
                "content": html_content,
                "tags": tags,
                "cover": cover,
                "description": description,
                "mood": mood,
                "date": date
            }
            return {"success": True, "draft": draft_data}
        except Exception as e:
            return {"success": False, "message": f"解析物理文件失败: {str(e)}"}

    return {"success": False, "message": "未找到相关文件"}


@router.post("/delete")
async def delete_draft(request: Request):
    try:
        payload = await request.json()
    except Exception:
        return {"success": False, "message": "JSON 解析失败"}

    # id 会被拼成文件名，先净化防止 ../ 穿越
    raw_id = safe_id(payload.get("id", "").replace(".md", "").replace(".json", ""))
    base_dir = get_blog_root()
    if not base_dir:
        return {"success": False, "message": "还没设置博客目录，请到【设置 → 项目仓库设置】里填一下"}
    drafts_dir = get_manager_drafts_dir()

    possible_paths = [
        os.path.join(drafts_dir, f"{raw_id}.json"),
        os.path.join(base_dir, "chatters", f"{raw_id}.md")
    ]

    deleted_count = 0
    for p in possible_paths:
        if os.path.exists(p):
            try:
                os.remove(p)
                deleted_count += 1
            except:
                continue

    if deleted_count > 0:
        return {"success": True, "message": "已删除"}
    return {"success": False, "message": "未找到相关文件"}


@router.post("/sync_local")
async def sync_local_operations(request: Request):
    payload = await request.json()
    operations = payload.get("operations", [])
    base_dir = get_blog_root()
    if not base_dir:
        return {"success": False, "message": "还没设置博客目录，请到【设置 → 项目仓库设置】里填一下"}
    drafts_dir = get_manager_drafts_dir()
    results = []

    for op in operations:
        if op.get("type") == "publish_article":
            data = op.get("value", {})
            doc_type = data.get("type", "chatter")
            # 净化后的 id 同时用于文件名与草稿清理，保证两者指向同一份草稿
            doc_id = safe_id(data.get("id", ""))

            final_id = doc_id
            if not final_id or final_id == 'new':
                final_id = f"{doc_type}_{int(time.time())}"

            # ==========================================
            # 防吞空行：在交给 markdownify 之前先处理 HTML
            # ==========================================
            raw_html = data.get("content", "")

            # 1. 拦截带全角空格的空段落与原生空段落
            # 我们直接把它们替换成带有 HTML 换行符的强硬结构
            raw_html = re.sub(r'<p>&#12288;<\/p>', '<br><br>', raw_html)
            raw_html = re.sub(r'<p><\/p>', '<br><br>', raw_html)

            # 2. 基础转换，保留 img
            # 保留 br 标签
            md_content = md(raw_html, heading_style="ATX", keep=['img', 'br'])

            # 3. markdownify 可能会把 <br> 留下来，
            # 为了让 MD 里出现真实空行，把保留下来的 <br> 替换为 \n\n
            md_content = re.sub(r'<br\s*\/?>', '\n\n', md_content)
            # ==========================================

            # 处理日期与精确时间
            input_date = str(data.get("date", "")).strip()
            if input_date:
                # 如果前端只传了 "YYYY-MM-DD" (长度 <= 10)，帮它补上现在的时分秒
                if len(input_date) <= 10:
                    current_time = datetime.now().strftime("%H:%M:%S")
                    final_date = f"{input_date} {current_time}"
                else:
                    final_date = input_date
            else:
                # 如果没传，生成完整的当前时间
                final_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            fm = {
                "title": data.get("title", ""),
                "date": final_date,
                "tags": data.get("tags", []),
                "mood": data.get("mood", ""),
                "cover": data.get("cover", ""),
                "description": data.get("description", "")
            }

            # AI 摘要：仅杂谈在发布时生成一次并缓存进 frontmatter（about 页不生成）
            if doc_type != "about":
                summary = _generate_ai_summary(md_content)
                if summary:
                    fm["summary"] = summary

            final_text = f"---\n{yaml.dump(fm, allow_unicode=True, sort_keys=False)}---\n\n{md_content}"

            if doc_type == "about":
                save_path = os.path.join(base_dir, "app", "about", "about.md")
            else:
                save_path = os.path.join(base_dir, "chatters", f"{final_id}.md")

            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            with open(save_path, "w", encoding="utf-8") as f:
                f.write(final_text)

            draft_path = os.path.join(drafts_dir, f"{doc_id}.json")
            if os.path.exists(draft_path):
                try:
                    os.remove(draft_path)
                except:
                    pass

            results.append(f"已发布: {fm['title']}")

    return {"success": True, "message": "\n".join(results)}



@router.get("/all_tags")
async def get_all_historical_tags():
    """收集历史标签，供编辑器标签输入框做候选。

    只有「杂谈」一种内容类型（文章/post 已删除），所以只扫 chatters。
    """
    base_dir = get_blog_root()
    if not base_dir:
        return {"success": True, "chatterTags": []}

    scan_dirs = {"chatter": os.path.join(base_dir, "chatters")}
    tag_collections = {"chatter": set()}
    fm_regex = re.compile(r'---\s*\n(.*?)\n---\s*', re.DOTALL)

    for doc_type, dir_path in scan_dirs.items():
        if not os.path.exists(dir_path): continue
        for filename in os.listdir(dir_path):
            if filename.endswith(".md"):
                try:
                    with open(os.path.join(dir_path, filename), "r", encoding="utf-8") as f:
                        match = fm_regex.search(f.read())
                        if match:
                            fm = yaml.safe_load(match.group(1))
                            if fm and "tags" in fm:
                                for t in (fm["tags"] if isinstance(fm["tags"], list) else [fm["tags"]]):
                                    tag_collections[doc_type].add(str(t))
                except:
                    continue
    return {"success": True, "chatterTags": sorted(list(tag_collections["chatter"]))}