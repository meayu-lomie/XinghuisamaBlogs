// src/components/MobileBackButton.tsx
"use client";

import { useTransitionRouter as useRouter } from 'next-view-transitions';
import { ChevronLeft } from 'lucide-react';

export default function MobileBackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      // 放在右下角稍微靠上的位置，防止挡住底部的导航转轴
      className="fixed bottom-24 right-4 z-[90] w-11 h-11 flex items-center justify-center paper-card border border-[var(--card-border)] shadow-md rounded-full text-slate-700 dark:text-slate-200 active:scale-90 transition-all"
      title="返回上一页"
    >
      <ChevronLeft size={24} />
    </button>
  );
}