'use client';
/**
 * SubNav — 페이지 내 섹션 앵커의 sticky 보조 내비게이션. 현재 섹션을 IntersectionObserver 로 추적.
 */
import { useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/motion/core';

export interface SubNavItem {
  href: string;
  label: string;
  ko?: string;
}

export function SubNav({ items, className }: { items: SubNavItem[]; className?: string }) {
  const [cur, setCur] = useState<string>('');
  const ind = useRef<HTMLSpanElement>(null);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const ids = items.map((i) => i.href.replace('#', ''));
    const els = ids.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    if (!els.length || !window.IntersectionObserver) return;
    const io = new IntersectionObserver(
      (es) => {
        const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setCur(vis[0].target.id);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);
  useEffect(() => {
    const n = nav.current;
    const b = ind.current;
    const el = cur ? n?.querySelector<HTMLElement>(`[href="#${cur}"]`) : null;
    if (!n || !b) return;
    if (!el) {
      b.style.opacity = '0';
      return;
    }
    const nr = n.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    b.style.opacity = '1';
    b.style.width = `${r.width}px`;
    b.style.transform = `translate3d(${r.left - nr.left + n.scrollLeft}px,0,0)`;
  }, [cur]);
  return (
    <nav ref={nav} className={cx('lab-subnav', className)} aria-label="페이지 내 이동">
      <ul className="lab-subnav__list" role="list">
        {items.map((it) => (
          <li key={it.href}>
            <a href={it.href} className={cx('lab-subnav__link', cur === it.href.slice(1) && 'is-on')} aria-current={cur === it.href.slice(1) ? 'location' : undefined}>
              <span>{it.label}</span>
              {it.ko ? <span className="lab-subnav__ko">{it.ko}</span> : null}
            </a>
          </li>
        ))}
      </ul>
      <span ref={ind} className="lab-subnav__ind" aria-hidden="true" />
    </nav>
  );
}
