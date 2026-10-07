import Link from 'next/link';
import { collectTags } from '../../../lib/tags-data';

export async function generateStaticParams() {
  return Array.from(collectTags().keys()).map((tag) => ({
    tag: encodeURIComponent(tag),
  }));
}

export default async function TagDetailPage({ params }: { params: Promise<{ tag: string }> }) {
  const resolved = await params;
  const tag = decodeURIComponent(resolved.tag);
  const posts = collectTags().get(tag) || [];

  return (
    <div className="w-[95%] md:w-[90%] max-w-4xl mx-auto mt-24 md:mt-28 pb-20 relative z-10">
      <div className="mb-10">
        <Link href="/tags" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors">← 全部标签</Link>
        <h1 className="mt-3 text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          <span className="text-indigo-500">#</span> {tag}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">{posts.length} 篇杂谈</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl paper-card border border-[var(--card-border)]">
          <p className="text-slate-500 dark:text-slate-400 font-bold">这个标签下暂时没有内容</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/chatter/${p.slug}`}
              className="group flex items-center justify-between gap-4 rounded-2xl paper-card border border-[var(--card-border)] shadow-md p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{p.title}</h2>
                <p className="text-[11px] text-slate-400 font-bold mt-1 font-mono">{String(p.date).split(/[ T]/)[0].replace(/-/g, '.')}</p>
              </div>
              <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">阅读 →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
