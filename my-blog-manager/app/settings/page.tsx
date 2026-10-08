"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOperations } from '../../context/OperationContext';
import { siteConfig } from '../../siteConfig';
import { ToastProvider, useToast } from '../../components/ToastProvider';

import ProfileSection from '../../components/settings/ProfileSection';
import BackgroundSection from '../../components/settings/BackgroundSection';
import GallerySection from '../../components/settings/GallerySection';
import RepoSection from '../../components/settings/RepoSection';
 import CommentSection from '../../components/settings/CommentSection';
 import ModelSection from '../../components/settings/ModelSection';

function SettingsContent() {
  const { operations, addOperation } = useOperations();
  const [activeTab, setActiveTab] = useState('profile');
  const { showToast } = useToast();

  const [formData, setFormData] = useState<any>({
    siteUrl: siteConfig.siteUrl || "",
    authorName: siteConfig.authorName || "",
    bio: siteConfig.bio || "",
    avatarUrl: siteConfig.avatarUrl || "",
    social: siteConfig.social || {},
    bgImages: [...(siteConfig.bgImages || [])],
    bgEnabled: siteConfig.bgEnabled || false,
    giscusConfig: siteConfig.giscusConfig || {
      repo: '',
      repoId: '',
      category: 'Announcements',
      categoryId: '',
    },
    buildDate: siteConfig.buildDate || "2026-03-23T00:00:00",
    icpConfig: siteConfig.icpConfig || { name: "", link: "" },
  });


  useEffect(() => {
    const fetchRealConfig = async () => {
      try {
        const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
        const configData = await configRes.json();

        const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/config/get`, { cache: 'no-store' });
        const data = await res.json();

        if (data.success && data.data) {
          console.log("成功从后端拉取到真实配置:", data.data);
          setFormData((prev: any) => ({
            ...prev,
            ...data.data,
            social: { ...(prev.social || {}), ...(data.data.social || {}) },
            giscusConfig: { ...(prev.giscusConfig || {}), ...(data.data.giscusConfig || {}) },
            buildDate: data.data.buildDate || prev.buildDate,
            icpConfig: data.data.icpConfig || prev.icpConfig,
          }));
        } else {
          console.error("后端返回失败:", data.message);
          showToast("读取后端配置失败，当前显示为本地静态数据", "warning");
        }
      } catch (error) {
        console.error("请求后端配置通道断开:", error);
        showToast("无法连接到 Python 后端服务", "error");
      }
    };

    fetchRealConfig();
  }, []);

  const handleUpdate = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };


  const pushToQueue = (label: string, key?: string, value?: any) => {
    addOperation({
      id: Date.now().toString(),
      type: 'CONFIG',
      label: `暂存配置：${label}`,
      description: `修改了 ${label}，等待写入博客`,
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
      payload: formData,
      key: key,
      value: value
    });
    showToast(`【${label}】已加入收件箱，请在右上角点击【写入博客】`, "success");
  };

  const menuItems = [
    { id: 'profile', name: '个人名片设置' },
    { id: 'background', name: '视觉背景配置' },
    { id: 'gallery', name: '图库配置管理' },
    { id: 'comment', name: '评论系统配置' },
    { id: 'model', name: '模型设置' },
    { id: 'repo', name: '项目仓库设置' },
  ];

  return (
    <div className="min-h-screen relative pb-10">

      <div>
        <main className="w-[95%] max-w-7xl mx-auto mt-24 flex flex-col md:flex-row gap-8 items-start relative z-10">

          <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">
            <div className="paper-card border border-[var(--card-border)] dark:border-slate-800/50 rounded-2xl p-4 shadow-md">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-4 ml-2 tracking-widest">系统管理维度</p>
              <nav className="flex flex-col gap-2">
                {menuItems.map((item) => (
                  <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm ${activeTab === item.id ? 'bg-indigo-500 text-white shadow-lg translate-x-1' : 'text-slate-600 dark:text-slate-300 hover:paper-card dark:hover:bg-slate-800/50'}`}>
                  <span>{item.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="flex-1 w-full">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && <ProfileSection key="profile" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'background' && <BackgroundSection key="background" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'gallery' && <GallerySection key="gallery" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'comment' && <CommentSection key="comment" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'model' && <ModelSection key="model" />}

              {activeTab === 'repo' && <RepoSection key="repo" />}
            </AnimatePresence>
          </div>

        </main>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ToastProvider>
      <SettingsContent />
    </ToastProvider>
  );
}