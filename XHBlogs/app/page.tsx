import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Link } from 'next-view-transitions';
import SearchBar from '../components/SearchBar';
import { siteConfig } from '../siteConfig';
import ProfileCard from '../components/ProfileCard';
import { albums } from '../data/albums';
import { ToastProvider } from '../components/ToastProvider';

import LatestMomentsCarousel from '../components/LatestMomentsCarousel';
import LatestChatterCarousel from '../components/LatestChatterCarousel';

function formatUpdateTime(dateString: string) {
  if (!dateString || dateString === '1970-01-01') return '刚刚更新';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    if (hours === '00' && mins === '00') return `${year}.${month}.${day}`;
    return `${year}.${month}.${day} ${hours}:${mins}`;
  } catch { return dateString; }
}

export default function Home() {
  // 站点只保留「杂谈」与「说说」两种内容类型

  // ---- 杂谈（chatters）----
  const chattersDirectory = path.join(process.cwd(), 'chatters');
  let allChatters: any[] = [];
  try {
    if (fs.existsSync(chattersDirectory)) {
      const chatterFiles = fs.readdirSync(chattersDirectory).filter(f => f.endsWith('.md'));
      allChatters = chatterFiles.map(fileName => {
        const fullPath = path.join(chattersDirectory, fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
        const rawDate = data.date || '1970-01-01';
        const cover = data.cover || siteConfig.defaultPostCover;
        return {
          slug: fileName.replace(/\.md$/, ''),
          title: data.title || '碎片记录',
          description: data.description || content.substring(0, 60),
          cover: cover,
          date: rawDate,
          formattedDate: formatUpdateTime(rawDate)
        };
      }).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return b.slug.localeCompare(a.slug);
      });
    }
  } catch (e) {}
  const top5Chatters = allChatters.length > 0
    ? allChatters.slice(0, 5)
    : [{ slug: 'none', title: '暂无记录', description: '记录一段思绪...', cover: siteConfig.defaultPostCover, date: '', formattedDate: '' }];

  // ---- 说说（moments）----
  const momentsDirectory = path.join(process.cwd(), 'moments');
  let allMoments: any[] = [];
  try {
    if (fs.existsSync(momentsDirectory)) {
      const momentFiles = fs.readdirSync(momentsDirectory).filter(f => f.endsWith('.md'));
      allMoments = momentFiles.map(fileName => {
        const fullPath = path.join(momentsDirectory, fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
        return {
          id: fileName.replace(/\.md$/, ''),
          date: data.date || '1970-01-01',
          location: data.location || '',
          images: data.images || [],
          content: content.trim()
        };
      }).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return b.id.localeCompare(a.id);
      });
    }
  } catch (e) {}
  const top5Moments = allMoments.slice(0, 5);

  const chatterCount = allChatters.length;
  const momentCount = allMoments.length;
  const realPhotoCount = albums.reduce((total, album) => total + album.photos.length, 0);
  const latestAlbum = albums.length > 0 ? albums[0] : { id: '', title: '照片墙', description: '查看摄影', cover: siteConfig.photoWallImage, date: '' };

  return (
    <ToastProvider>
      <div className="min-h-screen relative pb-10">
        <div>
          {/* 🌟 调整整体容器的内边距，适应手机端更小的屏幕 */}
          <div className="w-full max-w-6xl mx-auto mt-24 sm:mt-28 px-4 sm:px-6 lg:px-10 relative z-10">
            <SearchBar posts={allChatters} moments={allMoments} />

            <main className="flex flex-col gap-6 w-full mt-6">

              {/* 第一行：个人信息（占满整行） */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                <div className="col-span-1 lg:col-span-12 flex flex-col">
                    <ProfileCard chatterCount={chatterCount} momentCount={momentCount} photoCount={realPhotoCount}/>
                </div>
              </div>

              {/* 第二行：最近说说轮播 + 照片墙 + 杂谈轮播 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

                {/* 左侧：最近说说 (电脑端占4列，手机端排最上面) */}
                <div className="col-span-1 lg:col-span-4 flex flex-col min-h-[300px]">
                  {top5Moments.length > 0 ? (
                    <LatestMomentsCarousel moments={top5Moments} />
                  ) : (
                    <Link href="/moments" className="rounded-2xl paper-card border border-[var(--card-border)] shadow-md min-h-[420px] h-full flex flex-col items-center justify-center gap-3 group">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-black/30 px-2 py-1 rounded-md border border-[var(--card-border)]">说说 · Moments</span>
                      <p className="text-slate-600 dark:text-slate-300 font-bold">还没有说说</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">去记录第一个瞬间吧</p>
                    </Link>
                  )}
                </div>

                {/* 右侧：组合面板 (电脑端占8列) */}
                <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">

                  {/* 照片墙大海报 */}
                  <Link href="/photowall" className="w-full rounded-2xl paper-card border border-[var(--card-border)] shadow-md overflow-hidden transition-all duration-700 hover:scale-[1.02] relative group min-h-[200px] sm:min-h-[220px] flex-shrink-0">
                    <img src={latestAlbum.cover} className="w-full h-full absolute inset-0 object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"/>
                    <div className="absolute inset-0 bg-black/30 dark:bg-black/50 group-hover:bg-black/10 transition-colors duration-500"></div>
                    <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 right-6">
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 underline decoration-pink-400">{latestAlbum.title}</h3>
                      <p className="text-white/90 text-sm sm:text-lg line-clamp-1">{latestAlbum.description}</p>
                    </div>
                  </Link>

                  {/* 杂谈轮播占满整行 */}
                  <div className="w-full flex-1 min-h-[200px]">
                    <LatestChatterCarousel chatters={top5Chatters} />
                  </div>

                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
