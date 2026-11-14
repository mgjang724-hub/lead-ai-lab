import type { Metadata } from 'next';
import { brand } from '@/content/brand';
import { getAlumni, getMembersByRole } from '@/lib/content';
import { PageHero, SectionHeader } from '@/components/content/Headers';
import { Reveal } from '@/components/motion/Reveal';
import { TextLink } from '@/components/ui/Button';
import { MemberGrid } from '@/components/content/People';
import { AlumniList } from '@/components/content/Alumni';

/** People — 구성원(재학생·연구원)과 졸업생만. 지도교수 소개는 About › Professor 한 곳에 둡니다. */
export const metadata: Metadata = {
  title: 'People',
  description: `${brand.name} 구성원 — 재학생·연구원과 졸업생. 지도교수 소개는 About 에서 확인할 수 있습니다.`,
  alternates: { canonical: '/people' },
};

export default function PeoplePage() {
  const groups = getMembersByRole();
  const alumni = getAlumni();
  const totalMembers = groups.reduce((n, g) => n + g.members.length, 0);

  return (
    <>
      <PageHero index="04" eyebrow="People" lines={['People']} ko="연구실 구성원" lead={`${brand.name}에서 함께 연구하는 재학생·연구원과 졸업생을 소개합니다.`} />

      {/* Members — 과정별 묶음: 묶음 이름은 왼쪽 단, 카드는 오른쪽 단(3열). 인원이 한두 명인 묶음도 빈 격자처럼 보이지 않습니다(2026-11-15) */}
      <section className="lab-sec lab-sec--tight-top" aria-labelledby="people-members" id="members">
        <div className="lab-container">
          <SectionHeader
            id="people-members"
            eyebrow="Members"
            lines={['Current members.']}
            ko="재학생·연구원"
            action={
              <TextLink href="/about#professor" variant="standalone">
                Professor (About)
              </TextLink>
            }
          />
          {totalMembers ? (
            groups.map((g) => (
              <div key={g.role} className="lab-pgroup">
                <h3 className="lab-t-title-ko lab-pgroup__label">{g.label}</h3>
                <MemberGrid members={g.members} cols={3} hideRole={g.label} className="lab-pgroup__grid" />
              </div>
            ))
          ) : (
            <Reveal variant="stagger" className="lab-people-empty">
              <p className="lab-t-h4">구성원 소개를 준비하고 있습니다.</p>
              <p className="lab-t-body">재학생·연구원 소개는 준비되는 대로 이곳에 게시됩니다.</p>
            </Reveal>
          )}
        </div>
      </section>

      {/* Alumni */}
      <section className="lab-sec lab-sec--subtle" aria-labelledby="people-alumni" id="alumni">
        <div className="lab-container">
          <SectionHeader
            id="people-alumni"
            eyebrow="Alumni"
            lines={['Alumni.']}
            ko="졸업생"
          />
          <AlumniList items={alumni} />
        </div>
      </section>
    </>
  );
}
