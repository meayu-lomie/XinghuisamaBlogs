# 星辉拾光集 · 项目规则（AGENTS.md）

> 仓库：`meayu-lomie/XinghuisamaBlogs`（fork 自 heiehiehi/XinghuisamaBlogs）。
> 两个子目录各有 Next.js 自动生成的 `AGENTS.md`（Next 版本提示），**不要修改它们**；本文件是仓库根的项目规则总纲，二者都要读。

## 1. 仓库结构

| 路径 | 说明 |
|---|---|
| `XHBlogs/` | **博客前端**（Next.js，端口 3000），对外展示 |
| `my-blog-manager/` | **管理控制台**（Next.js + Python FastAPI），后台创作与设置 |
| `my-blog-manager/cms_core/` | Python 后端（FastAPI + uvicorn，由 `launcher.py` 拉起） |

## 2. 内容模型（铁律）

- **只有两种内容类型**：`杂谈`（`XHBlogs/chatters/`）和 `说说`（`XHBlogs/moments/`）。
- **`文章`（post）类型已彻底删除**，不要恢复：不要重建 `/posts` 路由、不要恢复 `post` 类型、不要恢复 `LatestPostsCarousel`。
- **名称固定**「杂谈」「说说」，不要再改（曾用备选：随笔 / 动态）。
- **内容唯一真相源 = `XHBlogs/` 目录**。后端通过 `cms_core/paths.py` 的 `get_blog_root()` / `getBlogDir()` 直接读写博客目录。**没有同步环节**（同步架构已删除，不要重建）。
- **草稿**：只有「杂谈」有草稿（存 `my-blog-manager/manager_data/drafts`）。**说说没有草稿机制**（说说页弹窗发布即落盘，别给说说加草稿，除非用户明确要求）。

## 3. 后台导航（管理端）

`写杂谈 / 草稿箱 / 时间线 / 说说 / 杂谈 / 照片墙 / 项目 / 关于 / 设置`

- 「写杂谈」→ `/editor`（编辑器默认 `type=chatter`）。
- 「关于」→ 管理端展示页（读博客目录 `app/about/about.md`）＋「编辑关于页」入口。

## 4. 主题与样式

- 纸张主题：`.theme-xuan`（宣纸）/ `.theme-journal`（手账）× 明/暗。
- CSS 变量：`--paper`、`--paper-deep`、`--ink`、`--ink-soft`、`--ink-faint`、`--rule`、`--accent`（印章红）、`--accent-soft`、`--card`、`--card-border`、`--code-bg`、`--paper-grain-*`、`--grid`、`--tape-*`。
- **`indigo/pink/purple` 色族已重映射到 `--accent`**，所以 `bg-indigo-500` / `text-indigo-500` 就是强调色（印章红）。新增 UI 用这些工具类表达强调色，不要写死 hex。
- 层级：**背景轮播 `z-0`** ← 纸纹 `body::after` `z-1` ← 内容 `z-10`。
- **禁止 emoji**，界面文案中文。
- 保留英文装饰标签时格式：`中文 · English`（如 `杂谈 · Records`、`说说 · Moments`）。
- Tailwind v4：自定义动画用 `@utility` 写在 `globals.css`，裸 CSS 类不会生效。

## 5. 设置页的配置写入机制（重点）

两种模式：

**A. 队列模式（siteConfig 类：个人名片 / 视觉背景 / 图库 / 评论）**
`handleUpdate` 改 `formData` → 点「暂存」按钮 `pushToQueue` → Navbar「写入博客」→ `POST /api/config/update { updates: payload }` → **同时写两份 siteConfig.ts**（管理端＋博客前端）。

⚠️ **`pushToQueue` 的 payload 是整个 `formData` 快照**；它接收的 `key`/`value` 参数在 Navbar 的 `CONFIG` 分支**被忽略**。所以：
- 开关类控件要么先 `handleUpdate` 再让用户点「暂存」；
- 要么（如「全站背景轮播」开关）**直接调 API 立即生效**，不要只 `pushToQueue` 传个 value 就完了——那会产生"假消息"。

**B. 直接 API 模式（模型设置、`bgEnabled` 开关等）**
直接 `POST http://127.0.0.1:<api_port>/api/config/update`，立即生效。

**新增 siteConfig 根字段必须同时做四件事**（漏一件就写不进去）：
1. 加进 `XHBlogs/siteConfig.ts`
2. 加进 `my-blog-manager/siteConfig.ts`
3. 加进 `cms_core/api/config.py` 的 `VALID_ROOT_KEYS`（否则被静默拦截）
4. 加进 `my-blog-manager/app/settings/page.tsx` 的 `formData` 初始化

**不要假装成功**：`config.py` 在"0 个字段被写入"时返回 `success: False`。前端要如实报错，不要只显示"已加入队列"。

## 6. 日期处理

- **禁止用 `toISOString()` 生成用户可见日期**（UTC+8 凌晨会差一天，已踩过坑）。
- 用 `toLocaleDateString('sv-SE')` / `toLocaleString('sv-SE')`。
- 存储：说说用完整时间戳；杂谈用 `YYYY-MM-DD HH:MM:SS`。

## 7. 已删除、不要恢复

- 音乐链路：`MusicPlayer` / `MusicProvider` / `CloudPlayer` / `LyricBar` / `SidebarLyric` / `app/api/music`
- 小猫 AI：`app/api/chat`（两个子项目）、`app/api/test`、`app/api/weather`
- 特效组件：`BackgroundEffects`、`BackgroundSlider`、`Sakura`、`Fireflies`、`GlobalSnow`、`ClickEffect`、`SplashScreen`、`SiteDashboard`、`ThemeToggleBlock`、`WeatherWidget`、`WindyGrass`、`DanmakuBackground`、`CyberCat`、`LabComments`、`GlobalToolbox`
- 友链：`friends`
- 工具箱：`components/toolbox/CalculatorTool`
- 「归档」已改名**「时间线」**（`/timeline`）

## 8. 图片

- 图片**只存本地** `XHBlogs/public/images/`，内容里写 `/images/xxx.png`。
- 上传自动压缩：最长边 2000px + JPEG 质量 85（PNG 带透明通道保留）。
- 不用 jsDelivr、不用远程 CDN。`defaultPostCover` / `photoWallImage` 的历史外链可保留，但**不要再新增外链依赖**。
- 管理端预览图片走 `app/images/[name]/route.ts`（代理到博客目录，含目录穿越防护）。

## 9. AI 润色

- 入口：编辑器工具栏按钮、说说发布框「AI 润色」→ `POST /api/polish`（Node route，服务端读 `data/model_config.json`，Key 不出服务端）。
- 模型设置（设置 → 模型设置）：协议（OpenAI 兼容 / Gemini 原生）、请求 URL、模型 ID、API Key（存 `my-blog-manager/data/model_config.json`，**不入库**，脱敏回显 `****xxxx`）。
- 润色提示词可配置（正文模式 / 纯文本模式两个文本框 +「恢复默认」）。
- 交互：**预览确认**（展示润色结果 → 「应用」/「丢弃」），不要直接覆盖原文。

## 10. 命令与端口

- 博客前端：`XHBlogs/启动博客前端.bat`（npm run dev → 3000）。
- 管理端：`my-blog-manager/启动管理端.bat`（`python launcher.py` → 随机端口）；`api_port` 从 `my-blog-manager/public/backend_config.json` 读取。
- ⚠️ **改 `cms_core/*.py` 后必须重启后端**（uvicorn 不热重载）。建议整个 launcher 一起重启：前端与后端端口成对生成，只重启其中一个会导致 `backend_config.json` 的端口与现役后端不匹配 → 设置页报"后端未连接"。
- ⚠️ Next 16 同一目录只允许一个 dev 实例，重复启动会报 `Another next dev server is already running`。**不要动用户自己跑着的 3000 端口博客前端进程**；验证优先用现役实例或临时端口，验证完关掉临时进程。

## 11. 验证流程（改完必做）

1. **两个项目分别 `npx tsc --noEmit`，必须 0 错误**（当前基线就是 0，不要引入新错误）。
2. 页面渲染检查：博客端 `http://localhost:3000`（首页 / 时间线 / 杂谈 / 说说）；管理端现役端口（首页重定向到 `/editor`，设置页 `/settings`）。
3. **API / 配置改动必须端到端验证**：确认字段真的写进**两份** `siteConfig.ts`，且对应页面渲染真的变化。**不要只看 `success: true`**——曾出现 `success=True` 但 0 字段写入的"假消息"（因为后端白名单没加载）。**改 `config.py` 白名单后未重启后端 = 静默失败**。教训：宁可重启后端再验证；测试后把临时改的配置恢复原值。

## 12. 协作偏好

- **先梳理、不确定就问，再动手**（用户明确要求："不确定先问我再动手，明确之后再改"）。
- 修改前先勘察（grep / read），改完如实汇报"改了什么 / 实际验证了什么 / 残留风险"。
- 端到端验证要渲染确认，不靠推断；没打通就说没打通，不要报告"已完成"。

## 13. Git 与提交

- commit message 用**中文**；**禁止** AI 署名 / `Co-Authored-By`。
- 提交前确认只含目标文件。

## 14. `.gitignore` 已排除（不要提交）

- `data/model_config.json`（含 API Key）
- `data/deploy_config.json`（本机博客路径）
- `public/backend_config.json`（端口）
- `window_config.json`、`__pycache__/`、`manager_data/`
- `XHBlogs/_sync_backup/`（同步时代备份）
- `my-blog-manager/posts`、`chatters`、`moments`（陈旧副本，真相源在 XHBlogs）

## 15. 编辑工具注意事项

- 同一 `Edit` 调用内的多个 `ops` 共享同一份行号基线且不重叠；改完一处要重新 `Read` 再改下一处（否则会错位 / 吞行，曾多次造成结构损坏）。
- PowerShell 里正则用**单引号**；路径含 `[]` 或 `()` 用 `-LiteralPath`；含 `(` 的文件名（如 `(3`）要用变量拼接路径，否则报错。

## 16. 关键文件路径速查

| 用途 | 文件 |
|---|---|
| 内容读写路径解析 | `my-blog-manager/cms_core/paths.py` |
| 站点配置读写 + 白名单 | `my-blog-manager/cms_core/api/config.py` |
| 草稿 / 杂谈读写 | `my-blog-manager/cms_core/api/drafts.py` |
| 图片上传 / 压缩 | `my-blog-manager/cms_core/api/picbed.py` |
| 模型配置 | `my-blog-manager/cms_core/api/model_config.py` |
| 润色代理 | `my-blog-manager/app/api/polish/route.ts` |
| 博客首页 | `XHBlogs/app/page.tsx` |
| 博客布局（背景轮播挂载点） | `XHBlogs/app/layout.tsx` |
| 主题变量 + 色板重映射 | `XHBlogs/app/globals.css` |
