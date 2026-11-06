import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { professor } from '@/content/profile';
import { areaById } from '@/content/research-areas';
import type { AreaId } from '@/content/types';
import { alumnusDegreeLabels, getAlumni, getAlumnusBySlug, getMemberBySlug, getMembers, memberRoleLabels } from '@/lib/content';
import { PageHero } from '@/components/content/Headers';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { MediaFrame } from '@/components/motion/MediaFrame';
import { Reveal } from '@/components/motion/Reveal';
import { Button, TextLink } from '@/components/ui/Button';
import { TransitionLink } from '@/components/nav/TransitionLink';

/**
 * 인물 상세 — members.json 의 구성원(members)과 졸업생(alumni) 모두 /people/[slug] 로 생성합니다(slug 는 둘을 합쳐 유일).
 * 레이아웃은 초상이 먼저(lab-detail--photo-first): 모바일에서는 사진이 맨 위, 데스크톱에서는 왼쪽 1/3 에 두고 오른쪽에 정보.
 * 지도교수 프로필은 /about#professor 한 곳에 둡니다. isSample 인물(가상)은 '예시' 배지와 함께 표시하되 색인에서 제외합니다.
 * 정적 내보내기는 generateStaticParams 가 비어 있으면 빌드가 실패하므로, 인물이 아직 없을 때는
 * 지도교수의 옛 주소(/people/lee-hyunwoo)를 About 으로 안내하는 짧은 페이지로만 남깁니다(색인 제외).
 */
export const dynamicParams = false;

const isMovedProfessor = (slug: string) => slug === professor.slug && !getMemberBySlug(slug) && !getAlumnusBySlug(slug);

export function generateStaticParams() {
  const people = [...getMembers().map((m) => ({ slug: m.slug })), ...getAlumni().map((a) => ({ slug: a.slug }))];
  return people.length ? people : [{ slug: professor.slug }];
}

/* 예시(가상) 인물 상세는 화면에 표시하되 검색 색인에서는 제외 */
const SAMPLE_META = { robots: { index: false, follow: true } };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (isMovedProfessor(slug)) return { title: `${professor.name} — People`, description: '지도교수 소개는 About › Professor 로 옮겼습니다.', robots: { index: false, follow: true } };
  const m = getMemberBySlug(slug);
  if (m) {
    if (m.isSample) return { title: `${m.name} — People (예시)`, description: `${m.name} · ${m.roleLabel || memberRoleLabels[m.role]} (예시)`, ...SAMPLE_META };
    return { title: `${m.name} — People`, description: `${m.name} · ${m.roleLabel || memberRoleLabels[m.role]} · ${m.interests.join(', ')}`, alternates: { canonical: `/people/${slug}` } };
  }
  const a = getAlumnusBySlug(slug);
  if (!a) return {};
  if (a.isSample) return { title: `${a.name} — Alumni (예시)`, description: `${a.name} · ${alumnusDegreeLabels[a.degree]} · ${a.graduatedYear}년 졸업 (예시)`, ...SAMPLE_META };
  return {
    title: `${a.name} — Alumni`,
    description: `${a.name} · ${alumnusDegreeLabels[a.degree]} · ${a.graduatedYear}년 졸업${a.thesis ? ` · ${a.thesis}` : ''}`,
    alternates: { canonical: `/people/${slug}` },
  };
}

/** 연구 분야 링크 목록 (구성원·졸업생 공통) */
function AreaLinks({ ids }: { ids: AreaId[] }) {
  return (
    <>
      {ids.map((id, i) => (
        <span key={id}>
          <TransitionLink href={`/research/${areaById[id].slug}`} className="lab-pub__area" label="Research">
            {areaById[id].title}
          </TransitionLink>
          {i < ids.length - 1 ? ' · ' : ''}
        </span>
      ))}
    </>
  );
}

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'People', href: '/people' },
  ];
  if (isMovedProfessor(slug)) {
    return (
      <>
        <PageHero index="04" eyebrow="People" lines={[professor.name]} ko="지도교수 소개 위치 안내" lead="지도교수 소개는 About › Professor 로 옮겼습니다. 학력·경력·연구 관심 분야는 그곳에서 확인할 수 있습니다.">
          <Breadcrumb items={[...crumbs, { label: professor.name }]} />
        </PageHero>
        <section className="lab-sec lab-sec--tight-top lab-container" aria-label="이동 안내">
          <div className="lab-footer__ctas">
            <Button variant="primary" href="/about#professor" icon="arrow-right">
              About › Professor
            </Button>
            <TextLink href="/people#members" variant="standalone">
              All members
            </TextLink>
          </div>
        </section>
      </>
    );
  }

  /* ---- 구성원 (재학생·연구원) ---- */
  const m = getMemberBySlug(slug);
  if (m) {
    const role = m.roleLabel || memberRoleLabels[m.role];
    return (
      <>
        <PageHero index="04" eyebrow={m.isSample ? `${role} · 예시` : role} lines={[m.name]} ko={m.nameEn || undefined} lead={m.bio || undefined}>
          <Breadcrumb items={[...crumbs, { label: m.name }]} />
        </PageHero>
        <section className="lab-sec lab-sec--tight-top lab-container lab-detail lab-detail--photo-first" aria-label="구성원 프로필">
          <aside className="lab-detail__side">
            <MediaFrame ratio="4/5" tone="gray" label="Portrait" src={m.photo} alt={m.photo ? m.name + (m.isSample ? ' (예시 인물)' : '') : ''} className="lab-profile__photo" sizes="(min-width: 1024px) 30vw, 420px" />
            <TextLink href="/people#members" variant="standalone">
              All members
            </TextLink>
          </aside>
          <div className="lab-detail__main">
            <Reveal variant="stagger">
              <p className="lab-t-label" style={{ color: 'var(--text-tertiary)' }}>
                Research interests
              </p>
              <div className="lab-rcard__kw" style={{ marginTop: 12 }}>
                {m.interests.map((k) => (
                  <span key={k} className="lab-tag">
                    {k}
                  </span>
                ))}
              </div>
              {m.areas?.length || m.joined || m.email ? (
                <dl className="lab-dl" style={{ marginTop: 32 }}>
                  {m.areas?.length ? (
                    <>
                      <dt>Areas</dt>
                      <dd>
                        <AreaLinks ids={m.areas} />
                      </dd>
                    </>
                  ) : null}
                  {m.joined ? (
                    <>
                      <dt>Joined</dt>
                      <dd>{m.joined}</dd>
                    </>
                  ) : null}
                  {m.email ? (
                    <>
                      <dt>Email</dt>
                      <dd>
                        <a href={`mailto:${m.email}`}>{m.email}</a>
                      </dd>
                    </>
                  ) : null}
                </dl>
              ) : null}
            </Reveal>
          </div>
        </section>
      </>
    );
  }

  /* ---- 졸업생 ---- */
  const a = getAlumnusBySlug(slug);
  if (!a) notFound();
  const degree = alumnusDegreeLabels[a.degree];
  return (
    <>
      <PageHero index="04" eyebrow={a.isSample ? `Alumni · ${degree} · 예시` : `Alumni · ${degree}`} lines={[a.name]} ko={`${a.graduatedYear}년 ${degree} 졸업`}>
        <Breadcrumb items={[...crumbs, { label: 'Alumni', href: '/people#alumni' }, { label: a.name }]} />
      </PageHero>
      <section className="lab-sec lab-sec--tight-top lab-container lab-detail lab-detail--photo-first" aria-label="졸업생 프로필">
        <aside className="lab-detail__side">
          <MediaFrame ratio="4/5" tone="gray" label="Portrait" src={a.photo ?? null} alt={a.photo ? a.name + (a.isSample ? ' (예시 인물)' : '') : ''} className="lab-profile__photo" sizes="(min-width: 1024px) 30vw, 420px" />
          <TextLink href="/people#alumni" variant="standalone">
            All alumni
          </TextLink>
        </aside>
        <div className="lab-detail__main">
          <Reveal variant="stagger">
            {a.thesis ? (
              <>
                <p className="lab-t-label" style={{ color: 'var(--text-tertiary)' }}>
                  Thesis
                </p>
                <p className="lab-t-h5" style={{ marginTop: 12 }}>
                  {a.thesis}
                </p>
              </>
            ) : null}
            <dl className="lab-dl" style={{ marginTop: a.thesis ? 32 : 0 }}>
              <dt>Degree</dt>
              <dd>{degree}</dd>
              <dt>Graduated</dt>
              <dd>{a.graduatedYear}</dd>
              {a.areas?.length ? (
                <>
                  <dt>Areas</dt>
                  <dd>
                    <AreaLinks ids={a.areas} />
                  </dd>
                </>
              ) : null}
              {a.affiliation ? (
                <>
                  <dt>Affiliation</dt>
                  <dd>{a.affiliation}</dd>
                </>
              ) : null}
            </dl>
          </Reveal>
        </div>
      </section>
    </>
  );
}
