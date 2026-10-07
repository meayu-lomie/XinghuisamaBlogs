# Meayu の 拾光集

A paper-textured personal blog system: Xuan-paper / Journal layouts × light/dark, seal-red accent, paper cards layered over a site-wide background slideshow. This is a personalized fork of [XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs), with a frontend (`XHBlogs/`) and a local management console (`my-blog-manager/`) supporting rich-text writing, AI polishing & summarizing, and draft management.

[![English](https://img.shields.io/badge/Language-English-blue.svg)](README_en.md)
[![中文](https://img.shields.io/badge/语言-中文-red.svg)](README.md)

---

## Content Model

Only two content types, with fixed names:

| Type | Location | Notes |
|---|---|---|
| Chatter (杂谈) | `XHBlogs/chatters/*.md` | Long-form posts; frontmatter: `title / date / tags / mood / cover / description / summary`; supports drafts |
| Moments (说说) | `XHBlogs/moments/*.md` | Short updates; frontmatter: `date / location / images`; published instantly |

**Single source of truth = the `XHBlogs/` directory**: the FastAPI backend reads and writes the blog directory directly (`cms_core/paths.py`). There is no "sync" step — what the console shows is what the blog serves.

## Features

**Frontend (XHBlogs, Next.js 16 + Tailwind v4)**

- Paper theme: Xuan-paper (`.theme-xuan`) / Journal (`.theme-journal`) × light/dark; site-wide palette remapping (accents → seal red, text → ink tones); `paper-card` utility at 92% paper translucency
- Home: profile card, latest-moments carousel, photo-wall banner, chatter carousel, site-wide search (chatter + moments)
- Chatter detail: reading time & word count, table of contents, code copy button, prev/next navigation, clickable tag badges, AI summary card, giscus comments
- Page transitions: View Transitions API (250ms, shared cover/avatar elements, graceful fallback)
- Tag aggregation pages, timeline, photo wall (lightbox), projects, about page
- Infrastructure: RSS (`/feed.xml`), sitemap, robots, OpenGraph metadata

**Console (my-blog-manager, Next.js + FastAPI)**

- Chatter editor (TipTap rich text, AI polishing with preview & confirm), drafts (chatter only), instant moments publishing
- Settings: profile, background (site-wide slideshow toggle), gallery, comments, model, repository
- AI: polishing & summarizing share one model config (`data/model_config.json`, OpenAI-compatible / Gemini-native, keys never leave the server); an ~80-word summary is generated on publish and cached into frontmatter
- Images: stored locally under `XHBlogs/public/images/`, auto-compressed on upload (max edge 2000px + JPEG 85; PNG transparency preserved)
- Deploy helper: repository settings → push source to GitHub → Vercel auto-builds (`cms_core/api/deploy.py`)

## Quick Start

Requirements: Node.js 18+, npm, Python 3.10+, Git.

1. **Blog frontend**: run `XHBlogs/启动博客前端.bat` (`npm run dev` → http://localhost:3000)
2. **Console**: run `my-blog-manager/启动管理端.bat` (`python launcher.py`; frontend & FastAPI ports are generated in pairs)
3. **First run**: set the local path of `XHBlogs` in the console under repository settings

> Notes: restart the console after editing `cms_core/*.py` (uvicorn has no hot reload); Next 16 allows only one dev server per directory.

## Deployment

Vercel is recommended (first-class Next.js support):

1. Create a private GitHub repo for the `XHBlogs` source (the console can initialize and push it via repository settings; a Deploy Key with write access is required)
2. Import the repo on Vercel with the Next.js preset and deploy
3. Trigger redeploys from the console's source-sync action; bind custom domains in Vercel's Domains tab
4. Update `siteUrl` in both `siteConfig.ts` files with your final domain (used by RSS / sitemap)

## Configuration Notes

- **Site config**: `siteConfig.ts` exists in both projects; adding a root field requires four synchronized places (both siteConfigs + the `cms_core/api/config.py` whitelist + settings formData) — see [AGENTS.md](AGENTS.md)
- **Model config**: `my-blog-manager/data/model_config.json` (contains API keys; gitignored)
- **Comments**: giscus (GitHub Discussions), configured via `giscusConfig` in siteConfig
- **Images**: local only (`public/images/`), referenced as `/images/xxx.png`; no external CDN dependencies

## Key Differences from Upstream

- Removed: post type, music player, AI cat assistant, effect components (sakura/snow/fireflies), friend links, level system, dual-track sync
- Added: paper theme system, AI polishing & summaries, tag pages, RSS/sitemap, view transitions, background slideshow, reading stats, direct-write architecture

## License

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

> Licensed under the upstream [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). Free to study, share and modify (attribution required when republishing); **commercial use is strictly prohibited**.
>
> Upstream project: [heiehiehi/XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) — thanks to the original author for the great work.
