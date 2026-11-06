'use client';
import { useEffect, useState } from 'react';
import { cx } from '@/lib/motion/core';

/* GridOverlay — 4/8/12 컬럼 그리드 오버레이. Shift+G 로 토글. 개발 전용(레이아웃에서 production 제외). */
export function GridOverlay({ visible, inline }: { visible?: boolean; inline?: boolean }) {
  const [on, set] = useState(!!visible);
  useEffect(() => set(!!visible), [visible]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'G' || e.key === 'g') && !/input|textarea/i.test((e.target as HTMLElement).tagName)) set((v) => !v);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  if (!on) return null;
  return (
    <div className={cx('lab-gridov', inline && 'lab-gridov--inline')} aria-hidden="true">
      <div className="lab-container lab-grid lab-gridov__in">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i}>
            <b>{i + 1}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
