'use client';
import { useState } from 'react';
import type { Alumnus } from '@/content/types';
import { areaById } from '@/content/research-areas';
import { alumnusDegreeLabels } from '@/lib/content';
import { FilterChips } from '@/components/ui/Controls';
import { Reveal } from '@/components/motion/Reveal';
import { MediaFrame } from '@/components/motion/MediaFrame';
import { TransitionLink } from '@/components/nav/TransitionLink';

const DEGREES = (['phd', 'master'] as const).map((value) => ({ value, label: alumnusDegreeLabels[value] }));

/* AlumniList — 학위 필터가 있는 졸업생 목록 (초상·이름·학위·졸업연도·학위논문·공개 가능한 소속만).
   행 전체가 /people/[slug] 상세 프로필로 가는 링크. 사진이 없으면 중립 placeholder,
   isSample 항목은 '예시' 배지로 가상 인물임을 표시 */
export function AlumniList({ items }: { items: Alumnus[] }) {
  const [deg, setDeg] = useState<string[]>([]);
  const list = items.filter((a) => !deg.length || deg.includes(a.degree));
  const counts: Record<string, number> = {};
  items.forEach((a) => (counts[a.degree] = (counts[a.degree] || 0) + 1));
  if (!items.length) {
    return (
      <Reveal variant="stagger" className="lab-people-empty">
        <p className="lab-t-h4">졸업생 소개를 준비하고 있습니다.</p>
        <p className="lab-t-body">졸업생 소개는 준비되는 대로 이곳에 게시됩니다.</p>
      </Reveal>
    );
  }
  return (
    <>
      <FilterChips label="학위 필터" options={DEGREES.map((d) => ({ ...d, count: counts[d.value] || 0 }))} value={deg} onToggle={(v) => setDeg(deg.includes(v) ? deg.filter((x) => x !== v) : [...deg, v])} onClear={() => setDeg([])} allLabel="전체" />
      <ul className="lab-alumni" style={{ marginTop: 32 }} key={deg.join(',')}>
        {list.map((a) => (
          <Reveal key={a.slug} as="li" variant="rise">
            <TransitionLink href={`/people/${a.slug}`} className="lab-alumni__row" label="People">
              <span className="lab-t-index">{a.graduatedYear}</span>
              <MediaFrame ratio="4/5" tone="gray" label="Portrait" src={a.photo ?? null} alt={a.photo ? `${a.name}${a.isSample ? ' (예시 인물)' : ''}` : ''} reveal="none" className="lab-alumni__photo" sizes="80px" />
              <span className="lab-rows__v">
                <span className="lab-t-h6">
                  {a.name} <span className="lab-t-caption">{alumnusDegreeLabels[a.degree]}</span>
                  {a.isSample ? <span className="lab-badge lab-badge--sample lab-alumni__badge">예시</span> : null}
                </span>
                {a.thesis ? <span className="lab-t-body-s">{a.thesis}</span> : null}
                {a.areas?.length ? <span className="lab-t-caption">{a.areas.map((id) => areaById[id]?.title).join(' · ')}</span> : null}
                {a.affiliation ? <span className="lab-t-caption">{a.affiliation}</span> : null}
              </span>
            </TransitionLink>
          </Reveal>
        ))}
      </ul>
    </>
  );
}
