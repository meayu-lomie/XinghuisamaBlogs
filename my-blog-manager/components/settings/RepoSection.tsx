"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../ToastProvider';
import { ShieldCheck, GitBranch, Save, Rocket, Wand2, Key, Copy, ExternalLink, Check, CloudUpload, Code } from 'lucide-react';

export default function RepoSection() {
  const { showToast } = useToast();
  const [isCheckingPath, setIsCheckingPath] = useState(false);
  const [isCheckingGit, setIsCheckingGit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: 'init' | 'deploy' | 'upload' | 'ssh' | null }>({
    isOpen: false,
    type: null
  });

  // 核心升级：区分当前的 SSH 密钥是 A 线的还是 B 线的
  const [sshConfig, setSshConfig] = useState<{ key: string, type: 'static' | 'source' }>({ key: "", type: "static" });

  const [deployData, setDeployData] = useState({
    blogPath: "",
    staticRepoUrl: "",    // 原来的静态部署仓库
    staticBranch: "gh-pages", // 静态部署分支
    sourceRepoUrl: "",    // 新增的源码同步仓库
    sourceBranch: "main"      // 源码同步分支
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
        const config = await configRes.json();
        const res = await fetch(`http://127.0.0.1:${config.api_port}/api/deploy/config`);
        if (res.ok) {
          const data = await res.json();
          setDeployData({
            blogPath: data.blogPath || "",
            staticRepoUrl: data.staticRepoUrl || data.repoUrl || "",
            staticBranch: data.staticBranch || data.repoBranch || "gh-pages",
            sourceRepoUrl: data.sourceRepoUrl || "",
            sourceBranch: data.sourceBranch || "main"
          });
          if (data.blogPath) localStorage.setItem('targetBlogPath', data.blogPath);
        }
      } catch (e) {
        // 后端没起来时表单会是空的，容易被误以为「配置丢了」，必须明确提示
        console.error("加载部署配置失败", e);
        showToast("读取部署配置失败：后端未启动或端口未就绪，当前显示为空值", "error");
      }
    };
    fetchConfig();
  }, []);

  const testPathConnection = async () => {
    if (!deployData.blogPath) { showToast("请先填写博客目录", "warning"); return; }
    setIsCheckingPath(true);
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const config = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${config.api_port}/api/deploy/check-path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogPath: deployData.blogPath })
      });
      const data = await res.json();
      if (data.success) showToast(data.message, "success");
      else showToast(data.message, "error");
    } catch (e) { showToast("连不上管理端后端", "error"); }
    setIsCheckingPath(false);
  };

  const testGitConnection = async () => {
    if (!deployData.blogPath) { showToast("请先填写博客目录", "warning"); return; }
    setIsCheckingGit(true);
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const config = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${config.api_port}/api/deploy/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogPath: deployData.blogPath })
      });
      const data = await res.json();
      if (data.success) showToast(data.message, "success");
      else showToast(data.message, "error");
    } catch (e) { showToast("管理端后端没有响应", "error"); }
    setIsCheckingGit(false);
  };

  // 核心升级：传入 type 区分请求 A 线还是 B 线的密钥
  const handleGetSSH = async (type: 'static' | 'source') => {
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const config = await configRes.json();
      // 向后端传递参数 ?type=static 或 ?type=source
      const res = await fetch(`http://127.0.0.1:${config.api_port}/api/deploy/ssh/key?type=${type}`);
      const data = await res.json();
      if (data.success) {
        setSshConfig({ key: data.key, type });
        setModalConfig({ isOpen: true, type: 'ssh' });
      } else {
        showToast(data.message, "error");
      }
    } catch (e) { showToast("获取 SSH 失败", "error"); }
  };

  const executeInitEnv = async () => {
    setModalConfig({ isOpen: false, type: null });
    setIsInitializing(true);
    showToast("正在初始化仓库环境…", "info");
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/deploy/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deployData)
      });
      const data = await res.json();
      if (data.success) showToast(data.message, "success");
      else showToast(`初始化失败：${data.message}`, "error");
    } catch (error) { showToast("管理端后端没有响应", "error"); }
    setIsInitializing(false);
  };

  const executeDeploy = async () => {
    setModalConfig({ isOpen: false, type: null });
    setIsDeploying(true);
    showToast("正在编译打包并推送至静态仓库…", "info");
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/deploy/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogPath: deployData.blogPath })
      });
      const data = await res.json();
      if (data.success) showToast(data.message, "success");
      else showToast(`部署失败：${data.message}`, "error");
    } catch (error) { showToast("部署请求失败", "error"); }
    setIsDeploying(false);
  };

  const executeUploadSource = async () => {
    setModalConfig({ isOpen: false, type: null });
    setIsUploading(true);
    showToast("正在推送源码，Vercel 将自动构建…", "info");
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/deploy/source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogPath: deployData.blogPath })
      });
      const data = await res.json();
      if (data.success) showToast("源码推送成功，Vercel 即将自动构建", "success");
      else showToast(`推送失败：${data.message}`, "error");
    } catch (error) { showToast("推送源码失败", "error"); }
    setIsUploading(false);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const config = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${config.api_port}/api/deploy/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deployData)
      });
      const data = await res.json();
      if (data.success) showToast(data.message, "success");
    } catch (e) { showToast("保存失败", "error"); }
    setIsSaving(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sshConfig.key);
    setIsCopied(true);
    showToast("已复制到剪贴板", "success");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <motion.section initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="paper-card border border-[var(--card-border)] dark:border-slate-800/50 rounded-2xl p-8 shadow-lg relative z-10">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">部署与发布</h2>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <div className="flex justify-between items-center mb-3">
               <label className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase flex items-center gap-1"><ShieldCheck size={14} className="text-[var(--ink-faint)]" /> 1. 本地博客目录</label>
               <button onClick={testPathConnection} disabled={isCheckingPath} className="text-[10px] paper-card text-[var(--ink-soft)] px-3 py-1 rounded-full font-bold hover:text-[var(--accent)] transition-colors">
                 {isCheckingPath ? "探测中…" : "测试路径"}
               </button>
            </div>
            <input type="text" value={deployData.blogPath} onChange={e => setDeployData({...deployData, blogPath: e.target.value})} className="w-full paper-card rounded-xl px-4 py-3 text-xs font-mono text-[var(--ink)] outline-none focus:ring-2 focus:ring-indigo-500/40" placeholder="C:/Workspace/XinghuisamaBlogs/XHBlogs" />
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <div className="flex justify-between items-center mb-4">
               <label className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase flex items-center gap-1"><GitBranch size={14} className="text-[var(--ink-faint)]" /> 2. GitHub 仓库配置</label>
               <button onClick={testGitConnection} disabled={isCheckingGit} className="text-[10px] paper-card text-[var(--ink-soft)] px-3 py-1 rounded-full font-bold hover:text-[var(--accent)] transition-colors">
                 {isCheckingGit ? "探测中…" : "校验 Git 环境"}
               </button>
            </div>

            {/* A线：静态部署配置区 */}
            <div className="p-4 paper-card rounded-2xl mb-4 relative">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[10px] font-black text-[var(--ink)] flex items-center gap-1"><Rocket size={12}/> 仓库一：静态页面（用于 GitHub Pages）</h4>
                <button onClick={(e) => { e.preventDefault(); handleGetSSH('static'); }} className="flex items-center gap-1 px-3 py-1.5 paper-card text-[var(--ink-soft)] rounded-full text-[10px] font-black hover:text-[var(--accent)] transition-all">
                  <Key size={12} /> 生成部署密钥
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">仓库地址（SSH，存放静态页面）</label>
                  <input type="text" value={deployData.staticRepoUrl} onChange={e => setDeployData({...deployData, staticRepoUrl: e.target.value})} className="w-full paper-card rounded-xl px-4 py-2 text-xs mt-1 outline-none font-mono text-[var(--ink)] focus:ring-2 focus:ring-indigo-500/40" placeholder="git@github.com:..." />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">目标分支</label>
                  <input type="text" value={deployData.staticBranch} onChange={e => setDeployData({...deployData, staticBranch: e.target.value})} className="w-full paper-card rounded-xl px-4 py-2 text-xs mt-1 outline-none font-mono text-[var(--ink)] focus:ring-2 focus:ring-indigo-500/40" placeholder="gh-pages" />
                </div>
              </div>
            </div>

            {/* B线：源码同步配置区 */}
            <div className="p-4 paper-card rounded-2xl mb-6 relative">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[10px] font-black text-[var(--ink)] flex items-center gap-1"><Code size={12}/> 仓库二：博客源码（用于 Vercel 部署）</h4>
                <button onClick={(e) => { e.preventDefault(); handleGetSSH('source'); }} className="flex items-center gap-1 px-3 py-1.5 paper-card text-[var(--ink-soft)] rounded-full text-[10px] font-black hover:text-[var(--accent)] transition-all">
                  <Key size={12} /> 生成部署密钥
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">仓库地址（SSH，存放源码）</label>
                  <input type="text" value={deployData.sourceRepoUrl} onChange={e => setDeployData({...deployData, sourceRepoUrl: e.target.value})} className="w-full paper-card rounded-xl px-4 py-2 text-xs mt-1 outline-none font-mono text-[var(--ink)] focus:ring-2 focus:ring-indigo-500/40" placeholder="git@github-source:..." />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">源码分支</label>
                  <input type="text" value={deployData.sourceBranch} onChange={e => setDeployData({...deployData, sourceBranch: e.target.value})} className="w-full paper-card rounded-xl px-4 py-2 text-xs mt-1 outline-none font-mono text-[var(--ink)] focus:ring-2 focus:ring-indigo-500/40" placeholder="main" />
                </div>
              </div>
            </div>

            {/* 操作按钮区 */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50 flex flex-col gap-3">
               <button onClick={() => setModalConfig({isOpen: true, type: 'init'})} disabled={isInitializing} className="w-full flex items-center justify-center gap-2 py-3.5 paper-card text-[var(--ink)] rounded-2xl text-sm font-black hover:shadow-md active:scale-95 transition-all">
                  <Wand2 size={18} className={isInitializing ? "animate-spin" : ""} /> {isInitializing ? "初始化中…" : "初始化仓库环境"}
               </button>

               <div className="flex gap-3 flex-col md:flex-row">
                 <button onClick={() => setModalConfig({isOpen: true, type: 'deploy'})} disabled={isDeploying || isUploading} className="flex-1 flex items-center justify-center gap-2 py-3.5 paper-card text-[var(--ink)] rounded-2xl text-sm font-black hover:shadow-md active:scale-95 transition-all">
                    <Rocket size={18} className={isDeploying ? "animate-bounce" : ""} /> {isDeploying ? "编译中…" : "编译并发布静态页"}
                 </button>

                 <button onClick={() => setModalConfig({isOpen: true, type: 'upload'})} disabled={isDeploying || isUploading} className="flex-1 flex items-center justify-center gap-2 py-3.5 paper-card text-[var(--ink)] rounded-2xl text-sm font-black hover:shadow-md active:scale-95 transition-all">
                    <CloudUpload size={18} className={isUploading ? "animate-pulse" : ""} /> {isUploading ? "推送中…" : "仅推送源码（Vercel）"}
                 </button>
               </div>
            </div>
          </div>

          <button onClick={handleSaveConfig} disabled={isSaving} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-sm font-black shadow-md active:scale-95 transition-all hover:shadow-2xl hover:-translate-y-1">
            <Save size={18} className="inline mr-2" /> {isSaving ? "正在保存…" : "保存配置（立即生效）"}
          </button>
        </div>
      </motion.section>

      {/* 弹窗传送门 */}
      {mounted && createPortal(
        <AnimatePresence>
          {modalConfig.isOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalConfig({ isOpen: false, type: null })} className="absolute inset-0 bg-slate-900/40" />

              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md paper-card-strong rounded-2xl shadow-lg border border-[var(--card-border)] p-10 text-center">

                {modalConfig.type === 'ssh' && (
                  <>
                        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6"><Key className="text-amber-500" size={32} /></div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                          {sshConfig.type === 'static' ? '静态页面仓库' : '源码仓库'}的部署密钥已生成
                        </h3>
                        <p className="text-xs text-slate-500 mb-6 leading-relaxed">请将此密钥配置到对应 GitHub 仓库的 Deploy Keys 中以获取对应权限。</p>

                        <div className="relative group mb-8">
                            <div className="w-full bg-slate-900 dark:bg-black rounded-2xl p-4 text-[10px] font-mono text-emerald-400 text-left break-all h-32 overflow-y-auto custom-scrollbar border border-[var(--card-border)] select-all">
                                {sshConfig.key}
                            </div>
                            <button onClick={copyToClipboard} className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white">
                                {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                        </div>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-3 text-left paper-card p-3 rounded-2xl">
                                <div className="w-6 h-6 rounded-full bg-[var(--paper-deep)] text-[var(--ink)] text-[10px] flex items-center justify-center shrink-0 font-bold">1</div>
                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">复制上方密钥内容</p>
                            </div>
                            <div className="flex items-center gap-3 text-left paper-card p-3 rounded-2xl">
                                <div className="w-6 h-6 rounded-full bg-[var(--paper-deep)] text-[var(--ink)] text-[10px] flex items-center justify-center shrink-0 font-bold">2</div>
                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex-1">前往该 GitHub 仓库的 Settings -&gt; Deploy keys 页面</p>
                            </div>
                            <div className="flex items-center gap-3 text-left paper-card p-3 rounded-2xl">
                                <div className="w-6 h-6 rounded-full bg-[var(--paper-deep)] text-[var(--ink)] text-[10px] flex items-center justify-center shrink-0 font-bold">3</div>
                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">添加该密钥并<strong className="ml-1">勾选 Allow write access</strong></p>
                            </div>
                        </div>
                        <button onClick={() => setModalConfig({isOpen: false, type: null})} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-black uppercase">我已完成配置</button>
                  </>
                )}

                {modalConfig.type === 'init' && (
                    <>
                        <div className="w-16 h-16 bg-[var(--paper-deep)] rounded-2xl flex items-center justify-center mx-auto mb-6"><Wand2 className="text-[var(--ink)]" size={32} /></div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">执行自动化改造？</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">自动绑定 Git 仓库、安装 gh-pages，并写入部署配置</p>
                        <div className="flex gap-3">
                            <button onClick={() => setModalConfig({isOpen: false, type: null})} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black transition-colors hover:bg-slate-200">取消</button>
                            <button onClick={executeInitEnv} className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl text-xs font-black shadow-lg active:scale-95 transition-all">确认执行</button>
                        </div>
                    </>
                )}

                {modalConfig.type === 'deploy' && (
                    <>
                        <div className="w-16 h-16 bg-[var(--paper-deep)] rounded-2xl flex items-center justify-center mx-auto mb-6"><Rocket className="text-[var(--ink)]" size={32} /></div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">执行编译并部署？</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">打包前端静态文件，推送到「仓库一（静态页面）」。</p>
                        <div className="flex gap-3">
                            <button onClick={() => setModalConfig({isOpen: false, type: null})} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black transition-colors hover:bg-slate-200">取消</button>
                            <button onClick={executeDeploy} className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl text-xs font-black shadow-lg active:scale-95 transition-all">确认执行</button>
                        </div>
                    </>
                )}

                {modalConfig.type === 'upload' && (
                    <>
                        <div className="w-16 h-16 bg-[var(--paper-deep)] rounded-2xl flex items-center justify-center mx-auto mb-6"><CloudUpload className="text-[var(--ink)]" size={32} /></div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">推送源码至 Vercel？</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">把本地源码提交并推送到「仓库二（博客源码）」，Vercel 会自动构建。</p>
                        <div className="flex gap-3">
                            <button onClick={() => setModalConfig({isOpen: false, type: null})} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black transition-colors hover:bg-slate-200">取消</button>
                            <button onClick={executeUploadSource} className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl text-xs font-black shadow-lg active:scale-95 transition-all">开始推送</button>
                        </div>
                    </>
                )}

              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}