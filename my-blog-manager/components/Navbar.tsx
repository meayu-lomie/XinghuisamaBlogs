"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useOperations } from '../context/OperationContext';
import { useToast } from './ToastProvider';
import { siteConfig } from '../siteConfig';

import NavThemeSwitch from './NavThemeSwitch';
export default function Navbar() {
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isOpBoxOpen, setIsOpBoxOpen] = useState(false);


  const pathname = usePathname();
  const { operations, removeOperation, clearOperations } = useOperations();
  const [isWriting, setIsWriting] = useState(false);
  const { showToast } = useToast();

  // 防重入：写入是逐条 POST，网络慢时连点会并发跑两轮循环，
  // 同一份内容被写两次（后端按 id 命名，两轮的 id 可能不同）→ 博客端出现重复。
  const writingRef = useRef(false);


  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) setShowNav(false);
      else setShowNav(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // 管理控制台导航：只保留内容编辑入口（展示类页面已从控制台移除）
  const navLinks = [
    { name: '写杂谈', href: '/editor' },
    { name: '草稿箱', href: '/drafts' },
    { name: '杂谈', href: '/chatter' },
    { name: '说说', href: '/moments' },
    { name: '时间线', href: '/timeline' },
    { name: '照片墙', href: '/photowall' },
    { name: '项目', href: '/projects' },
    { name: '关于', href: '/about' },
    { name: '设置', href: '/settings' },
  ];

  const handleMinimize = () => {
    if (typeof window !== 'undefined' && (window as any).pywebview?.api) {
      (window as any).pywebview.api.minimize_window();
    }
  };
  const handleMaximize = () => {
    if (typeof window !== 'undefined' && (window as any).pywebview?.api) {
      (window as any).pywebview.api.maximize_window();
    }
  };
  const handleClose = () => {
    if (typeof window !== 'undefined' && (window as any).pywebview?.api) {
      (window as any).pywebview.api.close_window();
    }
  };

  // 监控增强版更新逻辑
  const handleUpdateLocal = async () => {
      if (operations.length === 0) {
        showToast("还没有待保存的改动", "warning");
        return;
      }
      // state 更新是异步的，连点时拦不住，必须用 ref 立即加锁
      if (writingRef.current) return;
      writingRef.current = true;
      setIsWriting(true);

      try {
        showToast(`正在写入 ${operations.length} 项改动...`, "info");

        const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
        const configData = await configRes.json();
        const apiBase = `http://127.0.0.1:${configData.api_port}`;

        for (const [index, op] of operations.entries()) {
          let apiUrl = '';
          let body = {};

          switch (op.type) {
            case 'sync_photowall':
              apiUrl = `${apiBase}/api/gallery/sync`;
              body = { albums: op.value };
              break;
            case 'sync_projects':
              apiUrl = `${apiBase}/api/projects/sync`;
              body = { projects: op.value };
              break;
            case 'CONFIG':
              apiUrl = `${apiBase}/api/config/update`;
              body = { updates: op.payload };
              break;
            case 'create_moment':
              apiUrl = `${apiBase}/api/moments/save`;
              body = op.payload;
              break;
            default:
              apiUrl = `${apiBase}/api/drafts/sync_local`;
              body = { operations: [op] };
              break;
          }

          showToast("正在保存...", "info");

          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });

          const data = await res.json();
          if (!data.success) {
            // 队列是逐条提交的，前面几条可能已经写盘。这里如实说明，避免用户以为全部回滚。
            showToast(`第 ${index + 1}/${operations.length} 项执行失败：${data.message}；已写入的部分不会回滚，请检查后重试`, "error");
            return;
          }
          // 后端返回的 message 描述了本次实际写入的结果，不要吞掉
          if (data.message) showToast(`任务已执行：${data.message}`, "success");
        }

        clearOperations();
        setIsOpBoxOpen(false);
        showToast(`已写入 ${operations.length} 项改动，正在刷新...`, "success");

        setTimeout(() => {
          window.location.reload();
        }, 1200);

    } catch (error) {
      showToast("无法连接到后端，请确认管理端后端在运行", "error");
    } finally {
      writingRef.current = false;
      setIsWriting(false);
    }
  };

  return (
    <>
      <header className={`w-full fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${showNav ? 'translate-y-0' : '-translate-y-full'} bg-[color-mix(in_oklab,var(--paper)_88%,transparent)] border-[var(--rule)] shadow-sm pywebview-drag-region`}>
        <div className="w-[95%] max-w-7xl mx-auto h-16 flex items-center justify-between px-4 box-border">

          <Link href="/" className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">
            {siteConfig.navTitle}
            <span className="text-indigo-500 mx-1">
              {siteConfig.navSuffix || 'の'}
            </span>
            {siteConfig.navAfter}
          </Link>

          <div className="flex items-center gap-6" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <nav className="hidden lg:flex gap-8 text-sm font-bold">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={`relative py-1 transition-colors ${pathname === link.href ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-200'}`}>
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* 主题切换：版式 + 明暗 */}
            <span className="pl-4 border-l" style={{ borderColor: 'var(--rule)' }}>
              <NavThemeSwitch />
            </span>

            <div className="relative">
              <button
                onClick={() => setIsOpBoxOpen(!isOpBoxOpen)}
                title="待保存的改动"
                className="relative h-10 px-4 rounded-xl paper-card flex items-center justify-center text-xs font-bold whitespace-nowrap hover:scale-105 transition-all border border-[var(--card-border)] shadow-sm cursor-pointer"
              >
                待保存
                {operations.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-[10px] font-black text-white items-center justify-center border-2 border-white dark:border-slate-900">
                      {operations.length}
                    </span>
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isOpBoxOpen && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-3 w-80 paper-card-strong border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-4 z-50 cursor-default">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">待保存的改动</h3>
                      <button onClick={clearOperations} className="text-[10px] text-red-500 font-bold hover:underline">清空全部</button>
                    </div>

                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-4 custom-scrollbar">
                      {operations.length === 0 ? (
                        <p className="text-center py-6 text-sm text-slate-400 font-medium">还没有待保存的改动</p>
                      ) : (
                        operations.map(op => (
                          <div key={op.id} className="paper-card p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                            <div className="flex flex-col">
                              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{op.label}</span>
                              <span className="text-[10px] text-slate-400">{op.timestamp}</span>
                            </div>
                            <button onClick={() => removeOperation(op.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all text-lg">✕</button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* 只有"更新本地"一步：内容直接写进博客前端目录，不再需要同步 */}
                    <button onClick={handleUpdateLocal} disabled={isWriting} className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-black shadow-lg hover:bg-indigo-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {isWriting ? <><Loader2 size={14} className="animate-spin" /> 正在保存...</> : "保存到博客"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 窗口控件（Windows 风格） */}
            <div className="flex items-center ml-2 pl-4 border-l" style={{ borderColor: 'var(--rule)' }}>
              <button
                onClick={handleMinimize}
                title="最小化"
                aria-label="最小化"
                className="window-ctl"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M0 5h10" stroke="currentColor" strokeWidth="1" />
                </svg>
              </button>
              <button
                onClick={handleMaximize}
                title="最大化"
                aria-label="最大化"
                className="window-ctl"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="1" />
                </svg>
              </button>
              <button
                onClick={handleClose}
                title="关闭"
                aria-label="关闭"
                className="window-ctl window-ctl-close"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </header>

    </>
  );
}