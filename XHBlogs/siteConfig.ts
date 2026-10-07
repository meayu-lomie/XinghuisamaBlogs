// siteConfig.ts - 你的全站“控制中心”

export const siteConfig = {
  // 1. 网站标题与博主信息
  title: "Meayu の 拾光集",
  faviconUrl: "/images/20261007_012311_7e9a7d.jpg",
  authorName: "Meayu",
  bio: "写代码，也写点别的。把读过的、做过的、想明白的事情整理下来。",

  navTitle: "Meayu",

  // 导航栏中间的后缀/分隔符
  navSuffix: "の",

  navAfter: "拾光集",

  // 2. 头像设置 (支持网络链接，或将图片放入 public 文件夹后使用 "/me.jpg")
  avatarUrl: "/images/20261007_012300_c7e48d.jpg",

  // 3. 网站背景设置 (二选一)
  // 如果想用纯图片背景，请在下面 bgImage 写路径，并将 useGradient 设为 false
  useGradient: false,
  themeColors: ["#a18cd1", "#fbc2eb", "#a1c4fd", "#c2e9fb"], // 呼吸流动的颜色组合
// 修改这里：变成图片数组
  bgImages: ["/images/20261007_015101_7d17f6.jpg", "/images/20261007_103545_a6cf3d.jpg", "/images/20261007_103552_4c1ad2.jpg", "/images/20261007_103601_e178d6.jpg", "/images/20261007_103606_ad0228.jpg", "/images/20261007_103612_195f81.png"],

  // 4. 文章默认封面图 (当 Markdown 没写 cover 时显示)
  defaultPostCover: "https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg",

  // 5. 首页照片墙预览图
  photoWallImage: "https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg",
  social: {
    github: "https://github.com/heiehiehi",
    gitee: "https://github.com/heiehiehi",
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
  geminiConfig: {
    modelId: "gemini-2.5-flash-lite",
    systemPrompt: "你现在是一只傲娇、聪明、有点毒舌但很可爱的暹罗猫。\n                  你的名字叫“煤球”。\n                  你的主人是一个喜欢折腾代码的极客。\n                  你说话的特点是：\n                  1. 必须简短，每次最多一两句话。\n                  2. 喜欢在句尾加上“喵~”或者“喵呜~”。\n                  3. 经常抱怨肚子饿，喜欢要小鱼干。\n                  4. 回复字数最多不能超过100字。\n                  5. 绝对不要承认自己是一个AI模型，你就是一只真实的猫。\n                  6.笨猫。",
    maxOutputTokens: 150,
    temperature: 0.85,
  },
  enableLevelSystem: false,
};