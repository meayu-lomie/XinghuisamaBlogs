"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 定义全局可以调用的方法
interface ToastContextType {
  showToast: (text: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toastMsg, setToastMsg] = useState<{ text: string, type: 'success' | 'warning' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 paper-card-strong border border-[var(--card-border)] border-l-[3px]"
            style={{
              // 纸面卡片 + 左侧一道语义色条：比整块饱和底色更贴合纸张主题
              borderLeftColor:
                toastMsg.type === 'success' ? 'var(--ok)'
                : toastMsg.type === 'warning' ? 'var(--warn)'
                : toastMsg.type === 'error' ? 'var(--danger)'
                : 'var(--accent)',
            }}
          >
            {toastMsg.type === 'success' && <CheckCircle2 size={16} className="shrink-0 text-[var(--ok)]" />}
            {toastMsg.type === 'warning' && <AlertTriangle size={16} className="shrink-0 text-[var(--warn)]" />}
            {toastMsg.type === 'error' && <AlertCircle size={16} className="shrink-0 text-[var(--danger)]" />}
            {toastMsg.type === 'info' && <Info size={16} className="shrink-0 text-[var(--accent)]" />}
            <span className="font-bold text-sm text-[var(--ink)]">{toastMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </ToastContext.Provider>
  );
}

// 导出一个万能钩子，任何组件引用它就能召唤弹窗
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast 必须在 ToastProvider 内部使用");
  return context;
};