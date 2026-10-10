"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, MessageSquare, Sparkles, Activity } from 'lucide-react';
import Comments from './Comments';
import { siteConfig } from '../siteConfig';
import { Link } from 'next-view-transitions';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

type ActivityRecord = {
  id: string;
  type: '杂谈' | '说说';
  title: string;
  date: string;
  url: string;
};

export default function AboutClient({
  contentHtml,
  coverImage,
  activities
}: {
  contentHtml: string,
  coverImage: string,
  activities: ActivityRecord[]
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'intro';

  const handleTabChange = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`, { scroll: false });
  };

  const heatmapScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'activity') {
      const checkAndScroll = setInterval(() => {
        const el = heatmapScrollRef.current;
        if (el) {
          el.scrollLeft = el.scrollWidth;
          clearInterval(checkAndScroll);

          setTimeout(() => {
            if (heatmapScrollRef.current) {
              heatmapScrollRef.current.scrollLeft = heatmapScrollRef.current.scrollWidth;
            }
          }, 300);
        }
      }, 50);

      const timeout = setTimeout(() => clearInterval(checkAndScroll), 2000);

      return () => {
        clearInterval(checkAndScroll);
        clearTimeout(timeout);
      };
    }
  }, [activeTab]);

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getLocalDateKey = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const { weeks, activityMap } = useMemo(() => {
    const today = new Date();
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 364);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let curr = new Date(startDate);
    const weeksArr = [];
    let currentWeek = [];

    while (curr <= endDate) {
      currentWeek.push(new Date(curr));
      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }
      curr.setDate(curr.getDate() + 1);
    }
    if (currentWeek.length > 0) weeksArr.push(currentWeek);

    const map: Record<string, number> = {};
    activities.forEach(a => {
      const d = new Date(a.date);
      if (!isNaN(d.getTime())) {
        const dateKey = getLocalDateKey(d);
        map[dateKey] = (map[dateKey] || 0) + 1;
      }
    });

    return { weeks: weeksArr, activityMap: map };
  }, [activities]);

  // 热力图用主题强调色的渐进梯度，而不是原生饱和绿——
  // 整站是纸张/印章主题，亮绿会显得像贴上去的色块。
  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-[var(--paper-deep)]';
    if (count === 1) return 'bg-[var(--accent-soft)]';
    if (count === 2) return 'bg-[color-mix(in_oklab,var(--accent)_55%,var(--paper))]';
    if (count === 3) return 'bg-[color-mix(in_oklab,var(--accent)_78%,var(--paper))]';
    return 'bg-[var(--accent)]';
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case '杂谈': return 'text-purple-600 dark:text-purple-400';
      case '说说': return 'text-pink-600 dark:text-pink-400';
      default: return 'text-slate-500 dark:text-slate-400';
    }
  };

  return (
    <div className="paper-card rounded-2xl shadow-lg border border-[var(--card-border)] overflow-hidden transition-colors duration-700 relative">

      <div className="w-full h-40 sm:h-48 md:h-64 relative bg-slate-200 dark:bg-slate-700 overflow-hidden group">
        <img src={coverImage} alt="About Hero" className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
      </div>

      <div className="px-5 sm:px-8 md:px-16 pb-10 md:pb-16 relative">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden -mt-12 md:-mt-16 relative z-20 bg-white">
          <img src={siteConfig.avatarUrl} alt="avatar" className="vt-avatar w-full h-full object-cover" />
        </div>

        {/* 核心修复区：手机端排版优雅适配 */}
        <div className="mt-4 md:mt-6 mb-6 md:mb-8 relative flex flex-col md:flex-row md:items-end justify-between gap-5 md:gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-1 md:mb-3 transition-colors duration-700">关于我</h1>
            <p className="text-sm md:text-lg text-indigo-600 dark:text-indigo-400 font-bold tracking-widest uppercase transition-colors duration-700">你好，我是 {siteConfig.authorName} · Hello World</p>
          </div>

          <div className="flex items-center w-full md:w-auto gap-1 paper-card p-1 md:p-1.5 rounded-xl md:rounded-2xl shadow-inner border border-[var(--card-border)]">
            <button
              onClick={() => handleTabChange('intro')}
              className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-black transition-all duration-300 ${activeTab === 'intro' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-indigo-500'}`}
            >
              自我介绍
            </button>
            <button
              onClick={() => handleTabChange('activity')}
              className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-black transition-all duration-300 ${activeTab === 'activity' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-indigo-500'}`}
            >
              近期更新
            </button>
          </div>
        </div>

        <div className="w-full h-px bg-slate-300/50 dark:bg-slate-700 mb-6 md:mb-8"></div>

        <AnimatePresence mode="wait">
          {activeTab === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <div className="relative">
                <div className="prose prose-slate dark:prose-invert prose-base md:prose-lg max-w-none text-slate-800 dark:text-slate-200 font-serif transition-colors duration-700 leading-relaxed scroll-smooth" dangerouslySetInnerHTML={{ __html: contentHtml }} />
              </div>
              <div className="mt-12 md:mt-16"><Comments /></div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>

              <div className="mb-12 p-5 md:p-8 bg-slate-50/50 rounded-2xl border border-slate-200/50 shadow-inner">
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Activity size={20} className="text-green-500" />
                  过去一年 {activities.length} 次记录 · Contributions in the last year
                </h3>

                <div className="flex gap-2">

                  <div className="flex flex-col shrink-0">
                    <div className="h-4 mb-1"></div>
                    <div className="flex flex-col gap-[4px] text-[10px] text-slate-400">
                      <div className="h-[11px] md:h-[13px]"></div>
                      <div className="h-[11px] md:h-[13px] leading-none flex items-center">Mon</div>
                      <div className="h-[11px] md:h-[13px]"></div>
                      <div className="h-[11px] md:h-[13px] leading-none flex items-center">Wed</div>
                      <div className="h-[11px] md:h-[13px]"></div>
                      <div className="h-[11px] md:h-[13px] leading-none flex items-center">Fri</div>
                      <div className="h-[11px] md:h-[13px]"></div>
                    </div>
                  </div>

                  <div ref={heatmapScrollRef} className="flex-1 overflow-x-auto pb-4 custom-scrollbar scroll-smooth relative">
                    <div className="min-w-[700px]">

                      <div className="flex gap-[4px] text-[10px] text-slate-400 mb-1 h-4">
                        {weeks.map((week, idx) => {
                          const firstDay = week[0];
                          const isFirstWeekOfMonth = firstDay.getDate() <= 7;
                          return (
                            <div key={idx} className="w-[11px] md:w-[13px] shrink-0 relative">
                              {isFirstWeekOfMonth && (
                                <span className="absolute left-0 whitespace-nowrap z-10">
                                  {firstDay.toLocaleString('en-US', { month: 'short' })}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-[4px]">
                        {weeks.map((week, i) => (
                          <div key={i} className="flex flex-col gap-[4px]">
                            {week.map((day, j) => {
                              const dateKey = getLocalDateKey(day);
                              const count = activityMap[dateKey] || 0;
                              return (
                                <div
                                  key={j}
                                  title={`${dateKey}: ${count} 次更新`}
                                  className={`w-[11px] h-[11px] md:w-[13px] md:h-[13px] rounded-[3px] transition-colors duration-300 hover:ring-2 hover:ring-indigo-500/50 ${getColorClass(count)}`}
                                ></div>
                              );
                            })}
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-2 text-[10px] md:text-xs font-bold text-slate-500">
                  少
                  <div className="w-[11px] h-[11px] rounded-[3px] bg-[var(--paper-deep)]"></div>
                  <div className="w-[11px] h-[11px] rounded-[3px] bg-[var(--accent-soft)]"></div>
                  <div className="w-[11px] h-[11px] rounded-[3px] bg-[color-mix(in_oklab,var(--accent)_55%,var(--paper))]"></div>
                  <div className="w-[11px] h-[11px] rounded-[3px] bg-[color-mix(in_oklab,var(--accent)_78%,var(--paper))]"></div>
                  <div className="w-[11px] h-[11px] rounded-[3px] bg-[var(--accent)]"></div>
                  多
                </div>
              </div>

              <div className="relative pl-6 md:pl-8 border-l-2 border-indigo-500/20 dark:border-indigo-400/20 space-y-6 md:space-y-8">
                {activities.map((act, index) => {
                  const isMoment = act.type === '说说';
                  const targetUrl = isMoment ? '/moments' : act.url;

                  return (
                    <div key={index} className="relative group">
                      <div className="absolute -left-[31px] md:-left-[39px] top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 bg-white dark:bg-slate-800 border-2 border-indigo-500 rounded-full group-hover:scale-125 transition-transform duration-300 z-10"></div>

                      <Link
                        href={targetUrl}
                        className="flex flex-col md:flex-row md:items-center gap-3 paper-card p-4 rounded-2xl border border-[var(--card-border)] shadow-sm hover:shadow-lg transition-all group-hover:-translate-y-1 cursor-pointer block relative overflow-hidden"
                      >
                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <img src={siteConfig.avatarUrl} alt="author" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm shrink-0" />

                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-800 dark:text-slate-200 text-sm">{siteConfig.authorName}</span>
                              <span className={`text-xs font-bold ${getTypeColor(act.type)}`}>
                                {isMoment ? '发了条说说' : '写了篇杂谈'}
                              </span>
                            </div>

                            <div className="text-[10px] md:hidden font-mono text-slate-400 mt-0.5">
                              {formatDateTime(act.date)}
                            </div>
                          </div>
                        </div>

                        {!isMoment && (
                          <>
                            <div className="hidden md:block w-px h-8 bg-slate-300 dark:bg-slate-600 mx-2 shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm md:text-base font-black text-slate-800 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                《{act.title}》
                              </div>
                            </div>
                          </>
                        )}

                        {isMoment && (
                          <div className="flex-1 hidden md:block"></div>
                        )}

                        <div className="hidden md:block text-[11px] font-mono text-slate-400 shrink-0 ml-auto bg-slate-100 px-2 py-1 rounded-md">
                          {formatDateTime(act.date)}
                        </div>
                      </Link>
                    </div>
                  );
                })}

                {activities.length === 0 && (
                  <div className="text-slate-500 text-sm font-bold">暂无活动记录</div>
                )}
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}