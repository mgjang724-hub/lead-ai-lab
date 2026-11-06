'use client';
/**
 * BookGrid — 저역서를 표지 카드로 나열 (/books).
 * 표지 이미지는 publications.json 의 cover 가 확인된 책만 싣고, 없으면 MediaFrame 의 중립 placeholder 를 보여 줍니다.
 * 원문에 ISBN·링크가 없어 카드는 클릭 대상이 아니며 제목·출판사·출간일을 표시합니다. 저자·역자(authors)는 확인된 책에만 있으므로 값이 있을 때만 한 줄 더 보여 줍니다.
 */
import { useRef } from 'react';
import type { Publication } from '@/content/types';
import { areaById } from '@/content/research-areas';
import { cx } from '@/lib/motion/core';
import { useReveal } from '@/lib/motion/hooks';
import { MediaFrame } from '@/components/motion/MediaFrame';

export function BookGrid({ items, className }: { items: Publication[]; className?: string }) {
  const ref = useRef<HTMLOListElement>(null);
  useReveal(ref, { variant: 'stagger', stagger: 'stagger-loose', duration: 'dur-slow' });
  if (!items.length) return <p className="lab-t-body">등재된 저역서가 없습니다.</p>;
  return (
    <ol ref={ref} className={cx('lab-books', className)} role="list" data-reveal="">
      {items.map((b, i) => {
        const areas = b.areas.map((id) => areaById[id]?.title).filter(Boolean);
        return (
          <li key={b.id} className="lab-book">
            <MediaFrame
              ratio="3/4"
              tone="gray"
              src={b.cover ?? null}
              alt={b.cover ? (b.coverAlt ?? `${b.title} 표지`) : ''}
              label="표지 준비 중"
              reveal="none"
              className="lab-book__cover"
              sizes="(min-width: 768px) 30vw, 45vw"
            />
            <div className="lab-book__meta">
              <p className="lab-book__top lab-t-index">
                <span>{String(i + 1).padStart(2, '0')}</span>
                <span>{b.date}</span>
              </p>
              <h3 className="lab-book__title lab-t-h5" lang={b.lang}>
                {b.title}
              </h3>
              {b.authors ? <p className="lab-book__authors lab-t-body-s">{b.authors}</p> : null}
              <p className="lab-book__venue lab-t-body-s">{b.venue}</p>
              {areas.length ? <p className="lab-book__areas lab-t-caption">{areas.join(' · ')}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
