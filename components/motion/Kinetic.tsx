'use client';
/**
 * 작은 모션 컴포넌트 모음: NumberRoll(오도미터), ScrollText(스크롤 잉크), Marquee(키워드 밴드), FullBleed(섹션 확장)
 */
import { createElement, useEffect, useRef, type ElementType, type ReactNode } from 'react';
import { clamp, cx, lerp, mapRange, motion, scrollTop } from '@/lib/motion/core';
import { useScrollLink } from '@/lib/motion/hooks';

/* NumberRoll — 각 자리 숫자 컬럼이 해당 숫자로 미끄러짐 */
export function NumberRoll({ value, label, className }: { value: string | number; label?: string; className?: string }) {
  const str = String(value);
  return (
    <span className={cx('lab-roller', className)} aria-label={label || str} role="text">
      {str.split('').map((ch, i) => {
        if (!/[0-9]/.test(ch))
          return (
            <span key={i + ch} className="lab-roller__sep" aria-hidden="true">
              {ch}
            </span>
          );
        const d = parseInt(ch, 10);
        return (
          <span key={i} className="lab-roller__col" aria-hidden="true">
            <span className="lab-roller__strip" style={{ transform: `translate3d(0,${-d * 10}%,0)`, transitionDelay: `${i * 40}ms` }}>
              {'0123456789'.split('').map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/* ScrollText — 뷰포트를 지나는 동안 단어가 text-decorative → text-primary 로 잉크됨 (24px 이상 전용) */
export function ScrollText({ text, as, className }: { text: string; as?: ElementType; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const words = useRef<(HTMLElement | null)[]>([]);
  const last = useRef(-1);
  const parts = String(text).split(' ');
  useScrollLink(ref, (pr, info) => {
    const n = words.current.length;
    if (!n) return;
    const prog = motion.reduced() ? 1 : mapRange(info.center, 0.9, 0.3);
    const k = Math.round(prog * n);
    if (k === last.current) return;
    last.current = k;
    for (let i = 0; i < n; i++) words.current[i]?.classList.toggle('is-on', i < k);
  });
  return createElement(
    as || 'p',
    { ref, className: cx('lab-scrolltext', className), 'aria-label': text },
    parts.map((w, i) => (
      <span key={i}>
        <span
          aria-hidden="true"
          ref={(el) => {
            words.current[i] = el;
          }}
          className="lab-scrolltext__w"
        >
          {w}
        </span>
        {i < parts.length - 1 ? ' ' : null}
      </span>
    )),
  );
}

/* Marquee — 키워드 밴드; 스크롤 속도에 따라 빨라지고 방향이 바뀜. 포인터 위에서 정지. reduced: 정적 줄바꿈 */
export function Marquee({ items, speed, onBrand, className }: { items: string[]; speed?: number; onBrand?: boolean; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = track.current;
    if (!el || motion.reduced()) return;
    let x = 0;
    let v = 0;
    let dir = -1;
    let lastT = scrollTop(null);
    let raf = 0;
    let prev = performance.now();
    const base = speed || 40;
    let paused = false;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const st = scrollTop(null);
      const dv = st - lastT;
      lastT = st;
      if (dv) dir = dv > 0 ? -1 : 1;
      v = lerp(v, Math.abs(dv) * 6, 0.08);
      if (!paused) x += dir * (base + v) * dt;
      const w = el.scrollWidth / 2;
      if (w > 0) {
        if (x <= -w) x += w;
        if (x > 0) x -= w;
      }
      el.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    const enter = () => (paused = true);
    const leave = () => (paused = false);
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointerleave', leave);
    };
  }, [speed]);
  const mk = (dup: boolean) =>
    items.map((t, i) => (
      <span key={(dup ? 'd' : 'o') + i} className={cx('lab-marquee__item', dup && 'is-dup')}>
        <span>{t}</span>
        <span className="lab-marquee__sep">/</span>
      </span>
    ));
  return (
    <div className={cx('lab-marquee', onBrand && 'lab-marquee--on-brand', className)}>
      <ul className="lab-sr-only">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
      <div ref={track} className="lab-marquee__track" aria-hidden="true">
        {mk(false)}
        {mk(true)}
      </div>
    </div>
  );
}

/* FullBleed — 브랜드/딥 섹션이 진입하면서 콘텐츠 폭에서 뷰포트 전체 폭으로 열림 */
export function FullBleed({ tone, className, id, labelledBy, children }: { tone?: 'brand' | 'deep'; className?: string; id?: string; labelledBy?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const bg = useRef<HTMLDivElement>(null);
  useScrollLink(ref, (pr, info) => {
    const b = bg.current;
    if (!b) return;
    if (motion.reduced()) {
      b.style.clipPath = 'none';
      return;
    }
    const e = mapRange(info.enter, 0.05, 0.55);
    const m = info.vp.width < 768 ? 16 : 48;
    const ins = `${((1 - e) * m).toFixed(1)}px`;
    const top = `${((1 - e) * 64).toFixed(1)}px`;
    b.style.clipPath = `inset(${top} ${ins} 0px ${ins})`;
  });
  return (
    <section ref={ref} className={cx('lab-full', `lab-full--${tone || 'brand'}`, className)} id={id} aria-labelledby={labelledBy}>
      <div ref={bg} className="lab-full__bg" aria-hidden="true" />
      <div className="lab-full__in">{children}</div>
    </section>
  );
}

export { clamp };
