'use client';
/**
 * PublicationItem — 행: 포인터 진입 모서리에서 selected-tint 채움, 상세 디스클로저, DOI(있을 때만).
 *   초록 캡처 이미지(abstractImage)가 있는 논문은 제목과 Abstract 버튼이 원문 링크 대신 초록 이미지 창(Modal)을 엽니다(2026-11-09 연구실 요청). 원문·DOI 는 창 아래 버튼과 DOI 링크로.
 * PublicationList — 연도 그룹 리스트 + sticky 레일(롤링 연도, 결과 수, 유형·분야 필터, 검색, 정렬). 필터 변경은 FLIP 로 재배치.
 */
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { cx, dur, ease, motion, subscribeScroll, viewportRect } from '@/lib/motion/core';
import { useIso } from '@/lib/motion/hooks';
import type { Publication, PublicationType } from '@/content/types';
import { areaById } from '@/content/research-areas';
import { formatDate, publicationTypeLabels, toIsoDate } from '@/lib/content';
import { Icon } from '@/components/ui/Icon';
import { Button, TextLink } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { withBasePath } from '@/lib/base-path';
import { FilterChips, SearchField, highlight } from '@/components/ui/Controls';
import { NumberRoll } from '@/components/motion/Kinetic';
import { TransitionLink } from '@/components/nav/TransitionLink';

const TYPES: PublicationType[] = ['journal', 'book', 'conference'];

export function PublicationItem({ item, query, dataKey, showAreas = true }: { item: Publication; query?: string; dataKey: string; showAreas?: boolean }) {
  const host = useRef<HTMLLIElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [absOpen, setAbsOpen] = useState(false);
  /* + 칸 안의 초록 이미지는 처음 펼칠 때 불러오고, 그 뒤로는 계속 둡니다(목록을 열 때 이미지를 한꺼번에 받지 않도록) */
  const [seen, setSeen] = useState(false);
  const aid = useId();
  useEffect(() => {
    const el = host.current;
    const f = fill.current;
    if (!el || !f || !motion.finePointer()) return;
    const at = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return e.clientY < r.top + r.height / 2 ? '-101%' : '101%';
    };
    const enter = (e: PointerEvent) => {
      if (motion.reduced()) {
        f.style.transform = 'none';
        f.style.opacity = '1';
        return;
      }
      f.style.transition = 'none';
      f.style.opacity = '1';
      f.style.transform = `translate3d(0,${at(e)},0)`;
      void f.offsetWidth;
      f.style.transition = `transform ${dur('dur-base')}ms ${ease('ease-out')}`;
      f.style.transform = 'translate3d(0,0,0)';
    };
    const leave = (e: PointerEvent) => {
      if (motion.reduced()) {
        f.style.opacity = '0';
        return;
      }
      f.style.transform = `translate3d(0,${at(e)},0)`;
    };
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointerleave', leave);
    };
  }, []);
  const copy = () => {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    };
    try {
      navigator.clipboard.writeText(`https://doi.org/${item.doi}`).then(done, done);
    } catch {
      done();
    }
  };
  const q = query || '';
  const typeLabel = publicationTypeLabels[item.type];
  const areas = item.areas.map((id) => areaById[id]).filter(Boolean);
  /* 제목 링크: 학술정보 논문 페이지(url) 가 있으면 그곳으로, 없고 DOI 만 있으면 doi.org 로 */
  const href = item.url || (item.doi ? `https://doi.org/${item.doi}` : undefined);
  const absSrc = item.abstractImage ? withBasePath(item.abstractImage) : null;
  const titleNode: ReactNode = absSrc ? (
    <button type="button" className="lab-pub__a lab-pub__absbtn" aria-haspopup="dialog" onClick={() => setAbsOpen(true)}>
      {highlight(item.title, q)}
      <span className="lab-sr-only"> (초록 이미지 보기)</span>
    </button>
  ) : href ? (
    <a href={href} className="lab-pub__a" target="_blank" rel="noopener noreferrer">
      {highlight(item.title, q)}
      <span className="lab-sr-only"> (새 창)</span>
    </a>
  ) : (
    highlight(item.title, q)
  );
  return (
    <li ref={host} className={cx('lab-pub', open && 'is-open')} data-key={dataKey} data-year={item.year ?? ''} id={item.id}>
      <span ref={fill} className="lab-pub__fill" aria-hidden="true" />
      <article className="lab-pub__row" lang={item.lang}>
        <span className="lab-pub__year lab-t-index">{item.year ?? '—'}</span>
        <span className="lab-pub__type">
          <span className="lab-tag">{typeLabel.ko}</span>
        </span>
        <div className="lab-pub__main">
          <h3 className="lab-pub__title lab-t-h5">{titleNode}</h3>
          {item.authors ? <p className="lab-pub__authors lab-t-body-s">{highlight(item.authors, q)}</p> : null}
          <p className="lab-pub__venue lab-t-caption">
            {highlight(item.venue, q)}
            {item.date && item.date !== '—' ? ` · ${item.date}` : ''}
          </p>
          {absSrc ? (
            <p className="lab-pub__absrow">
              <button type="button" className="lab-chipbtn" aria-haspopup="dialog" onClick={() => setAbsOpen(true)}>
                <span className="lab-chipbtn__a">
                  <Icon name="doc" size={14} stroke={1.75} />
                  Abstract <span lang="ko">초록 보기</span>
                </span>
              </button>
            </p>
          ) : null}
          {showAreas && areas.length ? (
            <p className="lab-pub__meta">
              {areas.map((a) => (
                <TransitionLink key={a.id} href={`/research/${a.slug}`} className="lab-pub__area" label="Research">
                  {a.title}
                </TransitionLink>
              ))}
            </p>
          ) : null}
        </div>
        <div className="lab-pub__actions">
          {item.doi ? <TextLink href={`https://doi.org/${item.doi}`} external variant="standalone" className="lab-pub__doi">DOI</TextLink> : null}
          {item.doi ? (
            <button type="button" className={cx('lab-chipbtn', copied && 'is-done')} onClick={copy} aria-live="polite">
              <span className="lab-chipbtn__a">
                <Icon name={copied ? 'check' : 'copy'} size={14} stroke={1.75} />
                {copied ? 'Copied' : 'Copy DOI'}
              </span>
            </button>
          ) : null}
          <button
            type="button"
            className="lab-pub__toggle"
            aria-expanded={open}
            aria-controls={aid}
            onClick={() => {
              if (!open) setSeen(true);
              setOpen(!open);
            }}
          >
            <span className="lab-sr-only">{open ? '상세 닫기' : '상세 보기'}</span>
            <span className="lab-plus" aria-hidden="true" />
          </button>
        </div>
      </article>
      <div id={aid} className="lab-collapse" data-open={open ? 'true' : 'false'}>
        <div className="lab-collapse__in">
          <div className="lab-pub__detail">
            {absSrc ? (
              <figure className="lab-pub__absfig">
                {seen ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기(이미지 최적화 없음)에서 원본 그대로 */
                  <img className="lab-absfig__img" src={absSrc} alt={`『${item.title}』 논문 첫 페이지 — 제목, 저자, 초록`} decoding="async" />
                ) : null}
                <figcaption>
                  <TextLink href={absSrc} external variant="standalone">
                    이미지 크게 보기
                  </TextLink>
                </figcaption>
              </figure>
            ) : null}
            <dl className="lab-dl">
              <dt>{item.type === 'book' ? '출판사' : item.type === 'conference' ? '학회 · 기관' : '학술지'}</dt>
              <dd>{item.venue}</dd>
              {item.date && item.date !== '—' ? (
                <>
                  <dt>{item.type === 'book' ? '출간' : item.type === 'conference' ? '발표일' : '게재'}</dt>
                  <dd>{formatDate(toIsoDate(item.date))}</dd>
                </>
              ) : null}
              {areas.length ? (
                <>
                  <dt>연구 분야</dt>
                  <dd>
                    {areas.map((a) => a.title).join(' · ')}
                  </dd>
                </>
              ) : null}
              {item.doi ? (
                <>
                  <dt>DOI</dt>
                  <dd>
                    <a href={`https://doi.org/${item.doi}`} className="lab-pub__a" target="_blank" rel="noopener noreferrer">
                      {item.doi}
                    </a>
                  </dd>
                </>
              ) : item.url ? (
                <>
                  <dt>원문</dt>
                  <dd>
                    <a href={item.url} className="lab-pub__a" target="_blank" rel="noopener noreferrer">
                      {hostLabel(item.url)}
                    </a>
                  </dd>
                </>
              ) : null}
              {item.abstract ? (
                <>
                  <dt>초록</dt>
                  <dd>{item.abstract}</dd>
                </>
              ) : null}
            </dl>
          </div>
        </div>
      </div>
      {absSrc ? (
        <Modal open={absOpen} onClose={() => setAbsOpen(false)} title={`초록 · ${item.venue}${item.date && item.date !== '—' ? ` ${item.date}` : ''}`} variant="media">
          <figure className="lab-absfig">
            {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기(이미지 최적화 없음)에서 원본 그대로 */}
            <img className="lab-absfig__img" src={absSrc} alt={`『${item.title}』 논문 첫 페이지 — 제목, 저자, 초록`} decoding="async" />
          </figure>
          <div className="lab-absfig__links">
            {href ? (
              <Button variant="secondary" size="s" href={href} external icon="arrow-up-right">
                {item.doi ? 'DOI 원문' : '원문 보기'}
              </Button>
            ) : null}
            <TextLink href={absSrc} external variant="standalone">
              이미지 크게 보기
            </TextLink>
          </div>
        </Modal>
      ) : null}
    </li>
  );
}

/* 원문 링크의 표시 이름 — 학술정보 서비스 도메인은 알기 쉬운 이름으로, 그 밖에는 호스트명 */
function hostLabel(url: string): string {
  try {
    const h = new URL(url).hostname.replace(/^(www|m)\./, '');
    if (h.endsWith('kci.go.kr')) return 'KCI 논문 페이지';
    if (h.endsWith('riss.kr') || h.endsWith('riss.or.kr')) return 'RISS 논문 페이지';
    if (h.endsWith('dbpia.co.kr')) return 'DBpia 논문 페이지';
    if (h.endsWith('earticle.net')) return 'eArticle 논문 페이지';
    if (h.endsWith('kiss.kstudy.com')) return 'KISS 논문 페이지';
    return h;
  } catch {
    return '원문 보기';
  }
}

export interface PublicationListState {
  types: PublicationType[];
  q: string;
  order: 'newest' | 'oldest';
}
export const defaultListState: PublicationListState = { types: [], q: '', order: 'newest' };

export function PublicationList(p: {
  items: Publication[];
  compact?: boolean;
  /** false 면 연도 그룹 머리글("2026")과 레일의 큰 연도 표시 없이 한 목록으로. 2026-11-06 요청으로 모든 목록이 grouped={false}(행마다 연도가 있어 연도 구분 섹션은 두지 않음) */
  grouped?: boolean;
  search?: boolean;
  focusLine?: boolean;
  initial?: Partial<PublicationListState>;
  /** 상태를 URL 쿼리에 반영 (replaceState) */
  syncUrl?: boolean;
  className?: string;
}) {
  const [sel, setSel] = useState<PublicationType[]>(p.initial?.types || []);
  const [q, setQ] = useState(p.initial?.q || '');
  const [order, setOrder] = useState<'newest' | 'oldest'>(p.initial?.order || 'newest');
  const [year, setYear] = useState<string>('');
  const listRef = useRef<HTMLDivElement>(null);
  const snap = useRef<Record<string, number> | null>(null);
  const items = p.items;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = items.filter((it) => {
      if (sel.length && !sel.includes(it.type)) return false;
      if (s && !`${it.title} ${it.authors ?? ''} ${it.venue}`.toLowerCase().includes(s)) return false;
      return true;
    });
    return order === 'oldest' ? out.slice().reverse() : out;
  }, [items, sel, q, order]);

  const groups = useMemo(() => {
    const gs: { year: string; items: Publication[] }[] = [];
    filtered.forEach((it) => {
      const y = it.year != null ? String(it.year) : '연도 미상';
      let g = gs[gs.length - 1];
      if (!g || g.year !== y) {
        g = { year: y, items: [] };
        gs.push(g);
      }
      g.items.push(it);
    });
    return gs;
  }, [filtered]);

  useEffect(() => {
    if (!p.syncUrl) return;
    const sp = new URLSearchParams();
    if (sel.length) sp.set('type', sel.join(','));
    if (q.trim()) sp.set('q', q.trim());
    if (order !== 'newest') sp.set('order', order);
    const qs = sp.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
    if (url !== window.location.pathname + window.location.search + window.location.hash) window.history.replaceState(window.history.state, '', url);
  }, [sel, q, order, p.syncUrl]);

  const capture = () => {
    const m: Record<string, number> = {};
    listRef.current?.querySelectorAll<HTMLElement>('.lab-pub').forEach((el) => {
      m[el.getAttribute('data-key') || ''] = el.getBoundingClientRect().top;
    });
    snap.current = m;
  };
  const sig = filtered.map((x) => x.id).join('|');
  useIso(() => {
    const m = snap.current;
    snap.current = null;
    if (!m || !listRef.current || motion.reduced()) return;
    let k = 0;
    listRef.current.querySelectorAll<HTMLElement>('.lab-pub').forEach((el) => {
      const key = el.getAttribute('data-key') || '';
      const top = el.getBoundingClientRect().top;
      if (m[key] != null) {
        const dy = m[key] - top;
        if (Math.abs(dy) > 1) el.animate([{ transform: `translate3d(0,${dy}px,0)` }, { transform: 'none' }], { duration: dur('dur-slow'), easing: ease('ease-in-out') });
      } else {
        el.animate([{ opacity: 0, transform: 'translate3d(0,24px,0)' }, { opacity: 1, transform: 'none' }], { duration: dur('dur-slow'), easing: ease('ease-out'), delay: k++ * dur('stagger-tight'), fill: 'both' });
      }
    });
  }, [sig]);

  const focus = p.focusLine !== false && !p.compact;
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    return subscribeScroll(null, () => {
      const vp = viewportRect(null);
      const mid = vp.top + vp.height * 0.45;
      let best: HTMLElement | null = null;
      let bd = 1e9;
      list.querySelectorAll<HTMLElement>('.lab-pub').forEach((el) => {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bd) {
          bd = d;
          best = el;
        }
      });
      list.querySelectorAll('.lab-pub.is-focus').forEach((el) => {
        if (el !== best) el.classList.remove('is-focus');
      });
      if (best) {
        const b = best as HTMLElement;
        if (focus) b.classList.add('is-focus');
        setYear(b.getAttribute('data-year') || '');
      }
    });
  }, [focus, filtered.length]);

  const toggleType = (v: string) => {
    capture();
    const t = v as PublicationType;
    setSel(sel.includes(t) ? sel.filter((x) => x !== t) : [...sel, t]);
  };
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach((it) => (c[it.type] = (c[it.type] || 0) + 1));
    return c;
  }, [items]);
  const reset = () => {
    capture();
    setSel([]);
    setQ('');
    setOrder('newest');
  };
  const yearShown = year || (filtered[0]?.year != null ? String(filtered[0].year) : '----');

  return (
    <div className={cx('lab-pubs', focus && 'has-focusline', p.compact && 'lab-pubs--compact', p.className)}>
      {p.compact ? null : (
        <aside className="lab-pubs__rail">
          <div className="lab-pubs__sticky">
            {p.grouped === false ? null : (
              <div className="lab-pubs__year" aria-hidden="true">
                <NumberRoll value={yearShown} className="lab-t-display-m" />
              </div>
            )}
            <p className="lab-pubs__count lab-t-index" aria-live="polite">
              <NumberRoll value={String(filtered.length).padStart(2, '0')} label={`${filtered.length}건`} /> results
            </p>
            <FilterChips
              label="유형 필터"
              options={TYPES.filter((t) => counts[t]).map((t) => ({ value: t, label: publicationTypeLabels[t].en, count: counts[t] || 0 }))}
              value={sel}
              multiple
              onToggle={toggleType}
              onClear={() => {
                capture();
                setSel([]);
              }}
            />
            {p.search === false ? null : (
              <SearchField
                label="논문 검색"
                placeholder="제목, 학술지, 출판사"
                value={q}
                onChange={(v) => {
                  capture();
                  setQ(v);
                }}
                compact
              />
            )}
            <div className="lab-pubs__tools">
              <div className="lab-pubs__sort" role="group" aria-label="정렬">
                <button
                  type="button"
                  className="lab-pubs__sortbtn"
                  aria-pressed={order === 'newest'}
                  onClick={() => {
                    capture();
                    setOrder('newest');
                  }}
                >
                  최신순
                </button>
                <button
                  type="button"
                  className="lab-pubs__sortbtn"
                  aria-pressed={order === 'oldest'}
                  onClick={() => {
                    capture();
                    setOrder('oldest');
                  }}
                >
                  오래된순
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}
      <div ref={listRef} className="lab-pubs__list">
        {groups.length && p.grouped === false ? (
          <ul role="list" className="lab-pubs__ul">
            {groups
              .flatMap((g) => g.items)
              .map((it) => (
                <PublicationItem key={it.id} dataKey={it.id} item={it} query={q} />
              ))}
          </ul>
        ) : groups.length ? (
          groups.map((g) => (
            <section key={g.year} className="lab-pubs__group" aria-label={`${g.year}년`}>
              <h3 className="lab-pubs__gh lab-t-label">
                {g.year}
              </h3>
              <ul role="list" className="lab-pubs__ul">
                {g.items.map((it) => (
                  <PublicationItem key={it.id} dataKey={it.id} item={it} query={q} />
                ))}
              </ul>
            </section>
          ))
        ) : (
          <div className="lab-empty">
            <p className="lab-t-h4">No results</p>
            <p className="lab-t-body">조건에 맞는 실적이 없습니다. 필터를 해제하거나 다른 검색어를 입력해 보세요.</p>
            <Button variant="secondary" size="s" icon={null} onClick={reset}>
              필터 초기화
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
