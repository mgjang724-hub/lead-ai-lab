/**
 * 콘텐츠 로더·셀렉터 — 화면은 이 모듈만 통해 데이터를 읽습니다.
 * 데이터 파일(content/data/*.json)에 항목을 추가하면 컴포넌트 수정 없이 반영됩니다.
 */
import publicationsData from '@/content/data/publications.json';
import projectsData from '@/content/data/projects.json';
import careerData from '@/content/data/career.json';
import membersData from '@/content/data/members.json';
import newsData from '@/content/data/news.json';
import labHistoryData from '@/content/data/lab-history.json';
import { researchAreas, areaById } from '@/content/research-areas';
import { professor } from '@/content/profile';
import { site } from '@/content/site';
import type {
  AreaId,
  Alumnus,
  CareerEntry,
  LabHistoryEntry,
  Member,
  MemberRole,
  NewsCategory,
  NewsItem,
  Project,
  Publication,
  PublicationType,
  ResearchArea,
} from '@/content/types';

/* ------------------------------------------------------------------ samples */

/**
 * 예시 항목(isSample: true) 처리 — 연구실 결정(2026-11-06 구성원·졸업생, 2026-11-09 소식):
 * 가상 구성원·졸업생(연구실이 제공한 가상 인물 사진)과 예시 소식(연구실 세미나·회식 등 연구실 일상, 내용은 가상)은
 * 공개 화면에 '예시' 배지만 붙여 그대로 표시합니다(필터하지 않음). 단 상세 페이지는 noindex, sitemap 제외.
 */

/* ------------------------------------------------------------------ labels */

export const publicationTypeLabels: Record<PublicationType, { ko: string; en: string }> = {
  journal: { ko: '논문', en: 'Journal Articles' },
  book: { ko: '저역서', en: 'Books' },
  conference: { ko: '학술발표', en: 'Presentations' },
};

export const memberRoleLabels: Record<MemberRole, string> = {
  phd: '박사과정',
  master: '석사과정',
  undergrad: '학부생연구원',
  researcher: '연구원',
  other: '구성원',
};

export const newsCategoryLabels: Record<NewsCategory, { ko: string; en: string }> = {
  notice: { ko: '공지', en: 'Notice' },
  conference: { ko: '학술대회', en: 'Conference' },
  publication: { ko: '연구 성과', en: 'Publication' },
  award: { ko: '수상·선정', en: 'Award' },
  event: { ko: '행사', en: 'Event' },
  member: { ko: '구성원', en: 'Members' },
};

export const scopeLabels = {
  professor: '지도교수 개인 실적',
  lab: '연구실 공동 실적',
} as const;

/* ------------------------------------------------------------------ dates */

/** "2026.08" | "2016" | "2010.02.28" | "—" → "2026-08" | "2016" | "2010-02-28" | null */
export function toIsoDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d{4})(?:\.(\d{1,2}))?(?:\.(\d{1,2}))?/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return [y, mo?.padStart(2, '0'), d?.padStart(2, '0')].filter(Boolean).join('-');
}

/** ISO 날짜를 화면 표기로: "2026-08-15" → "2026.08.15" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '연도 미상';
  return iso.replace(/-/g, '.');
}

/** 정렬 키 — 누락된 월·일은 00 */
export function dateSortKey(iso: string | null | undefined): string {
  if (!iso) return '00000000';
  const [y, m = '00', d = '00'] = iso.split('-');
  return `${y}${m}${d}`;
}

export function yearOf(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const y = Number(iso.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

/* ----------------------------------------------------------- publications */

const publications = (publicationsData.items as unknown as Publication[]).slice();

function byNewest(a: Publication, b: Publication) {
  const ka = a.sortKey ?? '00000000';
  const kb = b.sortKey ?? '00000000';
  if (ka !== kb) return kb.localeCompare(ka);
  /* 같은 날짜면 번호가 큰 쪽(나중에 등록한 쪽)이 먼저 — 번호는 오래된 순으로 매깁니다(2026-11-09 재부여, 새 항목 = 가장 큰 번호 + 1) */
  return b.id.localeCompare(a.id);
}

export function getPublications(): Publication[] {
  return publications.slice().sort(byNewest);
}

export function getPublicationsByType(type: PublicationType): Publication[] {
  return getPublications().filter((p) => p.type === type);
}

export function getPublicationsByArea(area: AreaId): Publication[] {
  return getPublications().filter((p) => p.areas.includes(area));
}

export function getPublicationById(id: string): Publication | undefined {
  return publications.find((p) => p.id === id);
}

export function getPublicationCounts() {
  return publicationsData.counts as Record<PublicationType, number>;
}

/** 연도 목록 (내림차순). null = 연도 미상 */
export function getPublicationYears(): (number | null)[] {
  const years = new Set<number | null>(publications.map((p) => p.year));
  return Array.from(years).sort((a, b) => (b ?? -1) - (a ?? -1));
}

/** Home 'Selected Publications' — 최신 논문 n편 */
export function getSelectedPublications(n = 5): Publication[] {
  return getPublicationsByType('journal').slice(0, n);
}

export function hasLabScopedPublications(): boolean {
  return publications.some((p) => p.scope === 'lab');
}

export const publicationsMeta = publicationsData.meta;

/* --------------------------------------------------------------- projects */

const projects = (projectsData.items as unknown as Project[]).slice();

export function getProjects(): Project[] {
  return projects.slice().sort((a, b) => b.startYear - a.startYear || b.start.localeCompare(a.start) || b.id.localeCompare(a.id));
}

export function getProjectsByArea(area: AreaId): Project[] {
  return getProjects().filter((p) => p.areas.includes(area));
}

export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

/** 연구 과제 연표 — 연도 범위 */
export function getProjectYearRange(): { min: number; max: number } {
  const ys = projects.flatMap((p) => [p.startYear, p.endYear]);
  return { min: Math.min(...ys), max: Math.max(...ys) };
}

export const projectsMeta = projectsData.meta;

/* ---------------------------------------------------------------- areas */

export interface AreaStats {
  area: ResearchArea;
  publications: number;
  projects: number;
  latestYear: number | null;
}

export function getResearchAreas(): ResearchArea[] {
  return researchAreas;
}

export function getAreaBySlug(slug: string): ResearchArea | undefined {
  return researchAreas.find((a) => a.slug === slug);
}

export function getAreaStats(): AreaStats[] {
  return researchAreas.map((area) => {
    const pubs = publications.filter((p) => p.areas.includes(area.id));
    const prjs = projects.filter((p) => p.areas.includes(area.id));
    const years = [...pubs.map((p) => p.year ?? 0), ...prjs.map((p) => p.endYear)];
    return {
      area,
      publications: pubs.length,
      projects: prjs.length,
      latestYear: years.length ? Math.max(...years) : null,
    };
  });
}

export function areaLabel(id: AreaId): string {
  return areaById[id]?.title ?? id;
}

/* ---------------------------------------------------------------- career */

export function getCareer(): CareerEntry[] {
  return (careerData.items as CareerEntry[]).slice().sort((a, b) => b.start.localeCompare(a.start));
}

export function getCurrentRoles(): CareerEntry[] {
  return getCareer().filter((c) => c.current);
}

/* --------------------------------------------------------------- members */

export function getMembers(): Member[] {
  return (membersData.members as unknown as Member[]).slice();
}

/** People 목록의 묶음 — 박사과정은 따로, 석사과정과 학부생연구원은 한 묶음(같은 행)으로 보여 줍니다(2026-11-09 연구실 요청). 묶음 안에서는 roles 순서대로 */
const MEMBER_GROUPS: { role: MemberRole; roles: MemberRole[]; label: string }[] = [
  { role: 'phd', roles: ['phd'], label: memberRoleLabels.phd },
  { role: 'master', roles: ['master', 'undergrad'], label: `${memberRoleLabels.master} / ${memberRoleLabels.undergrad}` },
  { role: 'researcher', roles: ['researcher'], label: memberRoleLabels.researcher },
  { role: 'other', roles: ['other'], label: memberRoleLabels.other },
];

export function getMembersByRole(): { role: MemberRole; label: string; members: Member[] }[] {
  const all = getMembers();
  return MEMBER_GROUPS.map((g) => ({ role: g.role, label: g.label, members: g.roles.flatMap((r) => all.filter((m) => m.role === r)) })).filter((g) => g.members.length > 0);
}

export function getMemberBySlug(slug: string): Member | undefined {
  return getMembers().find((m) => m.slug === slug);
}

/** 지도교수를 Member 카드 형태로 (People 그리드·Home 미리보기에서 함께 표시) */
export function professorAsMember(): Member {
  return {
    slug: professor.slug,
    href: '/about#professor',
    name: professor.name,
    nameEn: professor.nameEn,
    role: 'other',
    roleLabel: `${professor.title} · 지도교수`,
    interests: professor.interestAreas.map((id) => areaById[id].title),
    areas: professor.interestAreas,
    photo: professor.photo,
    email: professor.email,
  };
}

export function getAlumni(): Alumnus[] {
  return (membersData.alumni as unknown as Alumnus[]).slice().sort((a, b) => b.graduatedYear - a.graduatedYear);
}

export function getAlumnusBySlug(slug: string): Alumnus | undefined {
  return getAlumni().find((a) => a.slug === slug);
}

/** 졸업생 학위 표기 (목록·상세 공통) */
export const alumnusDegreeLabels: Record<Alumnus['degree'], string> = { phd: '박사', master: '석사' };
/** 졸업생 학위 영문 표기 — 프로필 Degree 항목에 이 문구만 표시(국문 없이). 표기는 연구실이 정한 문구(2026-11-09) */
export const alumnusDegreeLabelsEn: Record<Alumnus['degree'], string> = {
  phd: 'Ph.D. in Education (Educational Technology)',
  master: 'M.A. in Education (Educational Technology)',
};

export const membersMeta = membersData.meta;

/* ---------------------------------------------------------- lab history */

export function getLabHistory(): LabHistoryEntry[] {
  return (labHistoryData.items as LabHistoryEntry[]).slice();
}

/**
 * About — Research Journey 타임라인.
 * 연구실 연혁(lab-history.json)이 비어 있으면 지도교수 학위·경력·연구 과제로 구성합니다.
 */
export interface JourneyEntry {
  id: string;
  year: string;
  label: string;
  title: string;
  text?: string;
  kind: 'history' | 'career' | 'project' | 'education';
}

export function getJourney(): JourneyEntry[] {
  const history: JourneyEntry[] = getLabHistory().map((h, i) => ({
    id: `history-${i}`,
    year: h.year,
    label: '연구실 연혁',
    title: h.title,
    text: h.text,
    kind: 'history',
  }));
  const education: JourneyEntry[] = professor.education.map((e, i) => ({
    id: `edu-${i}`,
    year: e.date.slice(0, 4),
    label: '학위',
    title: `${e.institution} ${e.degree}`,
    text: e.detail ?? e.program,
    kind: 'education',
  }));
  const career: JourneyEntry[] = getCareer().map((c) => ({
    id: c.id,
    year: c.start.slice(0, 4),
    label: c.current ? '현직' : '경력',
    title: c.role,
    text: `${c.org} · ${c.period}`,
    kind: 'career',
  }));
  const prjs: JourneyEntry[] = getProjects().map((p) => ({
    id: p.id,
    year: String(p.startYear),
    label: '연구 과제',
    title: p.title,
    text: `${p.funder} · ${p.period}`,
    kind: 'project',
  }));
  return [...history, ...education, ...career, ...prjs].sort(
    (a, b) => a.year.localeCompare(b.year) || a.kind.localeCompare(b.kind),
  );
}

/* ------------------------------------------------------------------ news */

const manualNews: NewsItem[] = (newsData.items as unknown as NewsItem[]).map((n) => ({
  ...n,
  source: n.source ?? 'manual',
}));

/** 실적 데이터(최근 논문·저역서)에서 자동 생성되는 소식 (사실 데이터) — /news 에만 표시. source: 'derived' 는 내부 구분용이며 화면에는 표시하지 않습니다 */
function derivedNews(): NewsItem[] {
  const latestYear = Math.max(...publications.map((p) => p.year ?? 0));
  const recentPubs = publications.filter((p) => (p.year ?? 0) >= latestYear - 1 && p.type !== 'conference');
  const pubNews: NewsItem[] = recentPubs.map((p) => {
    const iso = toIsoDate(p.date) ?? `${p.year}`;
    const typeKo = publicationTypeLabels[p.type].ko;
    const verb = p.type === 'book' ? '출간' : '게재';
    return {
      slug: `pub-${p.id}`,
      date: iso,
      category: 'publication',
      title: p.title,
      excerpt: `${p.venue} · ${formatDate(iso)} ${verb}`,
      body: [`${typeKo} 「${p.title}」이(가) ${p.venue}에 ${verb}되었습니다 (${formatDate(iso)}).`],
      image: null,
      imageLabel: typeKo,
      isSample: false,
      source: 'derived',
      relatedIds: [p.id],
      link: { href: `/publications?type=${p.type}&q=${encodeURIComponent(p.title.slice(0, 20))}`, label: 'Publications에서 보기' },
    };
  });
  /* 경력(보임) 소식은 연구실 요청(2026-11-09)으로 만들지 않습니다 — 경력은 About › Professor 의 Career 목록에만 둡니다 */
  return pubNews;
}

export function getNews(): NewsItem[] {
  return [...manualNews, ...derivedNews()].sort(
    (a, b) => dateSortKey(b.date).localeCompare(dateSortKey(a.date)) || a.slug.localeCompare(b.slug),
  );
}

export function getNewsBySlug(slug: string): NewsItem | undefined {
  return getNews().find((n) => n.slug === slug);
}

export function getNewsByCategory(category: NewsCategory | 'all'): NewsItem[] {
  const all = getNews();
  return category === 'all' ? all : all.filter((n) => n.category === category);
}

/** 실제 소식(예시 제외) 중 가장 최근 항목 — Home 미리보기·News featured */
export function getFeaturedNews(): NewsItem | undefined {
  const all = getNews();
  return all.find((n) => !n.isSample) ?? all[0];
}

/**
 * Home 'Latest from the lab' — 연구실 일상 소식(news.json 수동 입력: 세미나·회식·행사 등)만 최신순으로.
 * 실적·경력에서 자동 생성한 항목(연구 성과·구성원 소식)은 /news 에만 둡니다(2026-11-09 연구실 요청).
 * 수동 입력 소식이 하나도 없으면 전체 소식으로 대체합니다.
 */
export function getLatestNews(n = 3): NewsItem[] {
  const lab = getNews().filter((x) => x.source !== 'derived');
  return (lab.length ? lab : getNews()).slice(0, n);
}

export const newsMeta = newsData.meta;

/* ------------------------------------------------------------- summary */

export function getSiteStats() {
  const counts = getPublicationCounts();
  const range = getProjectYearRange();
  return {
    journal: counts.journal,
    book: counts.book,
    conference: counts.conference,
    projects: projects.length,
    areas: researchAreas.length,
    members: getMembers().length,
    alumni: getAlumni().length,
    yearsActive: new Date(site.dataAsOf).getFullYear() - 2009,
    projectRange: range,
  };
}
