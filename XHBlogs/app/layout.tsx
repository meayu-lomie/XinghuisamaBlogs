import 'katex/dist/katex.min.css';
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_SC } from "next/font/google";
import { ViewTransitions } from 'next-view-transitions';
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import Navbar from "../components/Navbar";
import BackgroundSlideshow from "../components/BackgroundSlideshow";
import { siteConfig } from "../siteConfig";
import MobileBackButton from '../components/MobileBackButton';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-serif",
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: siteConfig.title,
  description: siteConfig.bio,
  icons: {
    icon: siteConfig.faviconUrl,
    apple: siteConfig.faviconUrl,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // ViewTransitions：路由切换时启用视图过渡（250ms，不支持该 API 的浏览器自动跳过）
    <ViewTransitions>
      <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} ${notoSerif.variable} h-full antialiased theme-xuan`} suppressHydrationWarning>
      <head>
        {/* 首屏先定主题，避免刷新时闪白 */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('blog-theme');var s=localStorage.getItem('blog-style');var d=document.documentElement;if(m==='dark')d.classList.add('dark');d.classList.remove('theme-xuan','theme-journal');d.classList.add(s==='journal'?'theme-journal':'theme-xuan');}catch(e){}})();`
          }}
        />
      </head>
      <body className="w-screen overflow-x-hidden min-h-full flex flex-col relative font-serif">
        {/* 全站背景轮播（在【视觉背景配置】里开关控制） */}
        {siteConfig.bgEnabled && siteConfig.bgImages?.length > 0 && (
          <BackgroundSlideshow images={siteConfig.bgImages} />
        )}
        <ThemeProvider>
            <div id="app-mount-root" className="flex-1 flex flex-col">
              {/* 导航栏放在 layout 里：切页时不再卸载重建，
                  滚动状态与移动端菜单状态得以保留 */}
              <Navbar />

              <div className="relative z-10 flex-1 flex flex-col">
                {children}
              </div>

              <div className="md:hidden block">
                <MobileBackButton />
              </div>
            </div>
        </ThemeProvider>
      </body>
    </html>
    </ViewTransitions>
  );
}
