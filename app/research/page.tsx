import type { Metadata } from 'next';
import { brand } from '@/content/brand';
import { researchAreas } from '@/content/research-areas';
import { getProjects, getPublicationsByType, getResearchAreas } from '@/lib/content';
import { PageHero, SectionHeader } from '@/components/content/Headers';
import { ResearchGrid } from '@/components/content/Research';
import { ProjectShowcase } from '@/components/content/Projects';
import { PublicationList } from '@/components/content/Publications';
import { TextLink } from '@/components/ui/Button';
import { SubNav } from '@/components/nav/SubNav';

export const metadata: Metadata = {
  title: 'Research',
  description: `${brand.name} 연구 — ${researchAreas.map((a) => a.ko).join(', ')}. 주요 연구 분야, 연구 과제, 연구 논문.`,
  alternates: { canonical: '/research' },
};

export default function ResearchPage() {
  const areas = getResearchAreas();
  const projects = getProjects();
  const recentJournal = getPublicationsByType('journal').slice(0, 6);

  return (
    <>
      <PageHero
        index="03"
        eyebrow="Research"
        lines={['Research']}
        ko="주요 연구 분야와 프로젝트"
        lead={`${areas.map((a) => a.ko).join(', ')} — 다섯 가지 연구 분야를 중심으로 학습과 교육의 문제를 탐구하고, 연구 과제와 논문으로 그 결과를 공유합니다.`}
      />
      <SubNav
        items={[
          { href: '#areas', label: 'Areas', ko: '연구 분야' },
          { href: '#projects', label: 'Projects', ko: '연구 과제' },
          { href: '#publications', label: 'Publications', ko: '연구 논문' },
        ]}
      />

      {/* 01 Areas — 카드 그리드(≥1024: 3열). 긴 sticky 스크롤 탐색기는 비중이 너무 커서 뺐습니다(2026-11-06) */}
      <section className="lab-sec lab-sec--tight-top" aria-labelledby="research-areas" id="areas">
        <div className="lab-container">
          <SectionHeader id="research-areas" index="01" eyebrow="Areas" lines={['Research Areas.']} ko="주요 연구 분야" />
          <ResearchGrid areas={areas} feature={false} className="lab-rgrid--3" />
        </div>
      </section>

      <section className="lab-sec lab-sec--subtle" aria-labelledby="research-projects" id="projects">
        <div className="lab-container">
          <SectionHeader
            id="research-projects"
            index="02"
            eyebrow="Projects"
            lines={['Projects.']}
            ko="연구 과제"
            action={
              <TextLink href="/projects" variant="standalone" arrow="up-right">
                All projects
              </TextLink>
            }
          />
        </div>
        <ProjectShowcase items={projects.slice(0, 4)} />
      </section>

      <section className="lab-sec lab-sec--subtle" aria-labelledby="research-pubs" id="publications">
        <div className="lab-container">
          <SectionHeader
            id="research-pubs"
            index="03"
            eyebrow="Publications"
            lines={['Journal articles.']}
            ko="연구 논문"
            action={
              <TextLink href="/publications" variant="standalone" arrow="up-right">
                All publications
              </TextLink>
            }
          />
          <PublicationList compact items={recentJournal} search={false} grouped={false} />
        </div>
      </section>
    </>
  );
}
