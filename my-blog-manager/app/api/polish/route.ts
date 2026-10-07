import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

/**
 * AI 润色代理：编辑器/说说框把文本发到这里，由服务端读本地模型配置
 * （my-blog-manager/data/model_config.json，与 Python 侧「测试连接」同一份）
 */
const DEFAULT_PROMPT_HTML = `你是一位中文博客文字编辑。用户会给你一段博客正文的 HTML。请润色其中的文字，让表达更流畅、准确、有文采。硬性要求：
1. 保持 HTML 标签结构完全不变：所有标签、属性、style、class 原样保留，只允许修改标签内的中文文字；
2. 不改变事实、叙述顺序和信息量，不添加原文没有的内容；
3. 代码块（pre/code 内）整体原样保留，图片地址、链接地址原样保留；
4. 直接输出润色后的完整 HTML，不要任何解释，不要用代码块包裹。`;

const DEFAULT_PROMPT_TEXT = `你是一位中文编辑。请润色下面这段文字：表达更流畅自然、修正错别字、去掉口水话，但保持作者原来的语气和风格，不改变事实，不添加内容。直接输出润色后的文字，不要解释。`;

function loadModelConfig(): Record<string, string> {
  const file = path.join(process.cwd(), 'data', 'model_config.json');
  const fallback: Record<string, string> = {
    protocol: 'openai', baseUrl: '', modelId: '', apiKey: '',
    polishPromptHtml: DEFAULT_PROMPT_HTML,
    polishPromptText: DEFAULT_PROMPT_TEXT,
  };
  try {
    if (fs.existsSync(file)) {
      const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
      return { ...fallback, ...stored };
    }
  } catch (e) {
    console.error('[api/polish] 读取模型配置失败:', e);
  }
  return fallback;
}

async function callOpenAI(cfg: Record<string, string>, prompt: string, content: string): Promise<string> {
  const res = await fetch(`${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.modelId,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content },
      ],
      temperature: 0.7,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `模型返回 HTTP ${res.status}`);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('模型返回内容为空');
  return String(text).trim();
}

async function callGemini(cfg: Record<string, string>, prompt: string, content: string): Promise<string> {
  const base = cfg.baseUrl.replace(/\/+$/, '');
  let url: string;
  if (base.includes('/models/')) {
    url = `${base}:generateContent?key=${cfg.apiKey}`;
  } else if (base.endsWith('/v1beta') || base.endsWith('/v1')) {
    url = `${base}/models/${cfg.modelId}:generateContent?key=${cfg.apiKey}`;
  } else {
    url = `${base}/v1beta/models/${cfg.modelId}:generateContent?key=${cfg.apiKey}`;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: prompt }] },
      contents: [{ parts: [{ text: content }] }],
      generationConfig: { temperature: 0.7 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `模型返回 HTTP ${res.status}`);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('模型返回内容为空');
  return String(text).trim();
}

export async function POST(req: Request) {
  try {
    const { content, mode = 'text' } = await req.json();
    if (!content || !String(content).trim()) {
      return Response.json({ success: false, message: '内容为空，先写点什么再润色' }, { status: 400 });
    }

    const cfg = loadModelConfig();
    if (!cfg.apiKey || !cfg.baseUrl) {
      return Response.json({ success: false, message: '还没有配置模型，请到【设置 → 模型设置】填写并保存' }, { status: 400 });
    }

    const prompt = mode === 'html'
      ? (cfg.polishPromptHtml || DEFAULT_PROMPT_HTML)
      : (cfg.polishPromptText || DEFAULT_PROMPT_TEXT);
    const polished = cfg.protocol === 'gemini'
      ? await callGemini(cfg, prompt, String(content))
      : await callOpenAI(cfg, prompt, String(content));

    return Response.json({ success: true, polished });
  } catch (e: any) {
    console.error('[api/polish] 润色失败:', e?.message || e);
    return Response.json({ success: false, message: e?.message || '润色请求失败' }, { status: 500 });
  }
}
