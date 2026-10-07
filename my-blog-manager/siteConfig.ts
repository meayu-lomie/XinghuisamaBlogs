// siteConfig.ts - 你的全站"控制中心"

export const siteConfig = {
  // 0. 站点完整地址（RSS / sitemap / 分享链接用；改成本站实际域名）
  siteUrl: "https://meayu-lomie.github.io/XinghuisamaBlogs",

  // 1. 网站标题与博主信息
  title: "Meayu の 拾光集",
  faviconUrl: "/images/20261007_105536_f21a10.png",
  authorName: "Meayu",
  bio: "写代码，也写点别的。把读过的、做过的、想明白的事情整理下来。",

  navTitle: "Meayu",

  // 👇 【新增】导航栏中间的那个后缀/分隔符（默认是 の）
  navSuffix: "の",

  navAfter: "拾光集",

  // 2. 头像设置 (支持网络链接，或将图片放入 public 文件夹后使用 "/me.jpg")
  avatarUrl: "/images/20261007_104847_9effec.png",

  // 3. 网站背景设置 (二选一)
  // 如果想用纯图片背景，请在下面 bgImage 写路径，并将 useGradient 设为 false
  useGradient: false,
  themeColors: ["#a18cd1", "#fbc2eb", "#a1c4fd", "#c2e9fb"], // 呼吸流动的颜色组合
// 修改这里：变成图片数组
  bgImages: ["/images/20261007_015101_7d17f6.jpg", "/images/20261007_103545_a6cf3d.jpg", "/images/20261007_103552_4c1ad2.jpg", "/images/20261007_103601_e178d6.jpg", "/images/20261007_103606_ad0228.jpg", "/images/20261007_103612_195f81.png"],
  bgEnabled: true, // 全站背景轮播开关（在管理端【视觉背景配置】里切换）

  // 4. 文章默认封面图 (当 Markdown 没写 cover 时显示)
  defaultPostCover: "https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg",

  // 5. 首页照片墙预览图
  photoWallImage: "https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg",
  social: {
    github: "https://github.com/meayu-lomie",
    gitee: "", // 待填：填入 Gitee 主页地址后社交按钮会自动出现
    google: "mailto:bilibiliwuwuwu@gmail.com",
    email: "1124533793@qq.com",
    qq: "1124533793",
    wechat: "XingHuisama",
  },
  counts: {
    photos: 128, // 照片墙数量可以手动写死或动态计算
  },
  chatterTitle: "Meayu の 拾光集", // 你可以改成任何你喜欢的名字
  chatterDescription: "代码、学术、提瓦特与泰拉大陆的碎片记录",

  // 👇 【新增】：图床核心配置 (PicBed Configuration)
  picBedName: "图床",
  picBedUrl: "", // 默认的 Lsky Pro API 地址
  picBedToken: "", // 留空，等你能在后台填入并覆写

  // 评论（Giscus，基于 GitHub Discussions）
  giscusConfig: {
    repo: "meayu-lomie/XinghuisamaBlogs",
    repoId: "R_kgDOU994Lg",
    category: "Announcements",
    categoryId: "DIC_kwDOU994Ls4DHK0P",
  },
  buildDate: "2026-03-23T00:00:00", // 建站日期
  footerBadges: [{"name": "Next.js 15", "color": "text-sky-500", "svg": "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\"/>"}, {"name": "React 19", "color": "text-cyan-400", "svg": "<path d=\"M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z\"/>"}, {"name": "Tailwind 4", "color": "text-teal-400", "svg": "<path d=\"M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c-0.913-0.228-1.565-0.89-2.288-1.624c1.177,1.194,2.538,2.576,5.512,2.576 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C10.337,13.382,8.976,12,6.001,12z\"/>"}],
  icpConfig: {
    name: "萌ICP备 20260240号",
    link: "https://icp.gov.moe/?keyword=20260240",
  },
};