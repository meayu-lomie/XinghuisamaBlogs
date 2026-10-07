"use client";
import { useTransitionRouter as useRouter } from 'next-view-transitions';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all duration-300 group mb-8 paper-card px-4 py-2 rounded-full w-max shadow-sm cursor-pointer outline-none"
    >
      <svg className="w-4 h-4 transform transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      返回上一级
    </button>
  );
}