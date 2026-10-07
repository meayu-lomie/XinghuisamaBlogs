import Link from 'next/link';
import { collectTags } from '../../lib/tags-data';

export const metadata = {
  title: '标签 | Meayu の 拾光集',
};

export default function TagsPage() {
  const tagMap = collectTags();
  const tags = Array.from(tagMap.entries()).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 pb-20 relative z-10">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">标签</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">Tags · 按话题检索杂谈</p>
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-20 rounded-2xl paper-card border border-[var(--card-border)]">
          <p className="text-slate-500 dark:text-slate-400 font-bold">还没有任何标签，在杂谈的 frontmatter 里写上 tags 就会出现在这里</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tags.map(([tag, posts]) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="group rounded-2xl paper-card border border-[var(--card-border)] shadow-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 group-hover:scale-105 origin-left transition-transform">#{tag}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-500/5 dark:bg-white/5 px-2.5 py-1 rounded-full border border-slate-500/10">{posts.length} 篇</span>
              </div>
              <div className="space-y-1.5">
                {posts.slice(0, 3).map((p) => (
                  <p key={p.slug} className="text-xs font-bold text-slate-600 dark:text-slate-300 line-clamp-1">{p.title}</p>
                ))}
                {posts.length > 3 && (
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-1">还有 {posts.length - 3} 篇…</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
