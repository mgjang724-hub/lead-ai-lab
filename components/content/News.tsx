'use client';
/**
 * NewsCard — l | m | s. hover: 이미지가 마스크 안에서 천천히 확대, 제목 밑줄 드로잉. 예시 콘텐츠는 '예시' 배지.
 * NewsBrowser — 카테고리 필터 + featured + 그리드 (News 페이지)
 */
import { useState } from 'react';
import { cx } from '@/lib/motion/core';
import type { NewsCategory, NewsItem } from '@/content/types';
import { formatDate, newsCategoryLabels } from '@/lib/content';
import { MediaFrame } from '@/components/motion/MediaFrame';
import { Reveal } from '@/components/motion/Reveal';
import { FilterChips } from '@/components/ui/Controls';
import { TransitionLink } from '@/components/nav/TransitionLink';

export function NewsCard({ item, size = 'm', tone, className }: { item: NewsItem; size?: 'l' | 'm' | 's'; tone?: 'navy' | 'gray'; className?: string }) {
  const cat = newsCategoryLabels[item.category];
  return (
    <article className={cx('lab-news', `lab-news--${size}`, className)}>
      <TransitionLink href={`/news/${item.slug}`} className="lab-news__link" label="News">
        <div className="lab-news__media">
          <MediaFrame ratio={size === 'l' ? '4/3' : size === 's' ? '1/1' : '3/2'} label={item.imageLabel || cat.ko} src={item.image} alt={item.image ? item.title : ''} tone={tone} />
        </div>
        <div className="lab-news__meta">
          <time className="lab-t-index" dateTime={item.date}>
            {formatDate(item.date)}
          </time>
          <span className="lab-t-label">{cat.en}</span>
          {item.isSample ? <span className="lab-badge lab-badge--sample lab-news__badge">예시</span> : null}
        </div>
        <h3 className={cx('lab-news__title', size === 'l' ? 'lab-t-h3' : 'lab-t-h5')}>
          <span className="lab-uline">{item.title}</span>
        </h3>
        {item.excerpt && size !== 's' ? <p className="lab-news__ex lab-t-body-s">{item.excerpt}</p> : null}
      </TransitionLink>
    </article>
  );
}

const CATS: NewsCategory[] = ['notice', 'conference', 'publication', 'award', 'event', 'member'];

export function NewsBrowser({ items, initial = [] }: { items: NewsItem[]; initial?: NewsCategory[] }) {
  const [sel, setSel] = useState<NewsCategory[]>(initial);
  const list = items.filter((n) => !sel.length || sel.includes(n.category));
  const counts: Record<string, number> = {};
  items.forEach((n) => (counts[n.category] = (counts[n.category] || 0) + 1));
  return (
    <>
      <FilterChips
        label="소식 분류"
        options={CATS.map((k) => ({ value: k, label: newsCategoryLabels[k].ko, count: counts[k] || 0 }))}
        value={sel}
        onToggle={(v) => {
          const c = v as NewsCategory;
          setSel(sel.includes(c) ? sel.filter((x) => x !== c) : [...sel, c]);
        }}
        onClear={() => setSel([])}
        allLabel="전체"
      />
      <p className="lab-t-index lab-news__count" aria-live="polite" style={{ color: 'var(--text-tertiary)', marginTop: 16 }}>
        {list.length} items
      </p>
      {list.length ? (
        <div className="lab-newsgrid lab-newsgrid--page" key={sel.join(',')} style={{ marginTop: 32 }}>
          {list.map((n, i) => (
            <Reveal key={n.slug} variant="rise" delay={i * 80}>
              <NewsCard item={n} size={i === 0 ? 'l' : 'm'} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="lab-empty">
          <p className="lab-t-h4">No news yet</p>
          <p className="lab-t-body">이 분류의 소식이 아직 없습니다.</p>
        </div>
      )}
    </>
  );
}
