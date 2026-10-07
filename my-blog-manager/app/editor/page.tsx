"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import RichTextEditor, { RichTextEditorHandle } from '../../components/editor/RichTextEditor';
import MetaMatrix from '../../components/editor/MetaMatrix';
import FloatingImageTool from '../../components/editor/FloatingImageTool';
import { ArrowLeft, AlertTriangle, Save, LogOut, Sparkles, Check } from 'lucide-react';
import { useToast } from '../../components/ToastProvider';
import { useOperations } from '../../context/OperationContext';
import { motion, AnimatePresence } from 'framer-motion';

// 🌟 核心修改 1：把原本暴露的主函数改名为 EditorContent（不带 export default）
function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { addOperation } = useOperations();

  const [docType, setDocType] = useState<string>(searchParams.get('type') || 'chatter');
  const [currentDocId, setCurrentDocId] = useState(
    searchParams.get('type') === 'about' ? 'about' : (searchParams.get('id') || 'new')
  );

  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [cover, setCover] = useState('');
  const [summary, setSummary] = useState('');
  const [mood, setMood] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');

  const [historyPostTags, setHistoryPostTags] = useState<string[]>([]);
  const [historyChatterTags, setHistoryChatterTags] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const historyMoods = ['开心', '疲惫', '平静', '激动', 'Emo'];

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isImgToolOpen, setIsImgToolOpen] = useState(false);
  const [imgToolTarget, setImgToolTarget] = useState<'editor' | 'cover'>('editor');

  const editorRef = useRef<RichTextEditorHandle>(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);

  // AI 润色
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishModal, setPolishModal] = useState<{ open: boolean; original: string; polished: string }>({ open: false, original: '', polished: '' });

  const handlePolish = async () => {
    if (isPolishing) return;
    const original = editorRef.current?.getContent() || '';
    if (!original.replace(/<[^>]*>/g, '').trim()) {
      showToast('正文是空的，先写点什么再润色', 'warning');
      return;
    }
    setIsPolishing(true);
    try {
      const res = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: original, mode: 'html' })
      });
      const data = await res.json();
      if (data.success && data.polished) {
        setPolishModal({ open: true, original, polished: data.polished });
      } else {
        showToast(data.message || '润色失败', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('润色请求失败', 'error');
    } finally {
      setIsPolishing(false);
    }
  };

  const applyPolished = () => {
    editorRef.current?.setContent(polishModal.polished);
    setPolishModal({ open: false, original: '', polished: '' });
    setHasUnsavedChanges(true);
    showToast('已应用润色结果（原文可通过 Ctrl+Z 恢复）', 'success');
  };

  useEffect(() => {
    const fetchTags = async () => {
      setIsLoadingTags(true);
      try {
        const configRes = await fetch(`/backend_config.json`);
        const config = await configRes.json();
        const res = await fetch(`http://127.0.0.1:${config.api_port}/api/drafts/all_tags`);
        const data = await res.json();
        if (data.success) {
          setHistoryPostTags(data.postTags || []);
          setHistoryChatterTags(data.chatterTags || []);
        }
      } catch (e) { console.error(e); }
      finally { setIsLoadingTags(false); }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    if (currentDocId !== 'new') {
      const loadDraft = async () => {
        try {
          const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
          const config = await configRes.json();

          const res = await fetch(`http://127.0.0.1:${config.api_port}/api/drafts/get`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentDocId, type: docType })
          });

          const data = await res.json();
          if (data.success) {
            if (data.draft.type) setDocType(data.draft.type);
            setDate(data.draft.date || '');
            setTitle(data.draft.type === 'about' ? '关于我' : (data.draft.title || ''));
            setTags(data.draft.tags || []);
            setCover(data.draft.cover || '');
            setSummary(data.draft.description || '');
            setMood(data.draft.mood || '');
            setContent(data.draft.content || '');

            setTimeout(() => setHasUnsavedChanges(false), 500);
            showToast("✅ 已读取本地源数据", "success");
          } else {
             showToast(data.message || "❌ 未找到草稿或原文件", "error");
          }
        } catch (e) { showToast("❌ 读取失败", "error"); }
      };
      loadDraft();
    }
  }, [currentDocId]);

  useEffect(() => {
    if (!isLoadingTags) {
      setHasUnsavedChanges(true);
    }
  }, [title, tags, cover, summary, mood]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setExitModalOpen(true);
    } else {
      router.back();
    }
  };

  const handleSave = async (isPublish: boolean, shouldExitAfterSave: boolean = false) => {
    if (!title.trim() && docType !== 'about') {
      showToast("⚠️ 请填写标题", "warning"); return;
    }
    const payload = {
      id: docType === 'about' ? 'about' : (currentDocId === 'new' ? null : currentDocId),
      type: docType, title, tags, cover, mood, description: summary,
      content: editorRef.current?.getContent() || '',
      date: date || new Date().toLocaleDateString('sv-SE'),
      published: isPublish
    };

    if (isPublish) {
      addOperation({
        id: `publish_${Date.now()}`,
        type: "publish_article",
        label: `发布: ${title || '无标题'}`,
        value: payload
      });
      setHasUnsavedChanges(false);
      showToast("🚀 已加入待处理队列！", "info");
      if (shouldExitAfterSave) router.back();
      return;
    }

    setIsSaving(true);
    try {
      const configRes = await fetch(`/backend_config.json`);
      const config = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${config.api_port}/api/drafts/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setLastSaved(new Date().toLocaleTimeString());
        setHasUnsavedChanges(false);
        showToast("💾 草稿已落盘", "success");
        if (shouldExitAfterSave) {
          setExitModalOpen(false);
          router.back();
        }
      }
    } catch (e) { showToast("❌ 保存失败", "error"); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative">

      <AnimatePresence>
        {exitModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setExitModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/50 dark:border-white/10 p-10 text-center overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50" />
              <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6"><AlertTriangle className="w-10 h-10 text-yellow-500" /></div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">存在未保存的数据</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">你的研究尚未记录，<br />直接离开将会导致这些数据消散在虚空中。</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleSave(false, true)}
                  className="w-full py-4 bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} /> 存为草稿并离开
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setExitModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">取消</button>
                  <button onClick={() => { setExitModalOpen(false); setHasUnsavedChanges(false); router.back(); }} className="flex-1 py-4 bg-red-500/10 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
                    <LogOut size={16} /> 强行抛弃
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI 润色预览弹窗 */}
      <AnimatePresence>
        {polishModal.open && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPolishModal({ open: false, original: '', polished: '' })}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 24 }}
              className="relative w-full max-w-5xl h-[82vh] bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/50 dark:border-white/10 flex flex-col overflow-hidden"
            >
              <div className="shrink-0 px-10 pt-8 pb-6 border-b border-white/30 dark:border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles size={20} className="text-emerald-500" /> AI 润色预览
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-bold">满意就应用，不满意点丢弃，原文不受影响</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPolishModal({ open: false, original: '', polished: '' })}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    丢弃
                  </button>
                  <button
                    onClick={applyPolished}
                    className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-colors flex items-center gap-2"
                  >
                    <Check size={14} /> 应用润色
                  </button>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 overflow-hidden min-h-0">
                <div className="flex flex-col min-h-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">原文</p>
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/50 dark:bg-black/20 rounded-2xl p-5 border border-white/30 dark:border-white/10">
                    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: polishModal.original }} />
                  </div>
                </div>
                <div className="flex flex-col min-h-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">润色后</p>
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/50 dark:bg-black/20 rounded-2xl p-5 border border-emerald-500/20 dark:border-emerald-500/10">
                    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: polishModal.polished }} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className={hasUnsavedChanges ? "relative z-50 [&_a]:pointer-events-none" : "relative z-50"}>
        {hasUnsavedChanges && (
          <div className="absolute inset-0 z-50 cursor-pointer" onClick={() => setExitModalOpen(true)}></div>
        )}
      </div>

      <div>
        {/* 左右并排；min-w-0 让主区在窄屏可收缩，不会撑开容器 */}
        <main className="mx-auto w-[96%] max-w-[1750px] flex flex-row gap-6 relative min-[1400px]:h-[calc(100vh-144px-32px)]" style={{ marginTop: '144px', marginBottom: '32px' }}>

          <button
            onClick={handleBackClick}
            className="absolute -top-14 left-2 px-5 py-2.5 bg-white/40 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-lg flex items-center gap-2 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all group z-50"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-indigo-500" />
            返回上一级
          </button>

          <section className="flex-1 min-w-0 bg-white/30 dark:bg-slate-800/40 rounded-[50px] shadow-2xl border border-white/30 dark:border-white/10 flex flex-col overflow-hidden min-[1400px]:min-h-0 min-h-[70vh]">
            <RichTextEditor
              ref={editorRef}
              title={title}
              setTitle={(val) => { setTitle(val); setHasUnsavedChanges(true); }}
              initialContent={content}
              isTitleLocked={docType === 'about'}
              onOpenImageTool={() => { setImgToolTarget('editor'); setIsImgToolOpen(true); }}
              onPolishClick={handlePolish}
            />
          </section>
          <aside className="w-[360px] shrink-0 bg-white/30 dark:bg-slate-800/40 rounded-[50px] shadow-2xl border border-white/30 dark:border-white/10 flex flex-col overflow-hidden min-[1400px]:min-h-0">
            <MetaMatrix
              type={docType as any} tags={tags} setTags={setTags} cover={cover} setCover={setCover} summary={summary} setSummary={setSummary} mood={mood} setMood={setMood}
              allHistoryPostTags={historyPostTags} allHistoryChatterTags={historyChatterTags} isLoadingTags={isLoadingTags}
              allHistoryMoods={historyMoods} onSave={(isPublish) => handleSave(isPublish, false)} isSaving={isSaving} lastSaved={lastSaved} onOpenImageTool={() => { setImgToolTarget('cover'); setIsImgToolOpen(true); }}
            />
          </aside>
        </main>
      </div>
      <FloatingImageTool isOpen={isImgToolOpen} onClose={() => setIsImgToolOpen(false)} onInsert={(url) => {
        if (imgToolTarget === 'editor') { editorRef.current?.insertImage(url); if (!cover) setCover(url); }
        else { setCover(url); setIsImgToolOpen(false); }
        setHasUnsavedChanges(true);
      }} />
    </div>
  );
}

// 🌟 核心修改 2：在底部暴露真正的 EditorPage，并用 Suspense 把里面的内容套起来
export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold tracking-widest text-sm uppercase">加载编辑器内核中...</p>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}