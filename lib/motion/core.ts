/**
 * 모션 엔진 코어 — 디자인 시스템(Learning Lab) bundle.js 00-core 의 TypeScript 포팅.
 * 의존성 없음: WAAPI + rAF 스프링. 모든 시간·이징 값은 tokens.css 커스텀 프로퍼티에서 읽습니다.
 */

export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export function cx(...args: Array<string | false | null | undefined | 0>): string {
  return args.filter(Boolean).join(' ');
}
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mapRange = (v: number, a: number, b: number) => clamp((v - a) / (b - a), 0, 1);
export function mq(q: string): boolean {
  return isBrowser && !!window.matchMedia ? window.matchMedia(q).matches : false;
}

/* ---------- Motion tokens (single source: tokens.json → tokens.css custom properties) ---------- */
const DUR_FALLBACK: Record<string, number> = {
  'dur-instant': 100, 'dur-fast': 180, 'dur-base': 320, 'dur-slow': 560, 'dur-slower': 900, 'dur-cinematic': 1400,
  'stagger-tight': 40, 'stagger-base': 70, 'stagger-loose': 120, 'delay-hero': 200,
};
const EASE_FALLBACK: Record<string, string> = {
  'ease-standard': 'cubic-bezier(0.2, 0, 0, 1)', 'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
  'ease-in': 'cubic-bezier(0.5, 0, 0.75, 0)', 'ease-in-out': 'cubic-bezier(0.76, 0, 0.24, 1)', 'ease-linear': 'linear',
};
let tokCache: Record<string, number | string> = {};

export function cssVar(name: string): string {
  if (!isBrowser) return '';
  return getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim();
}
export type DurToken = keyof typeof DUR_FALLBACK | string;
export function dur(name: DurToken | number | undefined): number {
  if (typeof name === 'number') return name;
  if (!name) return 320;
  const cached = tokCache[name];
  if (typeof cached === 'number') return cached;
  const v = cssVar(name);
  const n = parseFloat(v);
  let out: number;
  if (!v || isNaN(n)) out = DUR_FALLBACK[name] ?? 320;
  else out = /ms$/.test(v) ? n : /s$/.test(v) ? n * 1000 : n;
  tokCache[name] = out;
  return out;
}
export function ease(name?: string): string {
  if (!name) name = 'ease-standard';
  if (!/^ease-/.test(name)) return name;
  const cached = tokCache[name];
  if (typeof cached === 'string') return cached;
  const v = cssVar(name) || EASE_FALLBACK[name] || 'ease';
  tokCache[name] = v;
  return v;
}

export interface SpringConfig { stiffness: number; damping: number; mass: number }
/** Spring presets — pointer-driven motion only. */
export const SPRINGS: Record<'snappy' | 'gentle' | 'magnetic' | 'tilt', SpringConfig> = {
  snappy: { stiffness: 420, damping: 34, mass: 1 },
  gentle: { stiffness: 170, damping: 26, mass: 1 },
  magnetic: { stiffness: 260, damping: 16, mass: 0.8 },
  tilt: { stiffness: 200, damping: 22, mass: 1 },
};

export interface AnimateOptions {
  duration?: DurToken | number;
  easing?: string;
  delay?: DurToken | number;
  fill?: FillMode;
  /** 감소된 모션에서도 반드시 재생 (예: 포커스 이동) */
  essential?: boolean;
}

export const motion = {
  reduced(): boolean {
    if (!isBrowser) return true;
    const d = document.documentElement.getAttribute('data-motion');
    if (d === 'reduced') return true;
    if (d === 'full') return false;
    return mq('(prefers-reduced-motion: reduce)');
  },
  finePointer(): boolean {
    return mq('(hover: hover) and (pointer: fine)');
  },
  dur,
  ease,
  springs: SPRINGS,
  refresh() {
    tokCache = {};
  },
  /** WAAPI 래퍼 — 토큰 이름을 해석하고 reduced motion 을 존중합니다.
   *  Reduced: opacity 만 (≤150ms) 유지하거나 즉시 끝 상태로 점프. */
  animate(el: Element | null, keyframes: Keyframe[], o: AnimateOptions = {}): Animation | null {
    if (!el || !(el as HTMLElement).animate) return null;
    const opts: KeyframeAnimationOptions = {
      duration: dur(o.duration || 'dur-base'),
      easing: ease(o.easing || 'ease-standard'),
      delay: typeof o.delay === 'string' ? dur(o.delay) : o.delay || 0,
      fill: o.fill || 'both',
    };
    let kf = keyframes;
    if (motion.reduced() && !o.essential) {
      const hasOpacity = kf.some((k) => k.opacity != null);
      if (hasOpacity) {
        kf = kf.map((k) => ({ opacity: k.opacity != null ? k.opacity : 1 }));
        opts.duration = Math.min(Number(opts.duration), 150);
        opts.delay = 0;
      } else {
        opts.duration = 0;
        opts.delay = 0;
      }
    }
    return (el as HTMLElement).animate(kf, opts);
  },
};

/* ---------- Spring integrator (semi-implicit Euler, rAF) ---------- */
export class Spring {
  x: number;
  v = 0;
  target: number;
  cfg: SpringConfig;
  onUpdate: (x: number) => void;
  private raf = 0;
  private last = 0;
  constructor(initial: number, cfg: SpringConfig | undefined, onUpdate: (x: number) => void) {
    this.x = initial;
    this.target = initial;
    this.cfg = cfg || SPRINGS.gentle;
    this.onUpdate = onUpdate;
  }
  private tick = (now: number) => {
    const dt = Math.min(0.064, (now - (this.last || now)) / 1000 || 0.016);
    this.last = now;
    const c = this.cfg;
    const steps = 4;
    const sdt = dt / steps;
    for (let i = 0; i < steps; i++) {
      const f = -c.stiffness * (this.x - this.target) - c.damping * this.v;
      this.v += (f / c.mass) * sdt;
      this.x += this.v * sdt;
    }
    if (Math.abs(this.v) < 0.005 && Math.abs(this.x - this.target) < 0.005) {
      this.x = this.target;
      this.v = 0;
      this.raf = 0;
      this.last = 0;
      this.onUpdate(this.x);
      return;
    }
    this.onUpdate(this.x);
    this.raf = requestAnimationFrame(this.tick);
  };
  set(t: number) {
    this.target = t;
    if (!this.raf) {
      this.last = 0;
      this.raf = requestAnimationFrame(this.tick);
    }
  }
  jump(t: number) {
    this.stop();
    this.x = this.target = t;
    this.v = 0;
    this.onUpdate(t);
  }
  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.last = 0;
  }
}

/* ---------- Scroll root helpers (실제 사이트에서는 window) ---------- */
export type ScrollRoot = HTMLElement | null;

export interface ViewportRect { top: number; height: number; bottom: number; width: number }
export function viewportRect(root: ScrollRoot): ViewportRect {
  if (root) {
    const r = root.getBoundingClientRect();
    return { top: r.top, height: root.clientHeight, bottom: r.top + root.clientHeight, width: root.clientWidth };
  }
  return { top: 0, height: window.innerHeight, bottom: window.innerHeight, width: window.innerWidth };
}
export function scrollTop(root: ScrollRoot): number {
  return root ? root.scrollTop : window.scrollY || document.documentElement.scrollTop || 0;
}
export function scrollMax(root: ScrollRoot): number {
  return root ? root.scrollHeight - root.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
}
export function scrollToY(root: ScrollRoot, y: number, smooth?: boolean) {
  const t: HTMLElement | Window = root || window;
  try {
    t.scrollTo({ top: y, behavior: smooth && !motion.reduced() ? 'smooth' : 'auto' });
  } catch {
    if (root) root.scrollTop = y;
    else window.scrollTo(0, y);
  }
}
/** scroll + resize 를 rAF 로 합쳐 fn 호출. 구독 즉시 1회 호출. */
export function subscribeScroll(root: ScrollRoot, fn: () => void): () => void {
  const target: HTMLElement | Window = root || window;
  let ticking = false;
  const on = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      fn();
    });
  };
  target.addEventListener('scroll', on, { passive: true });
  window.addEventListener('resize', on);
  on();
  return () => {
    target.removeEventListener('scroll', on);
    window.removeEventListener('resize', on);
  };
}

/** 포인터 진입 모서리: 'top' | 'right' | 'bottom' | 'left' */
export type Edge = 'top' | 'right' | 'bottom' | 'left';
export function edgeOf(e: { clientX: number; clientY: number }, el: Element): Edge {
  const r = el.getBoundingClientRect();
  const w = r.width;
  const hh = r.height;
  const x = (e.clientX - r.left - w / 2) * (w > hh ? hh / w : 1);
  const y = (e.clientY - r.top - hh / 2) * (hh > w ? w / hh : 1);
  const d = Math.round((Math.atan2(y, x) * (180 / Math.PI) + 180) / 90 + 3) % 4;
  return (['top', 'right', 'bottom', 'left'] as Edge[])[d];
}
export const EDGE_T: Record<Edge, string> = {
  top: 'translate3d(0,-101%,0)',
  right: 'translate3d(101%,0,0)',
  bottom: 'translate3d(0,101%,0)',
  left: 'translate3d(-101%,0,0)',
};

/** FLIP: `toEl` 을 `fromRect` 의 박스에서 현재 위치로 이동 (공유 요소 전환). */
export function flipFrom(fromRect: DOMRect | null, toEl: HTMLElement | null, o: { duration?: DurToken; easing?: string } = {}) {
  if (!fromRect || !toEl) return null;
  const to = toEl.getBoundingClientRect();
  if (!to.width || !to.height) return null;
  const dx = fromRect.left - to.left;
  const dy = fromRect.top - to.top;
  const sx = fromRect.width / to.width;
  const sy = fromRect.height / to.height;
  toEl.style.transformOrigin = '0 0';
  return motion.animate(
    toEl,
    [{ transform: `translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})` }, { transform: 'translate3d(0,0,0) scale(1,1)' }],
    { duration: o.duration || 'dur-slower', easing: o.easing || 'ease-in-out' },
  );
}

/* ---------- Reveal presets (각각 역할이 있음; 하나의 fade 로 통일하지 않음) ---------- */
export type RevealVariant = 'lines' | 'words' | 'rise' | 'stagger' | 'clip' | 'rule' | 'fade';
export interface RevealPreset { selector: string | null; kf: Keyframe[]; duration: string; easing: string; stagger: string }
export const REVEALS: Record<RevealVariant, RevealPreset> = {
  /* 마스크 밖으로 올라오는 텍스트 줄 — 제목 */
  lines: { selector: '.lab-line-inner', kf: [{ transform: 'translate3d(0,120%,0)' }, { transform: 'translate3d(0,0,0)' }], duration: 'dur-slow', easing: 'ease-out', stagger: 'stagger-base' },
  /* 단어 단위 — 긴 문장 */
  words: { selector: '.lab-line-inner', kf: [{ transform: 'translate3d(0,120%,0)' }, { transform: 'translate3d(0,0,0)' }], duration: 'dur-slow', easing: 'ease-out', stagger: 'stagger-tight' },
  /* 블록 상승 — 카드, 리스트 행 */
  rise: { selector: null, kf: [{ opacity: 0, transform: 'translate3d(0,40px,0)' }, { opacity: 1, transform: 'translate3d(0,0,0)' }], duration: 'dur-slower', easing: 'ease-out', stagger: 'stagger-loose' },
  /* 리스트 자식 연쇄 상승 */
  stagger: { selector: ':scope > *', kf: [{ opacity: 0, transform: 'translate3d(0,24px,0)' }, { opacity: 1, transform: 'translate3d(0,0,0)' }], duration: 'dur-slow', easing: 'ease-out', stagger: 'stagger-base' },
  /* 아래 모서리부터 이미지 클립 — 미디어 */
  clip: { selector: null, kf: [{ clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }], duration: 'dur-slower', easing: 'ease-in-out', stagger: 'stagger-loose' },
  /* 왼→오 hairline 드로잉 — 섹션 rule, 타임라인 */
  rule: { selector: null, kf: [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], duration: 'dur-slower', easing: 'ease-in-out', stagger: 'stagger-base' },
  fade: { selector: null, kf: [{ opacity: 0 }, { opacity: 1 }], duration: 'dur-slow', easing: 'ease-standard', stagger: 'stagger-base' },
};

export const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
