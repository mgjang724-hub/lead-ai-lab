import type { Metadata } from 'next';
import { brand } from '@/content/brand';
import { getProjects } from '@/lib/content';
import { PageHero } from '@/components/content/Headers';
import { ProjectShowcase } from '@/components/content/Projects';

/**
 * Projects — 연구 과제 전체 목록 (Research › Projects). Research 페이지는 최근 4건만 보여 주고
 * 이 페이지가 projects.json 의 전체 목록입니다(같은 ProjectShowcase 행 목록). 분야 상세의 관련 과제 링크(/projects#pXX)가 여기로 옵니다.
 * hero 설명문과 건수 표기는 연구실 요청(2026-11-06)으로 두지 않습니다.
 */
export const metadata: Metadata = {
  title: 'Projects',
  description: `${brand.name} 연구 과제 — 기간·지원 기관·연구 분야별 전체 목록.`,
  alternates: { canonical: '/projects' },
};

export default function ProjectsPage() {
  const projects = getProjects();
  return (
    <>
      <PageHero index="03" eyebrow="Projects" lines={['Projects']} ko="연구 과제" />
      {/* ProjectShowcase 의 <ul> 이 lab-container 를 가지므로 section 에는 두지 않습니다 */}
      <section className="lab-sec lab-sec--tight-top" aria-label="연구 과제 목록">
        <ProjectShowcase items={projects} />
      </section>
    </>
  );
}
