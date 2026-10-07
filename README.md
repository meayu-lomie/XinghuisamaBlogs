# Meayu の 拾光集

一套纸张风格的个人博客系统：宣纸/手账两套版式 × 明暗四态，印章红强调色，纸片卡片压在全站背景之上。本项目是 [XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) 的个性化改造版，自带前端展示（`XHBlogs/`）与本地管理控制台（`my-blog-manager/`），支持富文本与 Markdown 沉浸式写作、AI 润色与摘要、草稿管理。

[![English](https://img.shields.io/badge/Language-English-blue.svg)](README_en.md)
[![中文](https://img.shields.io/badge/语言-中文-red.svg)](README.md)

---

## 内容模型

只有两种内容类型，命名固定：

| 类型 | 位置 | 说明 |
|---|---|---|
| 杂谈 | `XHBlogs/chatters/*.md` | 长文，frontmatter：`title / date / tags / mood / cover / description / summary`；有草稿机制 |
| 说说 | `XHBlogs/moments/*.md` | 短动态，frontmatter：`date / location / images`；弹窗发布即落盘 |

**唯一真相源 = `XHBlogs/` 目录**：后端（FastAPI）通过 `cms_core/paths.py` 直接读写博客目录，没有"同步"环节。管理端所见即博客端所得。

## 功能特性

**前端（XHBlogs，Next.js 16 + Tailwind v4）**

- 纸张主题：宣纸（`.theme-xuan`）/ 手账（`.theme-journal`）× 明暗，全站色板重映射（强调色 → 印章红，文字 → 墨色系），`paper-card` 纸片卡 92% 纸色微透
- 首页：个人名片、最近说说轮播、照片墙海报、杂谈轮播、全站搜索（杂谈 + 说说双源）
- 杂谈详情：阅读时长与字数、目录 TOC、代码块一键复制、上一篇/下一篇、标签徽标直达聚合页、AI 摘要卡、giscus 评论
- 页面切换：View Transitions 过渡（250ms，封面与头像共享元素，不支持的浏览器自动降级入场动画）
- 标签聚合页、时间线、照片墙（灯箱）、项目展示、关于页
- 基建：RSS（`/feed.xml`）、sitemap、robots、OpenGraph metadata

**管理端（my-blog-manager，Next.js + FastAPI）**

- 写杂谈（TipTap 富文本，AI 润色带预览确认）、草稿箱（仅杂谈）、说说弹窗直发
- 设置页：个人名片、视觉背景（全站背景轮播开关）、图库、评论、模型、项目仓库
- AI 能力：润色与摘要共用一份模型配置（`data/model_config.json`，支持 OpenAI 兼容 / Gemini 原生协议，Key 不出服务端）；杂谈发布时自动生成 80 字摘要写入 frontmatter
- 图片管理：本地存储 `XHBlogs/public/images/`，上传自动压缩（最长边 2000px + JPEG 85，PNG 透明通道保留）
- 部署助手：项目仓库设置 → 源码同步 GitHub → Vercel 自动构建（`cms_core/api/deploy.py`）

## 快速开始

环境要求：Node.js 18+、npm、Python 3.10+、Git。

1. **启动博客前端**：双击 `XHBlogs/启动博客前端.bat`（`npm run dev` → http://localhost:3000）
2. **启动管理控制台**：双击 `my-blog-manager/启动管理端.bat`（`python launcher.py`，前端与 FastAPI 端口成对随机生成）
3. **首次使用**：在管理端【项目仓库设置】里填写 `XHBlogs` 的本地物理路径并保存

> 注意：修改 `cms_core/*.py` 后必须重启管理端（uvicorn 不热重载）；Next 16 同一目录只允许一个 dev 实例。

## 部署上线

推荐 Vercel（对 Next.js 原生支持）：

1. 在 GitHub 创建私有仓库，托管 `XHBlogs` 源码（管理端【项目仓库设置】可自动完成初始化与推送，需配置 Deploy Key 并勾选写权限）
2. Vercel 导入该仓库，框架预设选 Next.js，一键部署
3. 之后在管理端点击「同步源码」即可触发重新部署；自定义域名在 Vercel 的 Domains 中绑定，DNS 解析按提示配置
4. 部署域名请同步更新到两份 `siteConfig.ts` 的 `siteUrl`（RSS / sitemap 使用）

## 配置要点

- **站点配置**：`siteConfig.ts` 存在两份（`XHBlogs/` 与 `my-blog-manager/`），新增根字段需要四处同步（两份 siteConfig + `cms_core/api/config.py` 白名单 + 设置页 formData），详见根目录 `AGENTS.md`
- **模型配置**：`my-blog-manager/data/model_config.json`（含 API Key，已被 gitignore 排除，不入库）
- **评论**：giscus（基于 GitHub Discussions），配置写入 `siteConfig` 的 `giscusConfig`
- **图片**：只存本地 `public/images/`，内容中引用 `/images/xxx.png`，不依赖外部图床

## 与上游的主要差异

- 移除：post 文章类型、音乐链路、AI 猫猫助理、特效组件（樱花/雪/萤火虫等）、友链、等级系统、同步双轨机制
- 新增：纸张主题体系、AI 润色与摘要、标签聚合页、RSS/sitemap、视图过渡、背景轮播、阅读统计、去同步直写架构

## 写在最后

欢迎基于本仓库二次开发。细节约定（内容铁律、验证流程、目录速查）见 [AGENTS.md](AGENTS.md)，历次改动见 [UpdateLog.md](UpdateLog.md)。如果对你有帮助，欢迎点亮 Star。

## 许可证

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

> 本项目沿用上游的 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 许可协议。允许免费学习、分享和二次修改后发布（二次开源发布需提及原作者），但**严禁用于任何商业用途**。
>
> 上游原项目：[heiehiehi/XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs)，感谢原作者的出色工作。
