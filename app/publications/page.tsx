import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getPublications } from '@/lib/content';
import { PageHero } from '@/components/content/Headers';
import { PublicationsBrowser } from '@/components/content/PublicationsBrowser';

/** Publications — 논문·학술발표 아카이브 (Research › Publications / Presentations). 저역서는 /books 에 따로 둡니다.
 *  hero 설명문과 출처 안내 박스는 연구실 요청(2026-11-06)으로 두지 않습니다. */
export const metadata: Metadata = {
  title: 'Publications',
  description: '학술지 논문과 학술발표 — 연도·유형·분야별 탐색과 제목 검색. 저역서는 Books 에서.',
  alternates: { canonical: '/publications' },
};

export default function PublicationsPage() {
  const items = getPublications().filter((p) => p.type !== 'book');
  return (
    <>
      <PageHero
        index="03"
        eyebrow="Publications"
        lines={['Publications']}
        ko="논문·학술발표"
      />
      <section className="lab-sec lab-sec--tight-top lab-container" aria-label="실적 목록">
        <Suspense fallback={<PublicationsBrowser items={items} noParams />}>
          <PublicationsBrowser items={items} />
        </Suspense>
      </section>
    </>
  );
}
