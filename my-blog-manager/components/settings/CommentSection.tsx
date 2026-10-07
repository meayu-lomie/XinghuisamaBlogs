import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Key, GitBranch, Hash, Tag, Loader2 } from 'lucide-react';

interface CommentSectionProps {
  formData: any;
  handleUpdate: (field: string, value: any) => void;
  pushToQueue: (label: string, key?: string, value?: any) => void;
}

export default function CommentSection({ formData, handleUpdate, pushToQueue }: CommentSectionProps) {
  // 兼容旧配置：若只有 gitalkConfig 则用空值初始化 giscusConfig
  const giscus = formData.giscusConfig || {
    repo: '',
    repoId: '',
    category: 'Announcements',
    categoryId: '',
  };

  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState('');

  const updateGiscus = (key: string, value: any) => {
    handleUpdate('giscusConfig', { ...giscus, [key]: value });
  };

  /**
   * 通过 giscus 官方接口自动获取 repoId 与分类 ID。
   * 手动去 giscus.app 抄 ID 容易出错，这里直接查。
   * 前提：仓库公开、已开启 Discussions、已安装 giscus App。
   */
  const fetchIds = async () => {
    const repo = (giscus.repo || '').trim();
    if (!repo.includes('/')) {
      setFetchMsg('请先填写完整的仓库名，格式为 用户名/仓库名');
      return;
    }
    setFetching(true);
    setFetchMsg('');
    try {
      // giscus 的元数据接口：需要 GitHub token 才能读 repoId，
      // 因此这里改用 GitHub 公开 API 取仓库 ID 与讨论分类。
      const [owner, name] = repo.split('/');
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${name}`);
      if (!repoRes.ok) {
        setFetchMsg(`读取仓库失败（HTTP ${repoRes.status}），请确认仓库名与公开状态`);
        return;
      }
      const repoData = await repoRes.json();
      if (!repoData.has_discussions) {
        setFetchMsg('该仓库尚未开启 Discussions，请先在 GitHub 仓库设置里开启');
        return;
      }
      // 更新 repoId（node_id 即 giscus 需要的 repoId）
      updateGiscus('repoId', repoData.node_id);

      // 取讨论分类
      const catRes = await fetch(`https://api.github.com/repos/${owner}/${name}/discussions/categories`);
      if (catRes.ok) {
        const cats = await catRes.json();
        const wanted = (giscus.category || 'Announcements').toLowerCase();
        const hit = Array.isArray(cats)
          ? cats.find((c: any) => (c.name || '').toLowerCase() === wanted) || cats[0]
          : null;
        if (hit) {
          updateGiscus('category', hit.name);
          updateGiscus('categoryId', hit.node_id);
          setFetchMsg(`已获取：repoId 与分类「${hit.name}」`);
        } else {
          setFetchMsg('已获取 repoId；分类未找到，请手动选择');
        }
      } else {
        setFetchMsg('已获取 repoId；分类读取失败，请手动填写');
      }
    } catch (e: any) {
      setFetchMsg(`获取失败：${e?.message || e}`);
    } finally {
      setFetching(false);
    }
  };

  const saveToQueue = () => {
    pushToQueue('Giscus 评论系统', 'giscusConfig', giscus);
  };

  const inputCls =
    'w-full bg-white/50 dark:bg-slate-800/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono dark:text-slate-200';
  const labelCls =
    'text-xs font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2';

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-6"
    >
      <div className="bg-white/40 dark:bg-slate-900/40 border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-xl">
        <div className="flex justify-between items-center mb-8 border-b border-white/30 dark:border-slate-700/50 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              评论系统配置
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-bold">
              基于 GitHub Discussions（Giscus），无需暴露 clientSecret
            </p>
          </div>
          <button
            onClick={saveToQueue}
            className="px-6 py-3 bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 hover:bg-indigo-600 transition-colors"
          >
            <Save size={16} /> 保存修改
          </button>
        </div>

        <div className="space-y-6">
          {/* 仓库 + 自动获取 */}
          <div>
            <label className={labelCls}>
              <GitBranch size={14} className="text-slate-600 dark:text-slate-300" /> 仓库（用户名/仓库名）
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={giscus.repo}
                onChange={(e) => updateGiscus('repo', e.target.value)}
                className={inputCls}
                placeholder="例如: meayu-lomie/XinghuisamaBlogs"
              />
              <button
                onClick={fetchIds}
                disabled={fetching}
                className="shrink-0 px-5 py-3 bg-slate-700 dark:bg-slate-600 text-white rounded-xl font-black text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {fetching ? <Loader2 size={16} className="animate-spin" /> : <Hash size={16} />}
                自动获取 ID
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 ml-1">
              前置条件：仓库公开 + 已开启 Discussions + 已安装 giscus App。
              {fetchMsg && <span className="block mt-1 text-indigo-500 font-bold">{fetchMsg}</span>}
            </p>
          </div>

          {/* repoId */}
          <div>
            <label className={labelCls}>
              <Key size={14} className="text-indigo-400" /> 仓库 ID（repoId）
            </label>
            <input
              type="text"
              value={giscus.repoId}
              onChange={(e) => updateGiscus('repoId', e.target.value)}
              className={inputCls}
              placeholder="点上方「自动获取 ID」，或从 giscus.app 复制"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 分类名 */}
            <div>
              <label className={labelCls}>
                <Tag size={14} className="text-purple-400" /> 讨论分类名（category）
              </label>
              <input
                type="text"
                value={giscus.category}
                onChange={(e) => updateGiscus('category', e.target.value)}
                className={inputCls}
                placeholder="Announcements"
              />
            </div>
            {/* 分类 ID */}
            <div>
              <label className={labelCls}>
                <Key size={14} className="text-purple-400" /> 分类 ID（categoryId）
              </label>
              <input
                type="text"
                value={giscus.categoryId}
                onChange={(e) => updateGiscus('categoryId', e.target.value)}
                className={inputCls}
                placeholder="点上方「自动获取 ID」"
              />
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            说明：Giscus 把评论存在仓库的 Discussions 里。访客需登录 GitHub 才能评论；
            只有管理员能在该分类下发起新讨论。推荐用 Announcements 分类，可防止访客乱建帖子。
          </p>
        </div>
      </div>
    </motion.section>
  );
}
