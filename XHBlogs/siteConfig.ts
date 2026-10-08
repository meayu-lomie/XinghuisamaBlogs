// siteConfig.ts - 你的全站“控制中心”

export const siteConfig = {
  // 0. 站点完整地址（RSS / sitemap / 分享链接用；改成本站实际域名）
  siteUrl: "https://meayu-lomie.github.io/XinghuisamaBlogs",

  // 1. 网站标题与博主信息
  title: "Meayu の 拾光集",
  faviconUrl: "/images/20261007_105536_f21a10.png",
  authorName: "Meayu",
  bio: "随便写点。",

  navTitle: "Meayu",

  // 导航栏中间的后缀/分隔符
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
  defaultPostCover: "/images/20261007_103601_e178d6.jpg",

  // 5. 首页照片墙预览图
  photoWallImage: "/images/20261007_014558_12db85.jpg",
  social: {
    github: "https://github.com/meayu-lomie",
    gitee: "",
    google: "mailto:bilibiliwuwuwu@gmail.com",
    email: "1124533793@qq.com",
    qq: "1124533793",
    wechat: "Meayu",
  },
  counts: {
    photos: 128, // 照片墙数量可以手动写死或动态计算
  },
  chatterTitle: "Meayu の 拾光集", // 你可以改成任何你喜欢的名字
  chatterDescription: "代码与日常碎片的记录",


  // 评论（Giscus，基于 GitHub Discussions）
  // 配置步骤：https://giscus.app/zh-CN 填入仓库后，把生成的 repo/repoId/category/categoryId 抄到这里
  // 前置条件：仓库公开 + 已开启 Discussions + 已安装 giscus App
  giscusConfig: {
    repo: "meayu-lomie/XinghuisamaBlogs",
    repoId: "R_kgDOU994Lg",
    category: "Announcements",
    categoryId: "DIC_kwDOU994Ls4DHK0P",
  },
  buildDate: "2026-03-23T00:00:00", // 建站日期
  // 备案信息（页脚展示；留空则不渲染）
  icpConfig: {
    name: "萌ICP备 20260240号",
    link: "https://icp.gov.moe/?keyword=20260240",
  },
};