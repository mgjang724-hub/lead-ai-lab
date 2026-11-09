'use client';
/**
 * ProjectShowcase — 텍스트 비중이 큰 행 목록. 왼쪽 카드형 썸네일(4/3, 포인터 쪽으로 ≤4° 틸트) + 오른쪽 제목·기간·지원 기관·분야.
 * Home 피드(2건)·Research(최근 4건)·/projects(전체)가 같은 컴포넌트를 씁니다. ProjectTimeline — 연도 축 위 과제 막대(현재 미사용).
 */
import { useRef } from 'react';
import { cx, motion } from '@/lib/motion/core';
import { useReveal, useScrollLink, useTilt } from '@/lib/motion/hooks';
import type { Project } from '@/content/types';
import { areaById } from '@/content/research-areas';
import { MediaFrame } from '@/components/motion/MediaFrame';
import { TransitionLink } from '@/components/nav/TransitionLink';

const pad = (n: number) => String(n).padStart(2, '0');

function ProjectItem({ item, index }: { item: Project; index: number }) {
  const media = useRef<HTMLDivElement>(null);
  const meta = useRef<HTMLDivElement>(null);
  useTilt(media, { max: 4 });
  useReveal(meta, { variant: 'stagger', delay: 200 });
  const areas = item.areas.map((id) => areaById[id]).filter(Boolean);
  const primary = areas[0];
  return (
    <li className="lab-project" id={item.id}>
      <div className="lab-project__link">
        <div ref={media} className="lab-project__media">
          <div data-tilt-depth="1" className="lab-project__layer">
            <MediaFrame ratio="4/3" label={item.media ? undefined : 'Project'} src={item.media} alt={item.media ? item.title : undefined} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 220px, 280px" />
          </div>
        </div>
        <div ref={meta} className="lab-project__meta" data-reveal="">
          <div className="lab-project__tags">
            <span className="lab-t-index">{pad(index + 1)}</span>
            <span className={cx('lab-status', item.status === 'ongoing' && 'is-live')}>{item.status === 'ongoing' ? 'Ongoing' : 'Completed'}</span>
          </div>
          <h3 className="lab-t-h3 lab-project__title">{item.title}</h3>
          <dl className="lab-project__dl">
            <div>
              <dt>Period</dt>
              <dd>{item.period}</dd>
            </div>
            <div>
              <dt>Funding</dt>
              <dd>{item.funder}</dd>
            </div>
            {primary ? (
              <div>
                <dt>Area</dt>
                <dd>
                  {areas.map((a, i) => (
                    <span key={a.id}>
                      <TransitionLink href={`/research/${a.slug}`} className="lab-pub__area" label="Research">
                        {a.title}
                      </TransitionLink>
                      {i < areas.length - 1 ? ' · ' : ''}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
          {item.summary ? <p className="lab-t-body">{item.summary}</p> : null}
        </div>
      </div>
    </li>
  );
}

export function ProjectShowcase({ items, className }: { items: Project[]; className?: string }) {
  return (
    <ul className={cx('lab-projects lab-container', className)} role="list">
      {items.map((it, i) => (
        <ProjectItem key={it.id} item={it} index={i} />
      ))}
    </ul>
  );
}

/* ProjectTimeline — 연도 축 위에 과제 기간 막대. 행이 뷰포트에 들어오면 막대가 왼→오로 채워짐. */
export function ProjectTimeline({ items, range, className }: { items: Project[]; range: { min: number; max: number }; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const span = Math.max(1, range.max + 1 - range.min);
  const ticks: number[] = [];
  for (let y = range.min; y <= range.max + 1; y += span > 12 ? 2 : 1) ticks.push(y);
  useScrollLink(ref, (pr, info) => {
    const el = ref.current;
    if (!el) return;
    const line = info.vp.top + info.vp.height * 0.85;
    el.querySelectorAll<HTMLElement>('.lab-ptl__row').forEach((row) => {
      const r = row.getBoundingClientRect();
      row.classList.toggle('is-on', motion.reduced() || r.top < line);
    });
  });
  const sorted = items.slice().sort((a, b) => a.startYear - b.startYear || a.start.localeCompare(b.start));
  return (
    <div ref={ref} className={cx('lab-ptl', className)}>
      <div className="lab-ptl__axis" aria-hidden="true">
        <span className="lab-t-label">Project</span>
        <div className="lab-ptl__ticks">
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
      {sorted.map((p) => {
        const [sy, sm = '01'] = p.start.split('.');
        const [ey, em = '12'] = p.end.split('.');
        const s = Number(sy) + (Number(sm) - 1) / 12;
        const e = Number(ey) + Number(em) / 12;
        const left = ((s - range.min) / span) * 100;
        const width = Math.max(1.5, ((e - s) / span) * 100);
        return (
          <div key={p.id} className="lab-ptl__row">
            <div>
              <div className="lab-ptl__meta">
                <span>{p.period}</span>
                <span>{p.funder}</span>
                {p.areas[0] ? <span>{areaById[p.areas[0]]?.title}</span> : null}
              </div>
              <p className="lab-ptl__title lab-t-h6">{p.title}</p>
            </div>
            <div className="lab-ptl__track" aria-hidden="true">
              <span className="lab-ptl__bar" style={{ left: `${left}%`, width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
