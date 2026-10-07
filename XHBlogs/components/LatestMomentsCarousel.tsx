// components/LatestMomentsCarousel.tsx
"use client";

import { useState, useEffect } from 'react';
import { Link } from 'next-view-transitions';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';

/**
 * 首页「最近说说」轮播。
 * 展示最新几条说说（含首图、正文摘要、地点、时间），点击跳说说页。
 */
export default function LatestMomentsCarousel({ moments }: { moments: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (moments.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % moments.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [moments.length]);

  if (!moments || moments.length === 0) return null;

  const current = moments[currentIndex];
  const cover = current.images && current.images.length > 0 ? current.images[0] : '';

  return (
    <div className="w-full h-full rounded-2xl paper-card border border-[var(--card-border)] shadow-md overflow-hidden relative group min-h-[220px] flex flex-col">
      <Link href="/moments" className="absolute inset-0 z-20" aria-label="查看说说" />

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 z-0"
        >
          {cover ? (
            <>
              <img src={cover} className="w-full h-full object-cover opacity-80 dark:opacity-60 transition-transform duration-1000 group-hover:scale-105" alt="Moment" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20"></div>
            </>
          ) : (
            <div className="w-full h-full bg-[color-mix(in_oklab,var(--accent)_10%,var(--paper))] dark:bg-[color-mix(in_oklab,var(--accent)_16%,var(--paper-deep))]" />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex flex-col justify-center p-6 md:p-8 h-full pointer-events-none w-full md:w-[85%]">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border shadow-sm ${cover ? 'text-indigo-300 bg-black/30 border-white/10' : 'text-indigo-600 dark:text-indigo-300 paper-card border-white/20'}`}>
            说说 · Moments
          </span>
          {current.date && (
            <span className={`text-[11px] font-mono drop-shadow-md ${cover ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
              {String(current.date).split(/[ T]/)[0].replace(/-/g, '.')}
            </span>
          )}
        </div>

        <p className={`text-sm font-medium leading-relaxed line-clamp-3 drop-shadow-md ${cover ? 'text-slate-200' : 'text-slate-700 dark:text-slate-200'}`}>
          {current.content || '（无内容）'}
        </p>

        {current.location && (
          <div className={`flex items-center gap-1 mt-3 text-[11px] font-bold ${cover ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
            <MapPin size={11} /> {current.location}
          </div>
        )}
      </div>

      {moments.length > 1 && (
        <div className="absolute bottom-5 right-6 z-30 flex gap-2">
          {moments.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
              className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${i === currentIndex ? 'w-6 bg-indigo-400' : 'w-2 bg-white/40 hover:bg-white/80'}`}
              aria-label="跳转"
            />
          ))}
        </div>
      )}
    </div>
  );
}
