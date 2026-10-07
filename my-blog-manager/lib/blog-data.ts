import fs from 'fs';
import { getBlogDir } from './blog-paths';

/**
 * 读取博客目录下的 data/*.ts 数据文件。
 *
 * 这些文件是「代码里嵌数据」的格式，由后端写入，形如：
 *   export const albums: Album[] = [ {...}, {...} ];
 *
 * 管理端以前是静态 import 自己那份 data/*.ts，导致
 * 「写入写的是博客那份、页面显示的是自己那份」两边不一致。
 * 现在统一从这里读博客目录，保证和博客展示的内容同源。
 */

/** 从 TS 文本里抽出 `export const xxx = [...]` 的数组并解析为 JSON */
function parseTsArray(fileText: string, exportName: string): any[] {
  // 定位 `export const <name> ... = [`
  const startRe = new RegExp(`export\\s+const\\s+${exportName}\\s*(?::[^=]*)?=\\s*\\[`);
  const m = startRe.exec(fileText);
  if (!m) return [];

  const start = m.index + m[0].length - 1; // 指向 '['
  // 括号配对扫描，找到与之匹配的 ']'（考虑字符串里的括号）
  let depth = 0;
  let inStr: string | null = null;
  let end = -1;
  for (let i = start; i < fileText.length; i++) {
    const c = fileText[i];
    const prev = fileText[i - 1];

    if (inStr) {
      if (c === inStr && prev !== '\\') inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      inStr = c;
      continue;
    }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') {
      depth--;
      if (depth === 0 && c === ']') {
        end = i;
        break;
      }
    }
  }
  if (end < 0) return [];

  // JS 对象字面量在多数情况下是合法 JSON（后端就是用 json.dumps 写的），
  // 但为稳妥起见，把可能的单引号/尾逗号清理掉再解析。
  let body = fileText.slice(start, end + 1);
  body = body.replace(/,\s*([\]}])/g, '$1'); // 去尾逗号

  try {
    return JSON.parse(body);
  } catch {
    // 退一步：尝试把单引号转成双引号（简单场景）
    try {
      return JSON.parse(body.replace(/'/g, '"'));
    } catch {
      console.warn(`[blog-data] 解析 ${exportName} 失败，返回空数组`);
      return [];
    }
  }
}

/** 读取博客 data 目录下某个 .ts 文件里的导出数组 */
export function readBlogDataArray(fileName: string, exportName: string): any[] {
  try {
    const file = getBlogDir('data', fileName);
    if (!file || !fs.existsSync(file)) return [];
    return parseTsArray(fs.readFileSync(file, 'utf8'), exportName);
  } catch (e) {
    console.warn(`[blog-data] 读取 ${fileName} 出错:`, e);
    return [];
  }
}
