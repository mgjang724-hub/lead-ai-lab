'use client';
/**
 * ResearchFeed — Home 의 최근 논문·연구 과제를 한 섹션에 묶고 Publications / Projects 칩으로 전환.
 * 헤더의 영문·국문 제목, 설명, 링크가 모두 선택한 유형을 따라가며, 본문은 전환 시 짧은 rise 리빌로 교체됩니다.
 * 데이터는 페이지(서버)에서 받아 그대로 넘기며, 목록 컴포넌트(PublicationList/ProjectShowcase)는 기존 것을 재사용합니다.
 */
import { useRef, useState } from 'react';
import type { Project, Publication } from '@/content/types';
import { cx } from '@/lib/motion/core';
import { useReveal } from '@/lib/motion/hooks';
import { SectionHeader } from './Headers';
import { PublicationList } from './Publications';
import { ProjectShowcase } from './Projects';
import { FilterChips } from '@/components/ui/Controls';
import { Button, TextLink } from '@/components/ui/Button';

type FeedKind = 'publications' | 'projects';

export function ResearchFeed(p: {
  index?: string;
  pubs: Publication[];
  projects: Project[];
  /** 논문 탭의 설명 */
  pubsDescription: string;
  /** 과제 탭의 설명 */
  projectsDescription: string;
  className?: string;
}) {
  const [kind, setKind] = useState<FeedKind>('publications');
  const body = useRef<HTMLDivElement>(null);
  const isPubs = kind === 'publications';
  useReveal(body, { variant: 'rise', trigger: 'mount', duration: 'dur-slow', replay: kind });
  return (
    <section className={cx('lab-sec lab-feed', p.className)} aria-labelledby="home-feed">
      <div className="lab-container">
        <SectionHeader
          id="home-feed"
          index={p.index}
          eyebrow="Research"
          lines={isPubs ? ['Publications.'] : ['Research Projects.']}
          ko={isPubs ? '논문 게재' : '연구 과제'}
          description={isPubs ? p.pubsDescription : p.projectsDescription}
          action={
            isPubs ? (
              <TextLink href="/publications" variant="standalone" arrow="up-right">
                Explore publications
              </TextLink>
            ) : (
              <TextLink href="/projects" variant="standalone" arrow="up-right">
                Explore projects
              </TextLink>
            )
          }
        />
        <FilterChips
          className="lab-feed__chips"
          label="표시할 실적 유형"
          multiple={false}
          value={kind}
          options={[
            { value: 'publications', label: 'Publications' },
            { value: 'projects', label: 'Projects' },
          ]}
          onToggle={(v) => setKind(v as FeedKind)}
        />
      </div>
      <div ref={body} className="lab-feed__body" data-reveal="">
        {isPubs ? (
          <div className="lab-container">
            <PublicationList compact items={p.pubs} search={false} grouped={false} />
            {/* 목록 끝에서도 전체 목록으로 갈 수 있게(2026-11-09 요청) — 라벨은 헤더 CTA 와 동일 */}
            <div className="lab-listfoot">
              <Button variant="secondary" href="/publications" icon="arrow-right">
                Explore publications
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ProjectShowcase items={p.projects} />
            <div className="lab-container lab-listfoot">
              <Button variant="secondary" href="/projects" icon="arrow-right">
                Explore projects
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
