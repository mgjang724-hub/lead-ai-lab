'use client';
/**
 * 페이지 전환 커튼 — 디자인 시스템 TransitionProvider 를 Next.js App Router 에 맞게 적용.
 * go(href, label): 커튼이 아래에서 올라와 화면을 덮음(exit) → router.push → 새 경로가 그려지면 커튼이 위로 떠남(enter).
 * reduced motion: 120ms 페이드만. 경로 변경이 1.6초 안에 끝나지 않으면 커튼을 거둠(안전장치).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { dur, ease, motion, scrollToY } from '@/lib/motion/core';
import { brand } from '@/content/brand';

interface TransitionCtxValue {
  go: (href: string, label?: string) => void;
  busy: boolean;
}
const TransitionCtx = createContext<TransitionCtxValue>({ go: () => {}, busy: false });
export function usePageTransition() {
  return useContext(TransitionCtx);
}

const COVER = 0.44; /* dur-cinematic 비율 */

export function TransitionProvider({ children, mainId = 'lab-main' }: { children: ReactNode; mainId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const curtain = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLSpanElement>(null);
  const busy = useRef(false);
  const pending = useRef<{ href: string; covered: boolean; timer: number } | null>(null);
  const [label, setLabel] = useState('');
  const [isBusy, setBusy] = useState(false);

  const reveal = useCallback(() => {
    const c = curtain.current;
    const main = document.getElementById(mainId);
    const done = () => {
      busy.current = false;
      setBusy(false);
      pending.current = null;
    };
    if (!c || motion.reduced() || !c.animate) {
      if (c) c.style.visibility = 'hidden';
      if (main?.animate) main.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: 'both' });
      done();
      return;
    }
    const D = Math.round(dur('dur-cinematic') * COVER);
    const EIO = ease('ease-in-out');
    scrollToY(null, 0, false);
    if (main) main.getAnimations().forEach((a) => a.cancel());
    const a2 = c.animate([{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(0,-100%,0)' }], { duration: D, easing: EIO, fill: 'both' });
    title.current?.animate([{ transform: 'translate3d(0,0,0)', opacity: 1 }, { transform: 'translate3d(0,-60%,0)', opacity: 0 }], { duration: D * 0.7, easing: ease('ease-in'), fill: 'both' });
    if (main) main.animate([{ transform: 'translate3d(0,96px,0)' }, { transform: 'translate3d(0,0,0)' }], { duration: dur('dur-slower'), easing: ease('ease-out') });
    a2.onfinish = () => {
      c.style.visibility = 'hidden';
      done();
    };
  }, [mainId]);

  /* 새 경로가 렌더되면 커튼을 거둠 */
  useEffect(() => {
    const p = pending.current;
    if (!p) return;
    if (p.covered) {
      window.clearTimeout(p.timer);
      setTimeout(reveal, Math.round(dur('dur-cinematic') * 0.12));
    } else {
      /* 커버 애니메이션이 끝나기 전에 경로가 바뀐 경우: 커버 완료 핸들러가 reveal */
      p.href = '';
    }
  }, [pathname, reveal]);

  const go = useCallback(
    (href: string, lbl?: string) => {
      if (busy.current) return;
      busy.current = true;
      setBusy(true);
      const c = curtain.current;
      const main = document.getElementById(mainId);
      const target = href.split('#')[0] || '/';
      const samePath = target === pathname;
      const navigate = () => router.push(href);
      /* 경로 변경 감지 실패 대비: 1.6초 뒤 강제 reveal */
      const arm = () => window.setTimeout(reveal, 1600);

      if (motion.reduced() || !c || !c.animate) {
        const fo = main?.animate ? main.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'both' }) : null;
        const after = () => {
          if (samePath) {
            scrollToY(null, 0, false);
            reveal();
            return;
          }
          pending.current = { href, covered: true, timer: arm() };
          navigate();
        };
        if (fo) fo.onfinish = after;
        else after();
        return;
      }
      setLabel(lbl || '');
      const D = Math.round(dur('dur-cinematic') * COVER);
      const EIO = ease('ease-in-out');
      c.style.visibility = 'visible';
      pending.current = { href, covered: false, timer: 0 };
      const a1 = c.animate([{ transform: 'translate3d(0,100%,0)' }, { transform: 'translate3d(0,0,0)' }], { duration: D, easing: EIO, fill: 'both' });
      title.current?.animate([{ transform: 'translate3d(0,110%,0)' }, { transform: 'translate3d(0,0,0)' }], { duration: D, easing: ease('ease-out'), delay: D * 0.45, fill: 'both' });
      if (main) main.animate([{ transform: 'translate3d(0,0,0)', opacity: 1 }, { transform: 'translate3d(0,-64px,0)', opacity: 0.3 }], { duration: D, easing: ease('ease-in'), fill: 'forwards' });
      /* 커버 중에 라우트를 미리 요청해 둠 (커튼 뒤에서 교체) */
      if (!samePath) navigate();
      a1.onfinish = () => {
        const p = pending.current;
        if (!p) return;
        p.covered = true;
        if (samePath || p.href === '') {
          /* 같은 경로이거나 이미 경로가 바뀐 경우 → 잠시 멈춘 뒤 reveal */
          setTimeout(reveal, Math.round(dur('dur-cinematic') * 0.12));
        } else {
          p.timer = arm();
        }
      };
    },
    [mainId, pathname, reveal, router],
  );

  const value = useMemo(() => ({ go, busy: isBusy }), [go, isBusy]);
  return (
    <TransitionCtx.Provider value={value}>
      {children}
      <div ref={curtain} className="lab-curtain" aria-hidden="true">
        <div className="lab-curtain__inner">
          <span className="lab-curtain__eyebrow">{brand.wordmark}</span>
          <span className="lab-curtain__mask">
            <span ref={title} className="lab-curtain__title">
              {label}
            </span>
          </span>
        </div>
      </div>
      <div className="lab-sr-only" aria-live="polite">
        {label ? `${label} 페이지` : ''}
      </div>
    </TransitionCtx.Provider>
  );
}

/** 내부 링크인지 (같은 사이트, 해시만 바뀌는 링크 제외) */
export function isInternalHref(href: string | undefined): href is string {
  return !!href && href.startsWith('/') && !href.startsWith('//');
}

/** 커튼 전환으로 이동해야 하는 클릭인지 판단 (수정키·새 탭·해시 전용 제외) */
export function shouldTransition(e: React.MouseEvent, href: string | undefined, pathname: string | null): href is string {
  if (!isInternalHref(href)) return false;
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const [path, hash] = href.split('#');
  if (hash !== undefined && (path === '' || path === pathname)) return false; /* 같은 페이지 내 앵커 */
  return true;
}
