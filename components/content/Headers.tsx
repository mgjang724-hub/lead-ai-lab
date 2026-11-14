'use client';
/**
 * Hero (Home 전용) · PageHero (하위 페이지) · SectionHeader (섹션 오프닝)
 */
import { useRef, type ReactNode } from 'react';
import { clamp, cx, dur, mapRange, motion } from '@/lib/motion/core';
import { useReveal, useScrollLink } from '@/lib/motion/hooks';
import { SplitText } from '@/components/motion/Reveal';
import { MediaFrame, type MediaFrameProps } from '@/components/motion/MediaFrame';
import { FieldLattice } from '@/components/motion/FieldLattice';
import { brand } from '@/content/brand';
import { Phrases } from '@/components/ui/Phrases';

export interface HeroProps {
  lines: string[];
  ko?: string;
  /** 리드 문단 — 줄바꿈 등 노드도 허용 */
  lead?: ReactNode;
  actions?: ReactNode;
  media?: Pick<MediaFrameProps, 'label' | 'src' | 'alt' | 'ratio' | 'sizes' | 'tone' | 'className' | 'caption'>;
  /** 타이틀 아래 한 줄 슬로건 (타이틀과 같은 마스크 리빌, 조금 늦게) */
  tagline?: string;
  /** 타이틀 줄의 보이는 사본을 줄별로 바꿀 때 (워드마크 'AI' 강조 등) */
  lineNodes?: ReactNode[];
  meta?: [string, string];
  className?: string;
}

/* Hero — 시네마틱 홈 오프닝. 제목 줄이 마스크에서 올라오고, 이미지는 슬릿에서 열리고, 격자가 모서리에서 번짐.
   스크롤: 제목 +0.22y(페이드), 이미지 −0.1y(+6% 스케일), 격자 +0.45y. */
export function Hero(p: HeroProps) {
  const sec = useRef<HTMLElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useScrollLink(sec, (pr, info) => {
    if (motion.reduced()) return;
    const y = clamp(info.vp.top - info.rect.top, 0, info.rect.height);
    if (title.current) {
      title.current.style.transform = `translate3d(0,${(y * 0.22).toFixed(1)}px,0)`;
      title.current.style.opacity = String(1 - mapRange(y, info.rect.height * 0.25, info.rect.height * 0.8) * 0.85);
    }
    if (media.current) media.current.style.transform = `translate3d(0,${(y * -0.1).toFixed(1)}px,0) scale(${(1 + (y / info.rect.height) * 0.06).toFixed(4)})`;
    if (field.current) field.current.style.transform = `translate3d(0,${(y * 0.45).toFixed(1)}px,0)`;
  });
  useReveal(body, { variant: 'stagger', trigger: 'mount', delay: dur('delay-hero') + 900 });
  const meta = p.meta || [brand.meaning, brand.affiliation];
  return (
    <section ref={sec} className={cx('lab-hero', p.className)} aria-labelledby="lab-hero-title">
      <div ref={field} className="lab-hero__field">
        <FieldLattice />
      </div>
      <div className="lab-hero__grid lab-container">
        <div className="lab-hero__meta">
          <span>{meta[0]}</span>
          <span className="lab-hero__meta-r">{meta[1]}</span>
        </div>
        <div ref={title} className="lab-hero__title">
          <SplitText as="h1" id="lab-hero-title" className="lab-t-display-xl" lines={p.lines} lineNodes={p.lineNodes} trigger="mount" delay="delay-hero" stagger="stagger-loose" duration="dur-slower" />
          {p.tagline ? <SplitText as="p" className="lab-t-h3 lab-hero__tagline" lines={[p.tagline]} trigger="mount" delay={dur('delay-hero') + 520} duration="dur-slower" /> : null}
        </div>
        <div ref={media} className="lab-hero__media">
          <MediaFrame ratio="4/5" reveal="expand" trigger="mount" delay={dur('delay-hero') + 250} eager {...(p.media || { label: '연구실 대표 이미지' })} />
        </div>
        <div ref={body} className="lab-hero__body" data-reveal="">
          {p.ko ? (
            <p className="lab-t-title-ko-l lab-hero__ko">
              <Phrases text={p.ko} />
            </p>
          ) : null}
          {p.lead ? <p className="lab-t-lead lab-hero__lead">{p.lead}</p> : null}
          {p.actions ? <div className="lab-hero__actions">{p.actions}</div> : null}
        </div>
        <div className="lab-hero__cue" aria-hidden="true">
          <span>Scroll</span>
          <span className="lab-hero__cue-line" />
        </div>
      </div>
    </section>
  );
}

export interface PageHeroProps {
  index?: string;
  eyebrow?: string;
  lines?: string[];
  /** 보이는 제목을 줄별로 바꿀 때(예: 이름 옆 영문 이름). 스크린리더용 평문은 lines 그대로 */
  lineNodes?: ReactNode[];
  title?: string;
  ko?: string;
  lead?: string;
  tone?: 'brand';
  /** 'text' 면 제목을 긴 글 제목용 크기로(소식 상세처럼 문장 길이의 한글 제목). 기본은 display-l */
  titleSize?: 'text';
  className?: string;
  children?: ReactNode;
}

/* PageHero — 하위 페이지 오프닝: index·label, display-l 제목(마스크), hairline, 그 아래 2단(국문 제목은 영문 제목과 같은 왼쪽 선 | 리드·경로는 5단부터).
   섹션 헤더와 같은 단 구성입니다. 국문 제목이 없으면 리드·경로가 왼쪽 선에서 시작합니다. */
export function PageHero(p: PageHeroProps) {
  const rule = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useReveal(rule, { variant: 'rule', trigger: 'mount', delay: 300 });
  useReveal(body, { variant: 'stagger', trigger: 'mount', delay: 550 });
  return (
    <section className={cx('lab-phero', p.tone === 'brand' && 'lab-phero--brand', p.className)}>
      <div className="lab-container lab-phero__grid">
        <div className="lab-phero__meta">
          <span className="lab-t-index">{p.index || '01'}</span>
          <span className="lab-t-label">{p.eyebrow || ''}</span>
        </div>
        <SplitText as="h1" className={cx(p.titleSize === 'text' ? 'lab-phero__title--text' : 'lab-t-display-l', 'lab-phero__title')} lines={p.lines || [p.title || '']} lineNodes={p.lineNodes} trigger="mount" delay={120} duration="dur-slower" />
        <div ref={rule} className="lab-phero__rule" aria-hidden="true" data-reveal="" />
        <div ref={body} className={cx("lab-phero__body", !p.ko && "lab-phero__body--no-ko")} data-reveal="">
          {p.ko ? <p className="lab-t-title-ko lab-phero__ko">{p.ko}</p> : null}
          {p.lead ? <p className="lab-t-body-l lab-phero__lead">{p.lead}</p> : null}
          {p.children}
        </div>
      </div>
    </section>
  );
}

export interface SectionHeaderProps {
  index?: string;
  eyebrow?: string;
  lines?: string[];
  title?: string;
  ko?: string;
  description?: ReactNode;
  action?: ReactNode;
  onBrand?: boolean;
  /** 'l' 이면 display-l (기본 display-m) */
  size?: 'l';
  as?: 'h1' | 'h2' | 'h3';
  id?: string;
  /** false 면 제목과 설명 사이 hairline 을 그리지 않음 */
  rule?: boolean;
  className?: string;
}

/* SectionHeader — 2단 에디토리얼 레이아웃 (2026-11-06 리디자인)
   상단: "02 / RESEARCH" 작은 라벨 → 중단: display 타이포 영문 제목(마스크 라인 리빌, 전폭) →
   hairline(왼→오 드로잉) → 하단: 국문 소제목(≥768: 왼쪽 4/12) + 설명·CTA(오른쪽 8/12), 시차 등장.
   모바일은 라벨·제목·구분선·소제목·설명·CTA 순 세로 1열. 구분선은 제목과 설명 사이 한 번만. */
export function SectionHeader(p: SectionHeaderProps) {
  const rule = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  useReveal(rule, { variant: 'rule', delay: 150 });
  useReveal(row, { variant: 'stagger', delay: 320 });
  const lines = p.lines || [p.title || ''];
  const hasRow = Boolean(p.ko || p.description || p.action);
  return (
    <header className={cx('lab-sh', p.onBrand && 'lab-sh--on-brand', p.className)}>
      {p.index || p.eyebrow ? (
        <p className="lab-sh__label">
          {p.index ? <span className="lab-t-index">{p.index}</span> : null}
          {p.index && p.eyebrow ? (
            <span className="lab-sh__slash" aria-hidden="true">
              /
            </span>
          ) : null}
          {p.eyebrow ? <span className="lab-t-label">{p.eyebrow}</span> : null}
        </p>
      ) : null}
      <SplitText as={p.as || 'h2'} className={cx(p.size === 'l' ? 'lab-t-display-l' : 'lab-t-display-m', 'lab-sh__title')} lines={lines} id={p.id} />
      {hasRow ? (
        <>
          {p.rule === false ? null : <div ref={rule} className="lab-sh__rule" aria-hidden="true" data-reveal="" />}
          <div ref={row} className={cx('lab-sh__row', !p.ko && 'lab-sh__row--no-ko')} data-reveal="">
            {p.ko ? <p className="lab-t-title-ko lab-sh__ko">{p.ko}</p> : null}
            {p.description ? <p className="lab-t-body-l lab-sh__desc">{p.description}</p> : null}
            {p.action ? <div className="lab-sh__action">{p.action}</div> : null}
          </div>
        </>
      ) : null}
    </header>
  );
}
