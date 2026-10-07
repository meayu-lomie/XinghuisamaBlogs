"use client";

import { useTheme, type ThemeStyle } from './ThemeProvider';

const STYLES: { id: ThemeStyle; label: string }[] = [
  { id: 'xuan', label: '宣纸' },
  { id: 'journal', label: '手账' },
];

/**
 * 导航栏里的主题切换：左侧切版式（宣纸/手账），右侧切明暗。
 * 用图标 + 文字，避免在窄导航里占太多宽度。
 */
export default function NavThemeSwitch() {
  const { isDark, toggleTheme, style, setStyle } = useTheme();

  return (
    <div className="flex items-center gap-1">
      {/* 版式切换：当前版式高亮 */}
      {STYLES.map((s) => {
        const active = style === s.id;
        return (
          <button
            key={s.id}
            onClick={() => setStyle(s.id)}
            aria-pressed={active}
            title={`切换到${s.label}版式`}
            className="rounded px-2 py-1 text-xs tracking-wider transition-colors duration-200"
            style={{
              color: active ? 'var(--accent)' : 'var(--ink-faint)',
              borderBottom: active ? '1px solid var(--accent)' : '1px solid transparent',
            }}
          >
            {s.label}
          </button>
        );
      })}

      {/* 明暗切换 */}
      <button
        onClick={toggleTheme}
        aria-pressed={isDark}
        title={isDark ? '切换到日间' : '切换到夜间'}
        className="ml-1 grid h-6 w-6 place-items-center rounded-full border transition-colors duration-200"
        style={{ borderColor: 'var(--rule)', color: 'var(--ink-soft)' }}
      >
        {isDark ? (
          // 月亮
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
            <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
          </svg>
        ) : (
          // 太阳
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        )}
      </button>
    </div>
  );
}
