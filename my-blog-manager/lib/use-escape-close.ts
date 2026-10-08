"use client";

import { useEffect } from 'react';

/**
 * 让浮层支持 Esc 关闭。
 *
 * 全站的灯箱、确认框、弹窗此前都只能靠点背景关闭，键盘用户没法退出，
 * 也不符合常见预期。把这段逻辑抽成 hook，各处传 open 与 onClose 即可。
 *
 * enabled 用于「该浮层当前不该响应 Esc」的场景（例如上层还压着另一个弹窗）。
 */
export function useEscapeClose(open: boolean, onClose: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!open || !enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, enabled, onClose]);
}
