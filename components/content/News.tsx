'use client';
/**
 * NewsCard — 글 중심 행(2026-11-15): 날짜·분류·꼬리표 | 제목·요약 | 사진(있을 때만) 또는 화살표. l(첫 소식, 큰 제목) | m | s(좁은 칸용 세로 쌓기).
 *   사진이 없는 소식에 빈 자리 채움용 사각형을 두지 않습니다. imageLabel(예: 세미나)은 날짜 옆 작은 꼬리표로 보입니다. 예시 콘텐츠는 '예시' 배지.
 *   hover: 제목 밑줄 드로잉, 화살표가 오른쪽으로, 사진은 마스크 안에서 천천히 확대.
 *   layout="card" — News 페이지 갤러리용 카드(2026-11-15 연구실 요청: 목록보다 갤러리형으로). 표지 칸 + 분류·꼬리표 + 제목·요약.
 *   표지는 사진이 있으면 사진, 없으면 날짜 타일(연도는 작게, 월.일은 크게)입니다 — 소식마다 다른 표지가 되고, 모두 같은 빈 사각형이 되지 않습니다.
 * NewsBrowser — 카테고리 필터 + 카드 갤러리 (News 페이지). Home 의 소식 3건도 같은 카드, 상세 옆 Related 는 행 목록을 씁니다.
 */
import { useState } from 'react';
import { cx } from '@/lib/motion/core';
import type { NewsCategory, NewsItem } from '@/content/types';
import { formatDate, newsCategoryLabels } from '@/lib/content';
import { MediaFrame } from '@/components/motion/MediaFrame';
import { Reveal } from '@/components/motion/Reveal';
import { FilterChips } from '@/components/ui/Controls';
import { Icon } from '@/components/ui/Icon';
import { TransitionLink } from '@/components/nav/TransitionLink';

/* 날짜 타일 — 사진이 없는 소식의 표지. '2026-11-04' → 작은 2026 + 큰 11.04, 월까지만 있는 날짜('2026-08')는 큰 2026.08 한 줄 */
function DateTile({ date }: { date: string }) {
  const [y, m, d] = formatDate(date).split('.');
  return (
    <time className="lab-news__tile" dateTime={date}>
      {d ? <span className="lab-news__tile-y">{y}</span> : null}
      <span className="lab-news__tile-d">{d ? `${m}.${d}` : m ? `${y}.${m}` : y}</span>
      <span className="lab-news__tile-go" aria-hidden="true">
        <Icon name="arrow-up-right" size={20} stroke={1.5} />
      </span>
    </time>
  );
}

export function NewsCard({ item, size = 'm', layout = 'row', className }: { item: NewsItem; size?: 'l' | 'm' | 's'; /** 'card' = 갤러리 카드(News 페이지), 'row' = 글 중심 행(기본) */ layout?: 'row' | 'card'; className?: string }) {
  const cat = newsCategoryLabels[item.category];
  if (layout === 'card') {
    return (
      <article className={cx('lab-news', 'lab-news--card', item.image && 'has-media', className)}>
        <TransitionLink href={`/news/${item.slug}`} className="lab-news__link" label="News">
          {item.image ? (
            <div className="lab-news__cover">
              <MediaFrame ratio="4/3" src={item.image} alt={item.title} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 100vw" />
            </div>
          ) : (
            <DateTile date={item.date} />
          )}
          <div className="lab-news__meta">
            {/* 사진이 표지일 때는 날짜를 여기에, 날짜 타일이 표지일 때는 타일이 날짜를 보여 줍니다 */}
            {item.image ? (
              <time className="lab-t-index" dateTime={item.date}>
                {formatDate(item.date)}
              </time>
            ) : null}
            <span className="lab-t-label">{cat.en}</span>
            {item.imageLabel ? <span className="lab-tag">{item.imageLabel}</span> : null}
            {item.isSample ? <span className="lab-badge lab-badge--sample">예시</span> : null}
          </div>
          <div className="lab-news__text">
            <h3 className="lab-news__title lab-t-h5">
              <span className="lab-uline">{item.title}</span>
            </h3>
            {item.excerpt ? <p className="lab-news__ex lab-t-body-s">{item.excerpt}</p> : null}
          </div>
        </TransitionLink>
      </article>
    );
  }
  return (
    <article className={cx('lab-news', `lab-news--${size}`, item.image && 'has-media', className)}>
      <TransitionLink href={`/news/${item.slug}`} className="lab-news__link" label="News">
        <div className="lab-news__meta">
          <time className="lab-t-index" dateTime={item.date}>
            {formatDate(item.date)}
          </time>
          <span className="lab-t-label">{cat.en}</span>
          {item.imageLabel ? <span className="lab-tag">{item.imageLabel}</span> : null}
          {item.isSample ? <span className="lab-badge lab-badge--sample">예시</span> : null}
        </div>
        <div className="lab-news__text">
          <h3 className={cx('lab-news__title', size === 'l' ? 'lab-t-h3' : size === 's' ? 'lab-t-h6' : 'lab-t-h5')}>
            <span className="lab-uline">{item.title}</span>
          </h3>
          {item.excerpt && size !== 's' ? <p className="lab-news__ex lab-t-body-s">{item.excerpt}</p> : null}
        </div>
        {item.image ? (
          <div className="lab-news__media">
            <MediaFrame ratio="4/3" src={item.image} alt={item.title} sizes="(min-width: 1024px) 16vw, 100vw" />
          </div>
        ) : (
          <span className="lab-news__go" aria-hidden="true">
            <Icon name="arrow-right" size={20} stroke={1.5} />
          </span>
        )}
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
        <div className="lab-newsgal" key={sel.join(',')} style={{ marginTop: 40 }}>
          {list.map((n, i) => (
            <Reveal key={n.slug} variant="rise" delay={i * 80}>
              <NewsCard item={n} layout="card" />
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
