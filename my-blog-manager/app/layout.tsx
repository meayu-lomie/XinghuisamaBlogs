import 'katex/dist/katex.min.css';
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { siteConfig } from "../siteConfig";
import { OperationProvider } from "../context/OperationContext";
import { ToastProvider } from '../components/ToastProvider';
import Navbar from "../components/Navbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const notoSerif = Noto_Serif_SC({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-serif", display: 'swap' });

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.bio,
  icons: { icon: siteConfig.faviconUrl, apple: siteConfig.faviconUrl },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} ${notoSerif.variable} h-full antialiased theme-xuan`} suppressHydrationWarning>
      <head>
        {/* 首屏先定主题，避免刷新时闪白 */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('manager-theme');var s=localStorage.getItem('manager-style');var d=document.documentElement;if(m==='dark')d.classList.add('dark');d.classList.remove('theme-xuan','theme-journal');d.classList.add(s==='journal'?'theme-journal':'theme-xuan');}catch(e){}})();`
          }}
        />
      </head>

      <body className="w-screen overflow-x-hidden min-h-full flex flex-col relative font-serif">
        <ThemeProvider>
          <OperationProvider>
            <ToastProvider>
              <div id="app-mount-root" className="flex-1 flex flex-col">
                  {/* 导航栏放在 layout 里：切页时不再卸载重建 */}
                  <Navbar />

                  <div className="relative z-10 flex-1 flex flex-col">
                    {children}
                  </div>
              </div>
            </ToastProvider>
          </OperationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
