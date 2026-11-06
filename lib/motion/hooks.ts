'use client';
/**
 * 모션 훅 — 디자인 시스템 00-core 의 훅 포팅 (SSR/hydration 안전 버전).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject, type Ref } from 'react';
import {
  EDGE_T,
  FOCUSABLE,
  REVEALS,
  SPRINGS,
  Spring,
  clamp,
  dur,
  ease,
  edgeOf,
  isBrowser,
  motion,
  mq,
  subscribeScroll,
  viewportRect,
  type DurToken,
  type RevealVariant,
  type ScrollRoot,
} from './core';

export const useIso = isBrowser ? useLayoutEffect : useEffect;

/** 실제 사이트의 스크롤 루트는 window — 항상 null. (디자인 시스템 API 호환용) */
export function useScrollRoot(): ScrollRoot {
  return null;
}

type AnyRef<T> = RefObject<T | null>;

export function assignRef<T>(ref: Ref<T> | undefined, v: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') ref(v);
  else (ref as { current: T | null }).current = v;
}
export function useMergedRef<T>(a: Ref<T> | undefined, b: Ref<T> | undefined) {
  return useCallback(
    (v: T | null) => {
      assignRef(a, v);
      assignRef(b, v);
    },
    [a, b],
  );
}

export interface ScrollLinkInfo {
  rect: DOMRect;
  vp: ReturnType<typeof viewportRect>;
  /** 요소 중심의 뷰포트 상대 위치 (0 위 → 1 아래) */
  center: number;
  /** 요소 상단이 뷰포트 하단→상단으로 이동하는 동안 0→1 */
  enter: number;
  /** sticky 용: 상단이 상단에 닿을 때 0, 하단이 하단에 닿을 때 1 */
  through: number;
  root: ScrollRoot;
}
/** useScrollLink(ref, fn): 스크롤이 바뀌는 프레임마다 fn(progress, info).
 *  progress 0 = 요소 상단이 뷰포트 하단 · 1 = 요소 하단이 뷰포트 상단 */
export function useScrollLink(ref: AnyRef<HTMLElement>, fn: (p: number, info: ScrollLinkInfo) => void, deps: unknown[] = []) {
  const root = useScrollRoot();
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return subscribeScroll(root, () => {
      const r = el.getBoundingClientRect();
      const vp = viewportRect(root);
      const p = clamp((vp.bottom - r.top) / (vp.height + r.height), 0, 1);
      const center = (r.top + r.height / 2 - vp.top) / vp.height;
      const enter = clamp((vp.bottom - r.top) / vp.height, 0, 1);
      const through = clamp((vp.top - r.top) / Math.max(1, r.height - vp.height), 0, 1);
      fnRef.current(p, { rect: r, vp, center, enter, through, root });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, ...deps]);
}

/** useInView(ref, {once, rootMargin, threshold}) → boolean */
export function useInView(ref: AnyRef<Element>, o: { once?: boolean; rootMargin?: string; threshold?: number } = {}) {
  const [v, set] = useState(false);
  const { once, rootMargin, threshold } = o;
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.IntersectionObserver) {
      set(true);
      return;
    }
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            set(true);
            if (once !== false) io.disconnect();
          } else if (once === false) set(false);
        });
      },
      { threshold: threshold || 0, rootMargin: rootMargin || '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, once, rootMargin, threshold]);
  return v;
}

export interface RevealOptions {
  variant?: RevealVariant;
  trigger?: 'view' | 'mount' | 'manual';
  delay?: DurToken | number;
  stagger?: DurToken | number;
  duration?: DurToken | number;
  easing?: string;
  rootMargin?: string;
  replay?: unknown;
}
type PlayableEl = HTMLElement & { __labPlay?: () => void };

/**
 * useReveal(ref, {variant, trigger, delay}) — 일시정지된 애니메이션을 준비하고 트리거 시 재생.
 * SSR: 요소에 data-reveal 을 두면 CSS 가 hydration 전까지 숨기고, 이 훅이 data-reveal-ready 를 켭니다
 * (서버 HTML 이 먼저 보이다가 사라지는 깜빡임 방지). JS 가 실패해도 2.5초 뒤 CSS 가 다시 보여줍니다.
 */
export function useReveal(ref: AnyRef<HTMLElement>, o: RevealOptions = {}) {
  const root = useScrollRoot();
  const variant = o.variant || 'rise';
  const trigger = o.trigger || 'view';
  const { delay, stagger, duration, easing, rootMargin, replay } = o;
  useIso(() => {
    const el = ref.current as PlayableEl | null;
    if (!el) return;
    const ready = () => el.setAttribute('data-reveal-ready', '');
    if (!el.animate || motion.reduced()) {
      ready();
      return;
    }
    const preset = REVEALS[variant] || REVEALS.rise;
    const targets: HTMLElement[] = preset.selector ? Array.from(el.querySelectorAll<HTMLElement>(preset.selector)) : [el];
    if (!targets.length) {
      ready();
      return;
    }
    const st = stagger != null ? dur(stagger) : dur(preset.stagger);
    const dl = typeof delay === 'string' ? dur(delay) : delay || 0;
    const anims = targets.map((t, i) => {
      const a = t.animate(preset.kf, {
        duration: dur(duration || preset.duration),
        easing: ease(easing || preset.easing),
        delay: dl + i * st,
        fill: 'both',
      });
      a.pause();
      a.currentTime = 0;
      a.onfinish = () => {
        try {
          a.cancel();
        } catch {}
      };
      return a;
    });
    ready();
    const play = () => anims.forEach((a) => a.play());
    let io: IntersectionObserver | null = null;
    if (trigger === 'mount') requestAnimationFrame(play);
    else if (trigger === 'view') {
      if (!window.IntersectionObserver) play();
      else {
        io = new IntersectionObserver(
          (es) => {
            es.forEach((e) => {
              if (e.isIntersecting) {
                play();
                io?.disconnect();
              }
            });
          },
          { root, threshold: 0, rootMargin: rootMargin || '0px 0px -12% 0px' },
        );
        io.observe(el);
      }
    }
    el.__labPlay = play;
    return () => {
      io?.disconnect();
      anims.forEach((a) => {
        try {
          a.finish();
          a.cancel();
        } catch {}
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, variant, trigger, replay]);
}

/* ---------- Pointer hooks ---------- */

/** 요소(와 .lab-magnetic__inner)가 포인터 쪽으로 기울어짐. fine pointer 전용. */
export function useMagnetic(ref: AnyRef<HTMLElement>, o: { strength?: number; disabled?: boolean } = {}) {
  const strength = o.strength ?? 0.32;
  const disabled = !!o.disabled;
  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;
    if (!motion.finePointer() || motion.reduced()) return;
    const inner = el.querySelector<HTMLElement>('.lab-magnetic__inner');
    let x = 0;
    let y = 0;
    const paint = () => {
      el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
      if (inner) inner.style.transform = `translate3d(${(x * 0.45).toFixed(2)}px,${(y * 0.45).toFixed(2)}px,0)`;
    };
    const sx = new Spring(0, SPRINGS.magnetic, (v) => {
      x = v;
      paint();
    });
    const sy = new Spring(0, SPRINGS.magnetic, (v) => {
      y = v;
      paint();
    });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      sx.set((e.clientX - (r.left + r.width / 2)) * strength);
      sy.set((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => {
      sx.set(0);
      sy.set(0);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      sx.stop();
      sy.stop();
      el.style.transform = '';
      if (inner) inner.style.transform = '';
    };
  }, [ref, disabled, strength]);
}

/** 3D 틸트 — 내부 [data-tilt-depth] 레이어가 반대로 이동. */
export function useTilt(ref: AnyRef<HTMLElement>, o: { max?: number } = {}) {
  const max = o.max || 5;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!motion.finePointer() || motion.reduced()) return;
    const layers = Array.from(el.querySelectorAll<HTMLElement>('[data-tilt-depth]'));
    let rx = 0;
    let ry = 0;
    const paint = () => {
      el.style.transform = `perspective(1200px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;
      layers.forEach((l) => {
        const d = parseFloat(l.getAttribute('data-tilt-depth') || '1') || 1;
        l.style.transform = `translate3d(${(-ry * d * 2).toFixed(2)}px,${(rx * d * 2).toFixed(2)}px,0) scale(${1 + 0.04 * d})`;
      });
    };
    const sx = new Spring(0, SPRINGS.tilt, (v) => {
      rx = v;
      paint();
    });
    const sy = new Spring(0, SPRINGS.tilt, (v) => {
      ry = v;
      paint();
    });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      sx.set(-py * max * 2);
      sy.set(px * max * 2);
    };
    const leave = () => {
      sx.set(0);
      sy.set(0);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      sx.stop();
      sy.stop();
      el.style.transform = '';
      layers.forEach((l) => (l.style.transform = ''));
    };
  }, [ref, max]);
}

/** 패널이 포인터가 들어온 모서리에서 미끄러져 들어오고 나가는 모서리로 떠남. */
export function useDirectionalHover(hostRef: AnyRef<HTMLElement>, panelRef: AnyRef<HTMLElement>) {
  useEffect(() => {
    const host = hostRef.current;
    const panel = panelRef.current;
    if (!host || !panel) return;
    if (!motion.finePointer()) return;
    const D = dur('dur-slow') * 0.8;
    const E = ease('ease-out');
    const enter = (e: PointerEvent) => {
      const edge = edgeOf(e, host);
      if (motion.reduced()) {
        panel.style.transition = 'opacity 150ms linear';
        panel.style.transform = 'none';
        panel.style.opacity = '1';
        return;
      }
      panel.style.transition = 'none';
      panel.style.opacity = '1';
      panel.style.transform = EDGE_T[edge];
      void panel.offsetWidth;
      panel.style.transition = `transform ${D}ms ${E}`;
      panel.style.transform = 'translate3d(0,0,0)';
    };
    const leave = (e: PointerEvent) => {
      if (motion.reduced()) {
        panel.style.opacity = '0';
        return;
      }
      panel.style.transition = `transform ${D}ms ${E}`;
      panel.style.transform = EDGE_T[edgeOf(e, host)];
    };
    host.addEventListener('pointerenter', enter);
    host.addEventListener('pointerleave', leave);
    return () => {
      host.removeEventListener('pointerenter', enter);
      host.removeEventListener('pointerleave', leave);
    };
  }, [hostRef, panelRef]);
}

/** 포인터 진입/이탈 지점을 --wx/--wy 로 기록 — 원형 wipe 가 그 지점에서 자람. */
export function useWipe(ref: AnyRef<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--wx', `${e.clientX - r.left}px`);
      el.style.setProperty('--wy', `${e.clientY - r.top}px`);
    };
    el.addEventListener('pointerenter', set);
    el.addEventListener('pointerleave', set);
    return () => {
      el.removeEventListener('pointerenter', set);
      el.removeEventListener('pointerleave', set);
    };
  }, [ref]);
}

/** --mx/--my 가 포인터를 따라감 (CSS 가 하이라이트를 그림). */
export function useSpotlight(ref: AnyRef<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !motion.finePointer()) return;
    let raf = 0;
    let ex = 0;
    let ey = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ex = e.clientX - r.left;
      ey = e.clientY - r.top;
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          el.style.setProperty('--mx', `${ex}px`);
          el.style.setProperty('--my', `${ey}px`);
        });
    };
    el.addEventListener('pointermove', move);
    return () => {
      el.removeEventListener('pointermove', move);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
}

/** 오버레이용 포커스 트랩 */
export function useFocusTrap(ref: AnyRef<HTMLElement>, active: boolean, onEscape?: () => void) {
  const escRef = useRef(onEscape);
  escRef.current = onEscape;
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      const f = el.querySelector<HTMLElement>('[data-autofocus]') || el.querySelector<HTMLElement>(FOCUSABLE);
      f?.focus({ preventScroll: true });
    }, 30);
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        escRef.current?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const list = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null || n === document.activeElement);
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    el.addEventListener('keydown', key);
    return () => {
      clearTimeout(t);
      el.removeEventListener('keydown', key);
      prev?.focus?.({ preventScroll: true });
    };
  }, [ref, active]);
}

/** matchMedia → boolean. 서버/첫 렌더는 false (hydration 일치), 마운트 후 실제 값. */
export function useMedia(q: string): boolean {
  const [v, set] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return;
    const m = window.matchMedia(q);
    const f = () => set(m.matches);
    f();
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, [q]);
  return v;
}

/** <html> 의 속성(data-motion / data-theme) 변화를 추적해 리렌더 */
export function useHtmlAttr(name: string): string | null {
  const [v, set] = useState<string | null>(null);
  useEffect(() => {
    set(document.documentElement.getAttribute(name));
    const mo = new MutationObserver(() => {
      motion.refresh();
      set(document.documentElement.getAttribute(name));
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: [name] });
    return () => mo.disconnect();
  }, [name]);
  return v;
}

/** 마운트 후 true — 클라이언트 전용 UI 분기용 */
export function useMounted(): boolean {
  const [m, set] = useState(false);
  useEffect(() => set(true), []);
  return m;
}

export { mq };
