import { Fragment } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { professor } from '@/content/profile';
import type { ProfileEntry, ProfileProject } from '@/content/types';
import { alumnusDegreeLabels, alumnusDegreeLabelsEn, getAlumni, getAlumnusBySlug, getMemberBySlug, getMembers, getProjects, memberRoleLabels } from '@/lib/content';
import { PageHero } from '@/components/content/Headers';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { MediaFrame } from '@/components/motion/MediaFrame';
import { Reveal } from '@/components/motion/Reveal';
import { Button, TextLink } from '@/components/ui/Button';
import { TransitionLink } from '@/components/nav/TransitionLink';

/**
 * 인물 상세 — members.json 의 구성원(members)과 졸업생(alumni) 모두 /people/[slug] 로 생성합니다(slug 는 둘을 합쳐 유일).
 * 레이아웃은 초상이 먼저(lab-detail--photo-first): 모바일에서는 사진이 맨 위, 데스크톱에서는 왼쪽 1/3 에 두고 오른쪽에 정보.
 * 이름 옆에는 영문 이름(nameEn)을 작게 붙이고, 정보 열 아래에 연구실적·참여 연구 프로젝트·수상경력·이력(research/projects/awards/history) 섹션을 값이 있을 때만 보여 줍니다.
 * 참여 연구 프로젝트는 projectId 가 projects.json 의 과제를 가리키면 과제명·기간·지원 기관을 그 항목에서 가져오고 /projects#<id> 로 연결합니다(2026-11-09 사용자 요청).
 * 이름 hero 는 짧게(lab-phero--profile) 두고, 소개글(bio)은 hero 가 아니라 초상 옆 정보 열 맨 위에 둡니다 — 소개·관심 분야·정보가 한 열(hero 본문과 같은 7열 시작)에 모이도록(2026-11-09).
 * 프로필에는 Areas(연구 분야 링크) 행을 두지 않습니다 — 구성원은 Research interests 와 겹쳐서, 졸업생은 사용자 요청으로(2026-11-09). members.json 의 areas 값은 그대로 유지합니다.
 * 졸업생 프로필 정보는 Thesis · Degree(영문 표기만) · Graduated · Affiliation(현재 소속, 값이 있을 때만) 을 보여 줍니다. hero 의 'YYYY년 ○사 졸업' 문구는 두지 않습니다(2026-11-09 사용자 요청. Affiliation 은 같은 날 뺐다가 사용자 요청으로 다시 추가).
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

/** hero 제목 — 이름 옆에 영문 이름을 작게. 스크린리더용 평문(lines)과 보이는 사본(lineNodes)을 함께 돌려줍니다 */
function nameTitle(name: string, nameEn?: string | null) {
  if (!nameEn) return { lines: [name] };
  return {
    lines: [`${name} ${nameEn}`],
    lineNodes: [
      <Fragment key="name">
        {name}{' '}
        <span className="lab-phero__en" lang="en">
          {nameEn}
        </span>
      </Fragment>,
    ],
  };
}

type ProfileRow = ProfileEntry & { href?: string };

/** 참여 연구 프로젝트 → 표시용 한 줄. 연구실 과제(projectId)는 과제명·기간·지원 기관을 projects.json 에서 가져오고 Projects 페이지로 연결 */
function projectRows(list?: ProfileProject[] | null): ProfileRow[] | null {
  if (!list?.length) return null;
  const byId = new Map(getProjects().map((p) => [p.id, p]));
  return list.flatMap((e) => {
    if (e.hidden) return [];
    const p = e.projectId ? byId.get(e.projectId) : undefined;
    const title = p?.title ?? e.title;
    /* 과제 기간 표기("2020.07~2022.06")를 프로필의 다른 기간 표기("2023.03 – 현재")와 맞춤 */
    const period = p ? p.period.replace(/\s*~\s*/, ' – ') : e.period;
    if (!title || !period) return [];
    const detail = [e.role, p?.funder, e.detail].filter(Boolean).join(' · ') || null;
    return [{ period, title, detail, href: p ? `/projects#${p.id}` : undefined }];
  });
}

/**
 * 연구실적 · 참여 연구 프로젝트 · 수상경력 · 이력 — 값이 있는 섹션만. 예시 인물은 섹션마다 '예시' 배지.
 * hidden: true 인 줄(관리자 화면에서 '사이트에 표시' 체크를 끈 줄)은 빼고, 남는 줄이 없으면 섹션도 감춥니다.
 */
function ProfileSections({
  research,
  projects,
  awards,
  history,
  sample,
}: {
  research?: ProfileRow[] | null;
  projects?: ProfileRow[] | null;
  awards?: ProfileRow[] | null;
  history?: ProfileRow[] | null;
  sample?: boolean;
}) {
  const shown = (items?: ProfileRow[] | null) => (items ?? []).filter((it) => !it.hidden);
  const groups = [
    { key: 'research', en: 'Research', ko: '연구실적', items: shown(research) },
    { key: 'projects', en: 'Projects', ko: '참여 연구 프로젝트', items: shown(projects) },
    { key: 'awards', en: 'Awards', ko: '수상경력', items: shown(awards) },
    { key: 'history', en: 'Education & Career', ko: '이력', items: shown(history) },
  ].filter((g) => g.items.length);
  if (!groups.length) return null;
  return (
    <>
      {groups.map((g) => (
        <Reveal key={g.key} as="section" variant="stagger" className="lab-psec" aria-label={g.ko}>
          <h2 className="lab-t-label lab-psec__label">
            {g.en} <span lang="ko">{g.ko}</span>
            {sample ? <span className="lab-badge lab-badge--sample">예시</span> : null}
          </h2>
          <ul className="lab-plist" role="list">
            {(g.items || []).map((it, i) => (
              <li key={i}>
                <span className="lab-t-index">{it.period}</span>
                <span className="lab-plist__body">
                  <span className="lab-plist__title">
                    {it.href ? (
                      <TransitionLink href={it.href} className="lab-pub__a" label="Projects">
                        {it.title}
                      </TransitionLink>
                    ) : (
                      it.title
                    )}
                  </span>
                  {it.detail ? <span className="lab-t-caption">{it.detail}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
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
        <PageHero index="04" eyebrow={m.isSample ? `${role} · 예시` : role} {...nameTitle(m.name, m.nameEn)} className="lab-phero--profile">
          <Breadcrumb items={[...crumbs, { label: m.name }]} />
        </PageHero>
        <section className="lab-sec lab-container lab-detail lab-detail--photo-first lab-profile" aria-label="구성원 프로필">
          <aside className="lab-detail__side">
            <MediaFrame ratio="4/5" tone="gray" label="Portrait" src={m.photo} alt={m.photo ? m.name + (m.isSample ? ' (예시 인물)' : '') : ''} className="lab-profile__photo" sizes="(min-width: 1024px) 30vw, 420px" />
            <TextLink href="/people#members" variant="standalone">
              All members
            </TextLink>
          </aside>
          <div className="lab-detail__main">
            <Reveal variant="stagger">
              {m.bio ? <p className="lab-t-lead lab-profile__bio">{m.bio}</p> : null}
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
              {m.joined || m.email ? (
                <dl className="lab-dl" style={{ marginTop: 32 }}>
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
            <ProfileSections research={m.research} projects={projectRows(m.projects)} awards={m.awards} history={m.history} sample={m.isSample} />
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
      <PageHero index="04" eyebrow={a.isSample ? `Alumni · ${degree} · 예시` : `Alumni · ${degree}`} {...nameTitle(a.name, a.nameEn)} className="lab-phero--profile">
        <Breadcrumb items={[...crumbs, { label: 'Alumni', href: '/people#alumni' }, { label: a.name }]} />
      </PageHero>
      <section className="lab-sec lab-container lab-detail lab-detail--photo-first lab-profile" aria-label="졸업생 프로필">
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
              <dd lang="en">{alumnusDegreeLabelsEn[a.degree]}</dd>
              <dt>Graduated</dt>
              <dd>{a.graduatedYear}</dd>
              {a.affiliation ? (
                <>
                  <dt>Affiliation</dt>
                  <dd>{a.affiliation}</dd>
                </>
              ) : null}
            </dl>
          </Reveal>
          <ProfileSections research={a.research} projects={projectRows(a.projects)} awards={a.awards} history={a.history} sample={a.isSample} />
        </div>
      </section>
    </>
  );
}
