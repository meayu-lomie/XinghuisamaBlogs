"use client";
import { createContext, useContext, useEffect, useState } from 'react';

// 主题风格：宣纸 / 手账
export type ThemeStyle = 'xuan' | 'journal';

type ThemeContextValue = {
  isDark: boolean;
  toggleTheme: () => void;
  style: ThemeStyle;
  setStyle: (s: ThemeStyle) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleTheme: () => {},
  style: 'xuan',
  setStyle: () => {},
});

const STYLE_CLASSES: ThemeStyle[] = ['xuan', 'journal'];

/** 把主题状态写到 html 上；首屏由 layout 内联脚本先设一次，这里只负责后续切换 */
function applyTheme(isDark: boolean, style: ThemeStyle) {
  const root = document.documentElement;
  root.classList.toggle('dark', isDark);
  STYLE_CLASSES.forEach((s) => root.classList.toggle(`theme-${s}`, s === style));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [style, setStyleState] = useState<ThemeStyle>('xuan');

  useEffect(() => {
    // 控制台用独立 key，避免与博客前端的主题设置互相干扰
    const savedMode = localStorage.getItem('manager-theme');
    const savedStyle = localStorage.getItem('manager-style') as ThemeStyle | null;

    const nextDark = savedMode === 'dark';
    const nextStyle: ThemeStyle =
      savedStyle === 'journal' || savedStyle === 'xuan' ? savedStyle : 'xuan';

    setIsDark(nextDark);
    setStyleState(nextStyle);
    applyTheme(nextDark, nextStyle);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    applyTheme(nextDark, style);
    localStorage.setItem('manager-theme', nextDark ? 'dark' : 'light');
  };

  const setStyle = (nextStyle: ThemeStyle) => {
    setStyleState(nextStyle);
    applyTheme(isDark, nextStyle);
    localStorage.setItem('manager-style', nextStyle);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, style, setStyle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
