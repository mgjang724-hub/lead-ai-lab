'use client';
import { useEffect, useRef, useState } from 'react';
import { cx, scrollMax, scrollToY, scrollTop, subscribeScroll } from '@/lib/motion/core';
import { Icon } from '@/components/ui/Icon';

/* BackToTop — 스크롤 진행 링이 있는 원형 버튼; 페이지 40% 이후 등장 */
export function BackToTop({ threshold = 0.4, focusId = 'lab-main', className }: { threshold?: number; focusId?: string; className?: string }) {
  const ring = useRef<SVGCircleElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    return subscribeScroll(null, () => {
      const max = scrollMax(null);
      const t = scrollTop(null);
      const pr = max > 0 ? t / max : 0;
      if (ring.current) ring.current.style.strokeDashoffset = String(150.8 * (1 - pr));
      setShown(pr > threshold);
    });
  }, [threshold]);
  return (
    <button
      type="button"
      className={cx('lab-totop', shown && 'is-shown', className)}
      aria-label="맨 위로"
      tabIndex={shown ? 0 : -1}
      aria-hidden={shown ? undefined : 'true'}
      onClick={() => {
        scrollToY(null, 0, true);
        document.getElementById(focusId)?.focus({ preventScroll: true });
      }}
    >
      <svg className="lab-totop__ring" viewBox="0 0 52 52" aria-hidden="true">
        <circle cx={26} cy={26} r={24} className="lab-totop__track" />
        <circle ref={ring} cx={26} cy={26} r={24} className="lab-totop__bar" style={{ strokeDasharray: 150.8, strokeDashoffset: 150.8 }} />
      </svg>
      <span className="lab-totop__icon">
        <Icon name="arrow-up" size={18} />
      </span>
    </button>
  );
}
