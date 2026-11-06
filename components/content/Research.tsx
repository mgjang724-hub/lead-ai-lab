'use client';
/**
 * ResearchIndex (Home, brand ground · 커서 추적 이미지) · ResearchCard (그리드 · 애니메이션 테두리) ·
 * ResearchExplorer (Research 페이지 sticky 스크롤 스토리; <1024px / reduced 는 stacked)
 */
import { useEffect, useRef, useState } from 'react';
import { SPRINGS, Spring, clamp, cx, motion, scrollToY, scrollTop, viewportRect } from '@/lib/motion/core';
import { useHtmlAttr, useMedia, useReveal, useScrollLink, useSpotlight } from '@/lib/motion/hooks';
import type { ResearchArea } from '@/content/types';
import { Icon } from '@/components/ui/Icon';
import { Roll } from '@/components/ui/Button';
import { MediaFrame } from '@/components/motion/MediaFrame';
import { NumberRoll } from '@/components/motion/Kinetic';
import { Reveal } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/nav/TransitionLink';

const pad = (n: number) => String(n).padStart(2, '0');
const areaHref = (a: ResearchArea) => `/research/${a.slug}`;

/* ResearchIndex — 큰 행들. fine pointer: 미디어 미리보기가 커서를 따라가며 행마다 바뀌고, 스포트라이트, 다른 행은 물러남. 터치: 행마다 썸네일. */
export function ResearchIndex({ areas, className, media = false }: { areas: ResearchArea[]; className?: string; /** 행별 썸네일(터치)과 커서 추적 이미지(fine pointer) 표시 — 실제 분야 이미지가 준비되면 켜세요 */ media?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const float = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const [act, setAct] = useState(-1);
  useSpotlight(wrap);
  useReveal(list, { variant: 'stagger' });
  useEffect(() => {
    const el = wrap.current;
    const fl = float.current;
    if (!media || !el || !fl || !motion.finePointer() || motion.reduced()) return;
    let x = 0;
    let y = 0;
    let rot = 0;
    let lastX = 0;
    const paint = () => {
      fl.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(32px,-50%) rotate(${rot.toFixed(2)}deg)`;
    };
    const sx = new Spring(0, SPRINGS.gentle, (v) => {
      rot = clamp((v - lastX) * 0.6, -6, 6);
      lastX = v;
      x = v;
      paint();
    });
    const sy = new Spring(0, SPRINGS.gentle, (v) => {
      y = v;
      paint();
    });
    let first = true;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const tx = e.clientX - r.left;
      const ty = e.clientY - r.top;
      if (first) {
        sx.jump(tx);
        sy.jump(ty);
        first = false;
      }
      sx.set(tx);
      sy.set(ty);
    };
    const leave = () => (first = true);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      sx.stop();
      sy.stop();
    };
  }, [media]);
  return (
    <div ref={wrap} className={cx('lab-rindex', act >= 0 && 'is-active', className)} onPointerLeave={() => setAct(-1)}>
      <ol ref={list} className="lab-rindex__list" role="list" data-reveal="">
        {areas.map((a, i) => (
          <li key={a.id} className={cx('lab-rindex__item', act === i && 'is-current')}>
            <TransitionLink className="lab-rindex__row" href={areaHref(a)} label="Research" onPointerEnter={() => setAct(i)} onFocus={() => setAct(i)} onBlur={() => setAct(-1)}>
              <span className="lab-rindex__idx lab-t-index">{pad(i + 1)}</span>
              <span className="lab-rindex__title lab-t-h2">
                <Roll>{a.title}</Roll>
              </span>
              <span className="lab-rindex__ko lab-t-body">{a.ko}</span>
              <span className="lab-rindex__kw lab-t-caption">{a.keywords.join(' · ')}</span>
              {media ? (
                <span className="lab-rindex__thumb" aria-hidden="true">
                  <MediaFrame ratio="4/3" label={a.media} src={a.image} alt="" reveal="none" />
                </span>
              ) : null}
              <span className="lab-rindex__arrow" aria-hidden="true">
                <Icon name="arrow-up-right" size={28} stroke={1.25} />
              </span>
            </TransitionLink>
          </li>
        ))}
      </ol>
      {media ? (
        <div ref={float} className="lab-rindex__float" aria-hidden="true">
          {areas.map((a, i) => (
            <div key={a.id} className={cx('lab-rindex__fimg', act === i && 'is-on')}>
              <MediaFrame ratio="4/5" label={a.media} src={a.image} alt="" reveal="none" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ResearchGrid — Home 연구 분야 에디토리얼 카드 그리드(네이비 씬). 모바일 1열 → 768px 이상 2열.
   feature: 첫 카드(AI in Education)를 전폭 행으로 강조하고 나머지를 2열로. 데이터·링크는 ResearchIndex 와 동일(areaHref).
   hover/focus: 면·보더 강조, 타이틀 상승, 화살표 대각 이동, 키워드 밝아짐 (transform·color 만 전환). 스크롤 진입 시 카드가 순차 등장(stagger reveal). */
export function ResearchGrid({ areas, feature = true, className }: { areas: ResearchArea[]; /** 첫 카드를 전폭 강조 행으로 */ feature?: boolean; className?: string }) {
  const list = useRef<HTMLOListElement>(null);
  useReveal(list, { variant: 'stagger', stagger: 'stagger-loose', duration: 'dur-slow' });
  return (
    <ol ref={list} className={cx('lab-rgrid', className)} role="list" data-reveal="">
      {areas.map((a, i) => (
        <li key={a.id} className={cx('lab-rgrid__cell', feature && i === 0 && 'lab-rgrid__cell--feature')}>
          <TransitionLink className="lab-rgrid__card" href={areaHref(a)} label="Research">
            <span className="lab-rgrid__top">
              <span className="lab-rgrid__idx lab-t-index">{pad(i + 1)}</span>
              <span className="lab-rgrid__arrow" aria-hidden="true">
                <Icon name="arrow-up-right" size={24} stroke={1.25} />
              </span>
            </span>
            <h3 className="lab-rgrid__title">{a.title}</h3>
            <span className="lab-rgrid__foot">
              <span className="lab-rgrid__ko">{a.ko}</span>
              <span className="lab-rgrid__kw">{a.keywords.join(' · ')}</span>
            </span>
          </TransitionLink>
        </li>
      ))}
    </ol>
  );
}

/* ResearchCard — 각진 블록. hover: hairline 프레임이 시계 방향으로 그려지고 화살표 이동, 키워드 상승. */
export function ResearchCard(p: { index?: string; title: string; ko?: string; summary?: string; keywords?: string[]; href: string; stat?: string; className?: string }) {
  return (
    <TransitionLink href={p.href} className={cx('lab-rcard', p.className)} label="Research">
      <span className="lab-rcard__frame" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="lab-rcard__top">
        <span className="lab-t-index">{p.index || '01'}</span>
        <span className="lab-rcard__arrow" aria-hidden="true">
          <Icon name="arrow-up-right" size={22} />
        </span>
      </span>
      <span className="lab-rcard__title lab-t-h3">{p.title}</span>
      {p.ko ? <span className="lab-rcard__ko lab-t-title-ko">{p.ko}</span> : null}
      {p.summary ? <span className="lab-rcard__sum lab-t-body-s">{p.summary}</span> : null}
      <span className="lab-rcard__kw">
        {(p.keywords || []).map((k) => (
          <span key={k} className="lab-tag">
            {k}
          </span>
        ))}
      </span>
      {p.stat ? <span className="lab-rcard__stat">{p.stat}</span> : null}
    </TransitionLink>
  );
}

/* ResearchExplorer — sticky 스크롤 스토리 (≥1024px, full motion). 인덱스 채움·숫자 롤·이미지 와이프·요약 교체. */
export function ResearchExplorer({ areas, label, className }: { areas: ResearchArea[]; label?: string; className?: string }) {
  const n = areas.length;
  const sec = useRef<HTMLElement>(null);
  const bars = useRef<(HTMLElement | null)[]>([]);
  const wide = useMedia('(min-width: 1024px)');
  const mo = useHtmlAttr('data-motion');
  const [reduced, setReduced] = useState(true);
  useEffect(() => setReduced(motion.reduced()), [mo]);
  const [act, setAct] = useState(0);
  const live = wide && !reduced;
  useScrollLink(
    sec,
    (pr, info) => {
      if (!live) return;
      const t = info.through * n;
      const i = clamp(Math.floor(t), 0, n - 1);
      setAct(i);
      bars.current.forEach((b, k) => {
        if (b) b.style.transform = `scaleX(${clamp(t - k, 0, 1).toFixed(3)})`;
      });
    },
    [live, n],
  );
  const jump = (i: number) => {
    const el = sec.current;
    if (!el) return;
    const vp = viewportRect(null);
    const r = el.getBoundingClientRect();
    const y = scrollTop(null) + (r.top - vp.top) + (el.offsetHeight - vp.height) * ((i + 0.15) / n);
    scrollToY(null, y, true);
  };
  if (!live) {
    return (
      <section className={cx('lab-rx lab-rx--stacked', className)} aria-label={label || 'Research areas'}>
        {areas.map((a, i) => (
          <Reveal key={a.id} variant="rise" className="lab-rx__stackitem lab-container">
            <MediaFrame ratio="16/10" label={a.media} src={a.image} alt={a.image ? a.title : ''} />
            <div className="lab-rx__stacktext">
              <span className="lab-t-index">{pad(i + 1)}</span>
              <h3 className="lab-t-h2">
                <TransitionLink href={areaHref(a)} className="lab-rx__link" label="Research">
                  {a.title}
                </TransitionLink>
              </h3>
              <p className="lab-t-title-ko">{a.ko}</p>
              <p className="lab-t-body lab-rx__sum">{a.summary}</p>
              <div className="lab-rcard__kw">
                {a.keywords.map((k) => (
                  <span key={k} className="lab-tag">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </section>
    );
  }
  return (
    <section ref={sec} className={cx('lab-rx', className)} style={{ height: `${n * 90 + 40}vh` }} aria-label={label || 'Research areas'}>
      <div className="lab-rx__sticky">
        <div className="lab-container lab-rx__grid">
          <div className="lab-rx__num" aria-hidden="true">
            <NumberRoll value={pad(act + 1)} className="lab-t-display-l" />
            <span className="lab-rx__of">/ {pad(n)}</span>
          </div>
          <ol className="lab-rx__index" role="list">
            {areas.map((a, i) => (
              <li key={a.id} className={cx('lab-rx__ii', i === act && 'is-current', i < act && 'is-past')}>
                <button type="button" className="lab-rx__btn" onClick={() => jump(i)} aria-current={i === act ? 'step' : undefined}>
                  <span className="lab-t-index">{pad(i + 1)}</span>
                  <span className="lab-rx__name">{a.title}</span>
                </button>
                <span className="lab-rx__track" aria-hidden="true">
                  <span
                    ref={(el) => {
                      bars.current[i] = el;
                    }}
                    className="lab-rx__fill"
                  />
                </span>
              </li>
            ))}
          </ol>
          <div className="lab-rx__media">
            {areas.map((a, i) => (
              <div key={a.id} className={cx('lab-rx__slide', i === act && 'is-on', i < act && 'is-past')}>
                <MediaFrame ratio="4/5" label={a.media} src={a.image} alt="" reveal="none" />
              </div>
            ))}
          </div>
          <div className="lab-rx__text" aria-live="polite">
            {areas.map((a, i) => (
              <div key={a.id} className={cx('lab-rx__panel', i === act && 'is-on')} aria-hidden={i === act ? undefined : 'true'}>
                <h3 className="lab-t-h2 lab-rx__title">
                  <span className="lab-rx__mask">
                    <span>{a.title}</span>
                  </span>
                </h3>
                <p className="lab-t-title-ko">{a.ko}</p>
                <p className="lab-t-body lab-rx__sum">{a.summary}</p>
                <div className="lab-rcard__kw">
                  {a.keywords.map((k) => (
                    <span key={k} className="lab-tag">
                      {k}
                    </span>
                  ))}
                </div>
                <TransitionLink href={areaHref(a)} className="lab-link lab-link--standalone" label="Research" tabIndex={i === act ? 0 : -1}>
                  <span className="lab-link__text">자세히 보기</span>
                  <span className="lab-link__arrow" aria-hidden="true">
                    <Icon name="arrow-right" size={16} stroke={1.75} />
                  </span>
                </TransitionLink>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
