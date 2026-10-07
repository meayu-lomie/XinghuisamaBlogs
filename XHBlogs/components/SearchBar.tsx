"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'next-view-transitions';
import { AnimatePresence, motion } from 'framer-motion';

interface Post {
  slug: string;
  title?: string;
  description?: string;
  tags?: string[];
  date?: string;
  [key: string]: any;
}

interface Moment {
  id: string;
  content?: string;
  location?: string;
  date?: string;
  [key: string]: any;
}

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const Highlight = ({ text = '', query = '' }) => {
  if (!query.trim() || !text) return <>{text}</>;

  const safeQuery = escapeRegExp(query);
  const regex = new RegExp(`(${safeQuery})`, 'gi');
  const parts = String(text).split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-300 dark:bg-yellow-500/80 text-slate-900 dark:text-white px-1 mx-[1px] rounded-[4px] shadow-sm font-bold transition-all">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

const TypeBadge = ({ label }: { label: string }) => (
  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10 shrink-0 mt-1">
    {label}
  </span>
);

export default function SearchBar({ posts = [], moments = [] }: { posts?: Post[]; moments?: Moment[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { chatters: chatterResults, moments: momentResults } = useMemo(() => {
    if (!searchQuery.trim()) return { chatters: [], moments: [] };
    const query = searchQuery.toLowerCase();

    const matchedChatters = posts.filter(post => {
      const titleMatch = (post.title || '').toLowerCase().includes(query);
      const descMatch = (post.description || '').toLowerCase().includes(query);
      const tagMatch = (post.tags || []).some(tag => tag.toLowerCase().includes(query));
      return titleMatch || descMatch || tagMatch;
    });

    const matchedMoments = moments.filter(m => {
      const contentMatch = (m.content || '').toLowerCase().includes(query);
      const locationMatch = (m.location || '').toLowerCase().includes(query);
      return contentMatch || locationMatch;
    });

    return { chatters: matchedChatters, moments: matchedMoments };
  }, [searchQuery, posts, moments]);

  const totalCount = chatterResults.length + momentResults.length;

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-10 z-[100]" ref={containerRef}>
      <form className="relative group" onSubmit={(e) => e.preventDefault()}>

        {/* 先渲染 Input */}
        <input
          type="text"
          className="w-full pl-14 pr-6 py-4 paper-card border border-[var(--card-border)] rounded-2xl shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 dark:text-slate-200 transition-all placeholder-slate-500 dark:placeholder-slate-400 font-medium text-lg relative z-0"
          placeholder="搜寻杂谈与说说..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
          spellCheck="false"
        />

        {/* 放大镜置于 input 之后并强制置顶 */}
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none select-none z-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors drop-shadow-sm"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

      </form>

      <AnimatePresence>
        {isOpen && searchQuery.trim() !== '' && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-4 paper-card-strong border border-[var(--card-border)] dark:border-slate-700/50 rounded-2xl shadow-lg overflow-hidden max-h-[450px] overflow-y-auto z-20"
          >
            {totalCount > 0 ? (
              <div className="flex flex-col py-3">

                {chatterResults.length > 0 && (
                  <div className="px-6 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">杂谈 · Records</div>
                )}
                {chatterResults.map((post) => (
                  <Link
                    href={`/chatter/${post.slug}`}
                    key={`chatter-${post.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-5 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10 transition-colors group border-b border-slate-100/50 dark:border-slate-800/50 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 transition-colors line-clamp-1">
                        <Highlight text={post.title} query={searchQuery} />
                      </h4>
                      {post.date && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-md shrink-0 mt-1">
                          {String(post.date).split(/[ T]/)[0]}
                        </span>
                      )}
                    </div>

                    {post.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        <Highlight text={post.description} query={searchQuery} />
                      </p>
                    )}

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {post.tags.map(tag => (
                          <span key={tag} className="flex items-center text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5 opacity-60">
                              <line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line>
                            </svg>
                            <Highlight text={tag} query={searchQuery} />
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}

                {momentResults.length > 0 && (
                  <div className="px-6 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">说说 · Moments</div>
                )}
                {momentResults.map((m) => (
                  <Link
                    href={`/moments#${m.id}`}
                    key={`moment-${m.id}`}
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-4 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10 transition-colors border-b border-slate-100/50 dark:border-slate-800/50 last:border-0 flex items-start gap-3"
                  >
                    <TypeBadge label="说说" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        <Highlight text={m.content} query={searchQuery} />
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {m.date && <span className="text-[10px] font-mono text-slate-400">{String(m.date).split(/[ T]/)[0]}</span>}
                        {m.location && <span className="text-[10px] text-slate-400">{m.location}</span>}
                      </div>
                    </div>
                  </Link>
                ))}

              </div>
            ) : (
              <div className="px-6 py-12 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-slate-400">
                    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  没有找到与 "<span className="text-indigo-500 font-bold">{searchQuery}</span>" 相关的内容
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
