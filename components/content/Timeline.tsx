'use client';
/**
 * Timeline — 스크롤에 따라 선이 채워지고, 선이 닿는 이정표가 켜짐. 연도별로 여러 항목을 묶어 표시.
 */
import { useRef } from 'react';
import { clamp, cx, motion } from '@/lib/motion/core';
import { useScrollLink } from '@/lib/motion/hooks';

export interface TimelineEntry {
  label?: string;
  title: string;
  text?: string;
}
export interface TimelineGroup {
  year: string;
  entries: TimelineEntry[];
}

export function Timeline({ groups, className }: { groups: TimelineGroup[]; className?: string }) {
  const ref = useRef<HTMLOListElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  useScrollLink(ref, (pr, info) => {
    const el = ref.current;
    if (!el) return;
    const mid = info.vp.top + info.vp.height * 0.6;
    let prog = clamp((mid - info.rect.top) / info.rect.height, 0, 1);
    if (motion.reduced()) prog = 1;
    if (fill.current) fill.current.style.transform = `scaleY(${prog.toFixed(4)})`;
    el.querySelectorAll<HTMLElement>('.lab-tl__item').forEach((li) => {
      const r = li.getBoundingClientRect();
      li.classList.toggle('is-on', motion.reduced() || r.top + 24 < mid);
    });
  });
  return (
    <ol ref={ref} className={cx('lab-tl', className)} role="list">
      <span className="lab-tl__line" aria-hidden="true">
        <span ref={fill} className="lab-tl__fill" />
      </span>
      {groups.map((g) => (
        <li key={g.year} className="lab-tl__item">
          <span className="lab-tl__dot" aria-hidden="true" />
          <span className="lab-tl__year lab-t-h2">{g.year}</span>
          <div className="lab-tl__body">
            {g.entries.map((e, i) => (
              <div key={i} className="lab-tl__entry">
                {e.label ? <span className="lab-t-label lab-tl__label">{e.label}</span> : null}
                <h3 className="lab-t-h5">{e.title}</h3>
                {e.text ? <p className="lab-t-body">{e.text}</p> : null}
              </div>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
