/**
 * 콘텐츠 데이터 타입 — content/data/*.json 과 content/*.ts 가 이 계약을 따릅니다.
 * 데이터를 추가할 때 컴포넌트 코드를 고칠 필요가 없도록, 화면은 전부 이 타입만 읽습니다.
 */

export type AreaId =
  | 'ai-in-education'
  | 'learning-analytics'
  | 'instructional-design'
  | 'teacher-competency'
  | 'hrd';

export type PublicationType = 'journal' | 'book' | 'conference';

/** 실적의 귀속 — 교수 개인 실적과 연구실(구성원 공동) 실적을 화면에서 구분해 표시합니다. */
export type Scope = 'professor' | 'lab';

export interface Publication {
  id: string;
  type: PublicationType;
  title: string;
  /** 학술지명 · 출판사 · 학회/기관 (원문 표기 그대로) */
  venue: string;
  /** 원문 날짜 표기 (예: "2026.08", "2016", "2010.02.28", "—") */
  date: string;
  year: number | null;
  /** 정렬용 YYYYMMDD (월·일이 없으면 00) */
  sortKey: string | null;
  lang: 'ko' | 'en';
  /** 임시 분류 — 제목 키워드 기반. 비어 있으면 '분야 미분류' */
  areas: AreaId[];
  scope: Scope;
  /* 논문(journal)의 authors·doi·url 은 연구실 검증표(이현우_교수_논문_저자.xlsx, 2026-11-06)에서 가져왔습니다.
     저역서·학술발표는 자료가 없어 비워 둡니다. DOI 가 확인되지 않은 항목은 비워 두고 url(학술정보 논문 페이지)만 둡니다. */
  /** 제1저자부터 원본 순서로, 쉼표 구분 */
  authors?: string;
  doi?: string | null;
  /** 학술정보(KCI·RISS 등) 논문 페이지 — DOI 가 없을 때 제목 링크로 사용 */
  url?: string;
  abstract?: string;
  /** 논문 초록 캡처 이미지(public/ 기준, 예: "/images/abstracts/j59.jpg") — 연구실이 준 이미지만. 있으면 논문 목록에서 제목·Abstract 버튼을 누를 때 이 이미지가 창으로 열립니다 */
  abstractImage?: string;
  /** 저역서 표지 이미지 경로(public/ 기준, 예: "/images/books/b01.jpg") — 확인된 파일만. 없으면 /books 에서 중립 placeholder */
  cover?: string;
  coverAlt?: string;
  /** 저역서 구매 페이지(서점 상품 페이지) — 연구실이 알려 준 주소만. 있으면 /books 에서 표지가 이 주소로 가는 링크(새 창)가 됩니다 */
  purchaseUrl?: string;
}

export interface Project {
  id: string;
  title: string;
  funder: string;
  period: string;
  start: string;
  end: string;
  startYear: number;
  endYear: number;
  status: 'ongoing' | 'completed';
  areas: AreaId[];
  scope: Scope;
  summary: string | null;
  media: string | null;
}

export interface CareerEntry {
  id: string;
  role: string;
  org: string;
  period: string;
  start: string;
  end: string | null;
  current: boolean;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  program: string;
  detail?: string;
  date: string;
}

export type MemberRole = 'phd' | 'master' | 'undergrad' | 'researcher' | 'other';

/** 인물 프로필의 연구실적·수상·이력 한 줄 */
export interface ProfileEntry {
  /** 연도 또는 기간 (예: "2025", "2023.03 – 현재") */
  period: string;
  title: string;
  /** 보조 정보 (예: 구분 · 게재지·학회·기관) */
  detail?: string | null;
  /**
   * true 면 상세 프로필에 표시하지 않습니다(관리자 화면의 '사이트에 표시' 체크 해제). 기록은 데이터에 남겨 둡니다.
   * 저장소가 공개이므로 숨긴 줄도 저장소에서는 보입니다 — 공개하면 안 되는 내용은 지우세요.
   */
  hidden?: boolean;
}

/** 인물 프로필의 참여 연구 프로젝트 한 줄 — 연구실 과제(projects.json)면 projectId 로 연결하고, 아니면 period·title 을 직접 적습니다 */
export interface ProfileProject {
  /** projects.json 의 id (예: "p01") — 있으면 과제명·기간·지원 기관을 그 항목에서 가져오고 Projects 페이지의 해당 과제로 연결 */
  projectId?: string | null;
  period?: string | null;
  title?: string | null;
  /** 맡은 역할 (예: "연구보조원") */
  role?: string | null;
  /** 보조 정보 (예: 지원 기관) */
  detail?: string | null;
  /** true 면 상세 프로필에 표시하지 않음 (ProfileEntry.hidden 과 같음) */
  hidden?: boolean;
}

export interface Member {
  slug: string;
  /** 카드 링크를 /people/[slug] 대신 다른 곳으로 (지도교수 카드 → /about#professor) */
  href?: string;
  name: string;
  nameEn?: string | null;
  role: MemberRole;
  /** 화면 표기 (예: "박사과정", "석사과정", "학부생연구원") — 비우면 role 기본 라벨 */
  roleLabel?: string | null;
  interests: string[];
  areas?: AreaId[];
  email?: string | null;
  photo?: string | null;
  bio?: string | null;
  joined?: string | null;
  /** 상세 프로필의 연구실적 · 수상경력 · 이력(학력·경력) — 본인이 확인한 내용만. 비우면 해당 섹션이 나오지 않습니다 */
  research?: ProfileEntry[] | null;
  /** 참여 연구 프로젝트 */
  projects?: ProfileProject[] | null;
  awards?: ProfileEntry[] | null;
  history?: ProfileEntry[] | null;
  /** 레이아웃 확인용 가상 항목 — 이름 옆에 "예시" 배지를 붙이고, 상세 페이지는 색인·sitemap 에서 제외합니다 */
  isSample?: boolean;
}

export interface Alumnus {
  slug: string;
  name: string;
  nameEn?: string | null;
  degree: 'phd' | 'master';
  graduatedYear: number;
  thesis?: string | null;
  areas?: AreaId[];
  /** 공개 가능한 경우에만 */
  affiliation?: string | null;
  /** 초상 사진 경로(public/ 기준). 없으면 중립 placeholder */
  photo?: string | null;
  /** 상세 프로필의 연구실적 · 수상경력 · 이력 — Member 와 같은 형식 */
  research?: ProfileEntry[] | null;
  /** 참여 연구 프로젝트 */
  projects?: ProfileProject[] | null;
  awards?: ProfileEntry[] | null;
  history?: ProfileEntry[] | null;
  /** 레이아웃 확인용 가상 항목 — 화면에 '예시' 배지를 붙이고 실제 졸업생과 구분합니다 */
  isSample?: boolean;
}

export type NewsCategory = 'notice' | 'conference' | 'publication' | 'award' | 'event' | 'member';

export interface NewsItem {
  slug: string;
  /** ISO 날짜: "2026-08" 또는 "2026-08-15" */
  date: string;
  category: NewsCategory;
  title: string;
  excerpt?: string;
  /** 본문 문단 배열 */
  body?: string[];
  image?: string | null;
  imageLabel?: string;
  /** 실제 소식이 아닌 예시 콘텐츠 — 화면에 '예시'로 표시됨 */
  isSample?: boolean;
  /** 'derived' 는 실적·경력 데이터에서 자동 생성된 항목 */
  source?: 'manual' | 'derived';
  /** 연결된 논문·프로젝트·경력 id */
  relatedIds?: string[];
  link?: { href: string; label: string } | null;
}

export interface LabHistoryEntry {
  year: string;
  title: string;
  text?: string;
}

export interface ResearchArea {
  id: AreaId;
  slug: string;
  title: string;
  ko: string;
  summary: string;
  description: string;
  keywords: string[];
  /** 이미지 placeholder 라벨 (실제 사진이 생기면 image 로 교체) */
  media: string;
  image?: string | null;
  provisional: boolean;
}
