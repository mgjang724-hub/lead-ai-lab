'use client';
import { createElement, forwardRef, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { cx, type DurToken, type RevealVariant } from '@/lib/motion/core';
import { useMergedRef, useReveal } from '@/lib/motion/hooks';

export interface RevealProps {
  variant?: RevealVariant;
  trigger?: 'view' | 'mount' | 'manual';
  delay?: DurToken | number;
  stagger?: DurToken | number;
  replay?: unknown;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  id?: string;
  children?: ReactNode;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

/* <Reveal variant="rise|stagger|clip|rule|fade" as="div"> — 뷰포트 진입 시 재생 */
export const Reveal = forwardRef<HTMLElement, RevealProps>(function Reveal(p, fref) {
  const ref = useRef<HTMLElement>(null);
  const mref = useMergedRef<HTMLElement>(ref, fref);
  useReveal(ref, { variant: p.variant, delay: p.delay, trigger: p.trigger, stagger: p.stagger, replay: p.replay });
  return createElement(
    p.as || 'div',
    {
      ref: mref,
      className: cx('lab-reveal', p.className),
      style: p.style,
      id: p.id,
      role: p.role,
      'aria-label': p['aria-label'],
      'aria-labelledby': p['aria-labelledby'],
      'data-reveal': '',
    },
    p.children,
  );
});

export interface SplitTextProps {
  as?: ElementType;
  lines?: string[];
  text?: string;
  by?: 'line' | 'word';
  /** 줄 단위 모드에서 보이는 사본을 줄별로 바꿀 때 (예: 워드마크 'AI' 강조). 스크린리더용 평문은 lines 그대로 유지. 서버 컴포넌트에서도 넘길 수 있도록 함수가 아닌 노드 배열 */
  lineNodes?: ReactNode[];
  trigger?: 'view' | 'mount' | 'manual';
  delay?: DurToken | number;
  stagger?: DurToken | number;
  duration?: DurToken | number;
  replay?: unknown;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

/* <SplitText as="h1" lines={[..]} by="line|word"> — 스크린리더는 평문을, 애니메이션 사본은 aria-hidden */
export function SplitText(p: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const lines = p.lines || [p.text || ''];
  const by = p.by || 'line';
  useReveal(ref, { variant: by === 'word' ? 'words' : 'lines', delay: p.delay, trigger: p.trigger, stagger: p.stagger, replay: p.replay, duration: p.duration });
  const vis = lines.map((ln, i) => {
    if (by === 'word') {
      const words = String(ln).split(' ');
      return (
        <span key={i} className="lab-line lab-line--words">
          {words.map((w, j) => (
            <span key={j}>
              <span className="lab-word">
                <span className="lab-line-inner">{w}</span>
              </span>
              {j < words.length - 1 ? ' ' : null}
            </span>
          ))}
        </span>
      );
    }
    return (
      <span key={i} className="lab-line">
        <span className="lab-line-inner">{p.lineNodes?.[i] ?? ln}</span>
      </span>
    );
  });
  return createElement(
    p.as || 'span',
    { ref, className: cx('lab-split', p.className), style: p.style, id: p.id, 'data-reveal': '' },
    <span className="lab-sr-only">{lines.join(' ')}</span>,
    <span aria-hidden="true" className="lab-split__vis">
      {vis}
    </span>,
  );
}
