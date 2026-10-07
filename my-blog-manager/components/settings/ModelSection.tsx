"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Key, Bot, Link2, Cpu, Loader2, PlugZap, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useToast } from '../ToastProvider';

/**
 * 模型设置：AI 润色功能的外部模型配置。
 * 与其他设置 tab 不同：模型配置（含 API Key）不进 siteConfig，也不走操作队列，
 * 直接读写 Python 后端 /api/model/get|update|test，Key 只存本地 model_config.json。
 */

const inputCls =
  'w-full bg-white/50 dark:bg-slate-800/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono dark:text-slate-200';
const labelCls =
  'text-xs font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2';

export default function ModelSection() {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    protocol: 'openai', baseUrl: '', modelId: '', apiKey: '',
    polishPromptHtml: '', polishPromptText: '',
  });
  const [savedMask, setSavedMask] = useState('');
  const [defaultPrompts, setDefaultPrompts] = useState({ html: '', text: '' });
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
        const configData = await configRes.json();
        const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/model/get`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.data) {
          setForm((prev) => ({
            ...prev,
            protocol: data.data.protocol || 'openai',
            baseUrl: data.data.baseUrl || '',
            modelId: data.data.modelId || '',
            polishPromptHtml: data.data.polishPromptHtml || '',
            polishPromptText: data.data.polishPromptText || '',
            apiKey: '', // Key 不回显明文，只提示已保存
          }));
          setSavedMask(data.data.apiKey || '');
          setDefaultPrompts({
            html: data.data.defaultPromptHtml || '',
            text: data.data.defaultPromptText || '',
          });
        }
      } catch (e) {
        console.error('读取模型配置失败:', e);
        showToast('读取模型配置失败，后端服务未连接', 'error');
      }
    };
    load();
  }, []);

  const update = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/model/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: form }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedMask(data.data?.apiKey || '');
        showToast('模型配置已保存', 'success');
      } else {
        showToast(data.message || '保存失败', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('保存失败：后端服务未连接', 'error');
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setTestMsg('');
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/model/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: form }),
      });
      const data = await res.json();
      setTestMsg(data.message || (data.success ? '连接成功' : '连接失败'));
      showToast(data.success ? '模型连接正常' : '模型连接失败，详见提示', data.success ? 'success' : 'error');
    } catch (e) {
      console.error(e);
      setTestMsg('后端服务未连接');
      showToast('测试失败：后端服务未连接', 'error');
    } finally {
      setTesting(false);
    }
  };

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
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">模型设置</h2>
            <p className="text-slate-500 text-sm mt-1 font-bold">
              供编辑器与说说的「AI 润色」调用；Key 只保存在本机 data/model_config.json，不会写入博客仓库
            </p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-3 bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 hover:bg-indigo-600 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 保存修改
          </button>
        </div>

        <div className="space-y-6">
          {/* 协议 */}
          <div>
            <label className={labelCls}>
              <Bot size={14} className="text-slate-600 dark:text-slate-300" /> 协议
            </label>
            <select
              value={form.protocol}
              onChange={(e) => update('protocol', e.target.value)}
              className={inputCls}
            >
              <option value="openai">OpenAI 兼容（DeepSeek / Kimi / GLM / Qwen / OpenRouter 等）</option>
              <option value="gemini">Gemini 原生（Google）</option>
            </select>
          </div>

          {/* 请求地址 */}
          <div>
            <label className={labelCls}>
              <Link2 size={14} className="text-slate-600 dark:text-slate-300" /> 请求地址 (Base URL)
            </label>
            <input
              type="text"
              value={form.baseUrl}
              onChange={(e) => update('baseUrl', e.target.value)}
              className={inputCls}
              placeholder="例如: https://api.deepseek.com（填到域名即可，兼容 /v1 结尾）"
            />
          </div>

          {/* 模型 ID */}
          <div>
            <label className={labelCls}>
              <Cpu size={14} className="text-slate-600 dark:text-slate-300" /> 模型 ID
            </label>
            <input
              type="text"
              value={form.modelId}
              onChange={(e) => update('modelId', e.target.value)}
              className={inputCls}
              placeholder="例如: deepseek-chat / moonshot-v1-8k / glm-4-flash"
            />
          </div>

          {/* API Key */}
          <div>
            <label className={labelCls}>
              <Key size={14} className="text-slate-600 dark:text-slate-300" /> API Key
              {savedMask && (
                <span className="ml-2 text-[10px] normal-case font-bold text-emerald-600 dark:text-emerald-400">
                  已保存 {savedMask}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={form.apiKey}
                onChange={(e) => update('apiKey', e.target.value)}
                className={`${inputCls} pr-12`}
                placeholder={savedMask ? '已保存，留空表示不修改' : '在此粘贴服务商提供的 API Key'}
                autoComplete="off"
              />
              <button
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                title={showKey ? '隐藏' : '显示'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* 润色提示词（HTML 模式：文章/杂谈编辑器用） */}
          <div>
            <label className={labelCls}>
              <Sparkles size={14} className="text-emerald-500" /> 润色提示词 · 正文模式（保留 HTML 结构）
            </label>
            <textarea
              value={form.polishPromptHtml}
              onChange={(e) => update('polishPromptHtml', e.target.value)}
              className={`${inputCls} h-28 resize-none leading-relaxed`}
              placeholder="留空 = 使用默认提示词"
            />
            <button
              onClick={() => update('polishPromptHtml', defaultPrompts.html)}
              className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors"
              disabled={!defaultPrompts.html}
            >
              恢复默认
            </button>
          </div>

          {/* 润色提示词（纯文本模式：说说用） */}
          <div>
            <label className={labelCls}>
              <Sparkles size={14} className="text-emerald-500" /> 润色提示词 · 纯文本模式（说说用）
            </label>
            <textarea
              value={form.polishPromptText}
              onChange={(e) => update('polishPromptText', e.target.value)}
              className={`${inputCls} h-28 resize-none leading-relaxed`}
              placeholder="留空 = 使用默认提示词"
            />
            <button
              onClick={() => update('polishPromptText', defaultPrompts.text)}
              className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors"
              disabled={!defaultPrompts.text}
            >
              恢复默认
            </button>
          </div>

          {/* 测试连接 */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={test}
              disabled={testing}
              className="px-5 py-3 bg-slate-700 dark:bg-slate-600 text-white rounded-xl font-black text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {testing ? <Loader2 size={16} className="animate-spin" /> : <PlugZap size={16} />}
              测试连接
            </button>
            {testMsg && <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{testMsg}</span>}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
