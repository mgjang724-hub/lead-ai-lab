/**
 * 관리자 화면에서 편집하는 항목 묶음(컬렉션) 정의.
 *
 * 화면의 입력 폼·목록·검사는 모두 이 정의를 읽어 만들어집니다. 새 항목 종류를 CMS 에 붙일 때는
 * 데이터 파일(content/data/*.json)과 content/types.ts 의 형식에 맞춰 여기에 정의를 하나 더 추가하면 됩니다.
 *
 * - 주소(slug)로 구분하는 항목: 소식·구성원·졸업생 — 편집자가 영문 주소를 정함
 * - 번호(id)로 구분하는 항목: 논문(j)·저역서(b)·학술발표(c)·연구 과제(p) — 게시할 때 종류별 가장 큰 번호 + 1 을 자동으로 붙임
 *   (논문·저역서·학술발표는 publications.json 한 배열에 type 으로 섞여 있어 match 로 나눠 보여 줍니다)
 */
import { researchAreas } from '@/content/research-areas';
import { alumnusDegreeLabels, formatDate, memberRoleLabels, newsCategoryLabels, scopeLabels } from '@/lib/content';
import type { MemberRole, NewsCategory } from '@/content/types';

export type CollectionId = 'news' | 'members' | 'alumni' | 'journals' | 'books' | 'conferences' | 'projects';

/** JSON 값 — 항목은 데이터 파일의 객체 그대로 다룹니다 */
export type Item = Record<string, unknown>;

export type FieldType =
  | 'text'
  | 'textarea'
  | 'paragraphs'
  | 'select'
  | 'areas'
  | 'tags'
  | 'year'
  | 'image'
  | 'checkbox'
  | 'list'
  | 'project';

export interface ImageSpec {
  /** crop: 정해진 비율로 잘라 고정 크기로 / fit: 비율 유지, 긴 변만 줄임 */
  mode: 'crop' | 'fit';
  width: number;
  height: number;
  /** public/images/<dir>/ 에 저장 */
  dir: 'people' | 'news' | 'books' | 'abstracts' | 'projects';
  /** JPEG 품질 (기본 0.85 — 글자가 많은 초록 캡처는 높게) */
  quality?: number;
}

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  /** 값이 비었을 때: 'null' 로 저장 / 'omit' 키를 지움 (기본 omit) */
  empty?: 'null' | 'omit';
  pattern?: RegExp;
  patternHint?: string;
  rows?: number;
  options?: { value: string; label: string }[];
  image?: ImageSpec;
  checkboxLabel?: string;
  /** list: 한 줄에 들어가는 칸 */
  fields?: FieldDef[];
  addLabel?: string;
  /** list: 줄마다 '사이트에 표시' 체크박스 — 끄면 그 줄에 hidden: true 를 저장해 공개 화면에서 뺍니다 */
  hideable?: boolean;
  /** 폼에서 이 칸 위에 소제목을 붙임 */
  section?: string;
  /** 좁은 칸 (한 줄에 두 개) */
  half?: boolean;
}

export interface CollectionDef {
  id: CollectionId;
  /** 메뉴 묶음 이름 */
  group: string;
  /** 메뉴 이름 */
  label: string;
  /** "소식 추가" 처럼 쓰는 한 항목 이름 */
  itemLabel: string;
  description: string;
  file: string;
  /** 데이터 파일 안의 배열 이름 */
  arrayKey: string;
  /** 항목을 구분하는 키 — slug(편집자가 정하는 영문 주소) 또는 id(자동 번호) */
  keyField: 'slug' | 'id';
  /** id 자동 번호 — 접두어 + 같은 파일에서 그 접두어로 쓰인 가장 큰 번호 + 1 (자릿수 width 로 0 채움) */
  autoKey?: { prefix: string; width: number };
  /** 한 배열을 여러 컬렉션이 나눠 쓸 때 이 컬렉션의 항목인지 (publications.json 의 type) */
  match?: (item: Item) => boolean;
  /** 같은 파일 안에서 키가 겹치면 안 되는 배열들 (구성원과 졸업생은 /people/<slug> 를 함께 씀) */
  uniqueAcross: string[];
  /** 새 항목을 넣을 자리 — 배열 앞(start)·뒤(end)·같은 종류 묶음의 맨 앞(group) */
  newPosition: 'start' | 'end' | 'group';
  /** 입력에서 자동으로 계산하는 칸 (예: 날짜 → 연도·정렬값). 폼에는 나오지 않음 */
  derive?: (item: Item) => Item;
  /** 칸 하나로는 알 수 없는 추가 검사 (칸 이름 → 오류 문장) */
  validate?: (item: Item) => Record<string, string>;
  /** 목록 순서가 화면 순서인지 (구성원) */
  orderable: boolean;
  /** 공개 화면 주소 */
  publicPath: (key: string) => string;
  /** 주소 앞에 쓰면 안 되는 말 (자동 생성 소식과 겹치지 않도록) */
  reservedPrefixes?: string[];
  fields: FieldDef[];
  defaults: () => Item;
  suggestKey: (item: Item) => string;
  title: (item: Item) => string;
  meta: (item: Item) => string;
  thumb: (item: Item) => string | null;
  /** 목록의 작은 사진 모양 (none: 사진 칸 없음). 기본 portrait */
  listThumb?: 'portrait' | 'landscape' | 'none';
  /** 미리보기가 가로로 긴 목록 한 줄이면 true — 폼 옆이 아니라 아래에 전체 폭으로 보여 줌 */
  previewWide?: boolean;
  /** 목록 화면 정렬 (orderable 이면 무시) */
  sort?: (a: Item, b: Item) => number;
  /**
   * 다른 메뉴의 항목을 이 메뉴로 옮기기 (구성원 → 졸업생).
   * 원래 메뉴의 편집 화면에 buttonLabel 버튼이 생기고, 게시하면 원래 항목을 지우고 같은 주소로 이 메뉴에 추가합니다.
   * 사진 파일은 그대로 쓰고, convert 가 넘겨주지 않는 칸(이 메뉴에 없는 칸)은 버립니다.
   */
  moveFrom?: { collection: CollectionId; buttonLabel: string; convert: (item: Item) => Item; hint: string };
}

/* ------------------------------------------------------------------ 공통 */

export const KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DATE_PATTERN = /^\d{4}(-\d{2}){0,2}$/;

const str = (v: unknown) => (typeof v === 'string' ? v : '');

export function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** "Seoyeon Lee" → "seoyeon-lee" (영문·숫자만) */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '');
}

function compactDate() {
  return today().replace(/-/g, '');
}

export const areaOptions = researchAreas.map((a) => ({ value: a.id, label: `${a.title} · ${a.ko}` }));
export const areaIds = researchAreas.map((a) => a.id as string);

const entryFields: FieldDef[] = [
  { name: 'period', label: '연도·기간', type: 'text', required: true, placeholder: '2025 또는 2023.03 – 현재' },
  { name: 'title', label: '내용', type: 'text', required: true },
  { name: 'detail', label: '보조 정보', type: 'text', placeholder: '구분 · 게재지·학회·기관', empty: 'omit' },
];

/** 상세 프로필 목록 칸 — 구성원·졸업생 공통 */
const profileFields: FieldDef[] = [
  {
    name: 'research',
    label: '연구실적',
    type: 'list',
    fields: entryFields,
    addLabel: '연구실적 추가',
    hideable: true,
    section: '상세 프로필',
    help: '본인이 확인한 내용만 적습니다. 줄마다 ‘사이트에 표시’를 끄면 기록은 남기고 상세 페이지에서만 뺍니다. 표시할 줄이 하나도 없으면 이 부분이 통째로 나오지 않습니다. (저장소가 공개라 숨긴 줄도 저장소에서는 보이니, 공개하면 안 되는 내용은 지워 주세요.)',
  },
  {
    name: 'projects',
    label: '참여 연구 프로젝트',
    type: 'list',
    addLabel: '프로젝트 추가',
    hideable: true,
    help: '연구실 과제에 참여했다면 과제를 고르기만 하면 됩니다. 연구실 과제가 아니면 기간과 과제명을 직접 적습니다.',
    fields: [
      { name: 'projectId', label: '연구실 과제', type: 'project', empty: 'omit' },
      { name: 'period', label: '기간', type: 'text', placeholder: '2024.03 – 현재', empty: 'omit' },
      { name: 'title', label: '과제명', type: 'text', empty: 'omit' },
      { name: 'role', label: '역할', type: 'text', placeholder: '연구보조원', empty: 'omit' },
      { name: 'detail', label: '보조 정보', type: 'text', placeholder: '지원 기관', empty: 'omit' },
    ],
  },
  { name: 'awards', label: '수상경력', type: 'list', fields: entryFields, addLabel: '수상 추가', hideable: true },
  { name: 'history', label: '이력 (학력·경력)', type: 'list', fields: entryFields, addLabel: '이력 추가', hideable: true },
];

const PROFILE_LISTS = profileFields.map((f) => f.name);

const sampleField = (what: string): FieldDef => ({
  name: 'isSample',
  label: '예시 표시',
  type: 'checkbox',
  checkboxLabel: `레이아웃 확인용 예시(가상) ${what} — 화면에 '예시' 배지가 붙습니다`,
  section: '기타',
});

/* ------------------------------------------------------------------ 소식 */

const newsCategories = Object.keys(newsCategoryLabels) as NewsCategory[];

const news: CollectionDef = {
  id: 'news',
  group: '소식·사람',
  keyField: 'slug',
  listThumb: 'landscape',
  label: '소식',
  itemLabel: '소식',
  description: '연구실 공지·행사·수상 소식입니다. Home 의 최근 소식과 News 페이지에 날짜순으로 나옵니다. (논문 게재 소식은 실적 데이터에서 자동으로 만들어지므로 여기에 없습니다.)',
  file: 'content/data/news.json',
  arrayKey: 'items',
  uniqueAcross: ['items'],
  newPosition: 'start',
  orderable: false,
  publicPath: (key) => `/news/${key}`,
  reservedPrefixes: ['pub-'],
  fields: [
    { name: 'title', label: '제목', type: 'text', required: true },
    {
      name: 'date',
      label: '날짜',
      type: 'text',
      required: true,
      placeholder: '2026-11-09',
      pattern: DATE_PATTERN,
      patternHint: '2026-11-09 또는 2026-11 형식으로 적어 주세요',
      half: true,
    },
    {
      name: 'category',
      label: '분류',
      type: 'select',
      required: true,
      options: newsCategories.map((c) => ({ value: c, label: `${newsCategoryLabels[c].ko} (${newsCategoryLabels[c].en})` })),
      half: true,
    },
    { name: 'excerpt', label: '요약', type: 'textarea', rows: 2, help: '목록 카드에 보이는 한두 문장입니다.' },
    { name: 'body', label: '본문', type: 'paragraphs', rows: 8, help: '문단과 문단 사이에 빈 줄을 하나 넣어 주세요.' },
    {
      name: 'image',
      label: '대표 사진',
      type: 'image',
      empty: 'null',
      image: { mode: 'fit', width: 1600, height: 1600, dir: 'news' },
      section: '사진',
      help: '사진은 공개 저장소에 올라가며, 지워도 변경 기록에는 남습니다. 게시에 동의한 사진만 올려 주세요.',
    },
    { name: 'imageLabel', label: '짧은 꼬리표 (선택)', type: 'text', placeholder: '세미나', help: '소식 목록에서 날짜 옆에 작은 꼬리표로 표시됩니다. 예: 세미나, 회식. 비워도 됩니다.' },
    sampleField('소식'),
  ],
  defaults: () => ({ slug: '', date: today(), category: 'notice', title: '', excerpt: '', body: [], image: null, source: 'manual' }),
  suggestKey: (item) => {
    const d = str(item.date).replace(/-/g, '') || compactDate();
    return `news-${d}`;
  },
  title: (item) => str(item.title) || '(제목 없음)',
  meta: (item) => {
    const c = newsCategoryLabels[item.category as NewsCategory];
    return [formatDate(str(item.date)), c?.ko].filter(Boolean).join(' · ');
  },
  thumb: (item) => (typeof item.image === 'string' ? item.image : null),
  sort: (a, b) => str(b.date).localeCompare(str(a.date)) || str(a.slug).localeCompare(str(b.slug)),
};

/* ---------------------------------------------------------------- 구성원 */

const memberRoles = Object.keys(memberRoleLabels) as MemberRole[];

const portrait: ImageSpec = { mode: 'crop', width: 900, height: 1125, dir: 'people' };

const photoHelp = '세로 4:5 비율로 잘라 저장합니다. 사진은 공개 저장소에 올라가며 지워도 변경 기록에는 남으니, 본인이 게시에 동의한 사진만 올려 주세요.';

const members: CollectionDef = {
  id: 'members',
  group: '소식·사람',
  keyField: 'slug',
  label: '구성원',
  itemLabel: '구성원',
  description: 'People 페이지와 Home 미리보기에 나오는 재학 구성원입니다. 이 목록의 순서가 같은 과정(박사·석사 등) 안에서의 화면 순서입니다.',
  file: 'content/data/members.json',
  arrayKey: 'members',
  uniqueAcross: ['members', 'alumni'],
  newPosition: 'end',
  orderable: true,
  publicPath: (key) => `/people/${key}`,
  fields: [
    { name: 'name', label: '이름', type: 'text', required: true, half: true, section: '기본 정보' },
    { name: 'nameEn', label: '영문 이름', type: 'text', empty: 'null', placeholder: 'Seoyeon Lee', half: true },
    {
      name: 'role',
      label: '과정',
      type: 'select',
      required: true,
      options: memberRoles.map((r) => ({ value: r, label: memberRoleLabels[r] })),
      half: true,
    },
    { name: 'roleLabel', label: '화면에 보일 과정 이름', type: 'text', empty: 'null', placeholder: '비우면 과정 이름 그대로', half: true },
    { name: 'joined', label: '입학·합류', type: 'text', empty: 'null', placeholder: '2024.03', half: true },
    { name: 'email', label: '공개 이메일', type: 'text', empty: 'null', placeholder: '공개해도 되는 주소만', half: true },
    { name: 'photo', label: '프로필 사진', type: 'image', empty: 'null', image: portrait, help: photoHelp },
    { name: 'interests', label: '연구 관심사', type: 'tags', placeholder: 'Learning Analytics, Generative AI', help: '쉼표로 구분합니다. 카드에 마우스를 올리면 보입니다.' },
    { name: 'areas', label: '연구 분야', type: 'areas' },
    { name: 'bio', label: '소개', type: 'textarea', rows: 4, empty: 'null' },
    ...profileFields,
    sampleField('구성원'),
  ],
  defaults: () => ({ slug: '', name: '', nameEn: null, role: 'master', roleLabel: null, interests: [], areas: [], email: null, photo: null, bio: null, joined: null }),
  suggestKey: (item) => slugify(str(item.nameEn)) || `member-${compactDate()}`,
  title: (item) => str(item.name) || '(이름 없음)',
  meta: (item) => {
    const role = str(item.roleLabel) || memberRoleLabels[item.role as MemberRole] || '';
    return [role, str(item.nameEn)].filter(Boolean).join(' · ');
  },
  thumb: (item) => (typeof item.photo === 'string' ? item.photo : null),
};

/* ---------------------------------------------------------------- 졸업생 */

const alumni: CollectionDef = {
  id: 'alumni',
  group: '소식·사람',
  keyField: 'slug',
  label: '졸업생',
  itemLabel: '졸업생',
  description: 'People › Alumni 에 졸업 연도순으로 나옵니다. 소속은 본인이 공개에 동의한 경우에만 적습니다.',
  file: 'content/data/members.json',
  arrayKey: 'alumni',
  uniqueAcross: ['members', 'alumni'],
  newPosition: 'end',
  orderable: false,
  publicPath: (key) => `/people/${key}`,
  /* 졸업생 목록 한 줄(연도 · 이름 · 학위논문 · 분야)은 가로로 길어 폼 아래 전체 폭으로 미리보기 */
  previewWide: true,
  fields: [
    { name: 'name', label: '이름', type: 'text', required: true, half: true, section: '기본 정보' },
    { name: 'nameEn', label: '영문 이름', type: 'text', empty: 'null', placeholder: 'Doyun Kim', half: true },
    {
      name: 'degree',
      label: '학위',
      type: 'select',
      required: true,
      options: (Object.keys(alumnusDegreeLabels) as ('phd' | 'master')[]).map((d) => ({ value: d, label: alumnusDegreeLabels[d] })),
      half: true,
    },
    { name: 'graduatedYear', label: '졸업 연도', type: 'year', required: true, placeholder: '2024', half: true },
    { name: 'thesis', label: '학위논문', type: 'textarea', rows: 2, empty: 'null' },
    { name: 'affiliation', label: '현재 소속', type: 'text', empty: 'null', help: '본인이 공개에 동의한 경우에만 적습니다.' },
    { name: 'photo', label: '프로필 사진', type: 'image', empty: 'null', image: portrait, help: photoHelp },
    { name: 'areas', label: '연구 분야', type: 'areas' },
    ...profileFields,
    sampleField('졸업생'),
  ],
  defaults: () => ({ slug: '', name: '', nameEn: null, degree: 'master', graduatedYear: new Date().getFullYear(), thesis: null, areas: [], affiliation: null, photo: null }),
  moveFrom: {
    collection: 'members',
    buttonLabel: '졸업생으로 옮기기',
    hint: '학위는 과정에 맞춰(박사과정 → 박사, 그 밖 → 석사), 졸업 연도는 올해로 미리 골라 두었으니 확인해 주세요. 학위논문과 현재 소속(본인이 공개에 동의한 경우만)을 적고, 이력·참여 연구 프로젝트에 ‘현재’로 적힌 줄(예: 2025.03 – 현재 석사과정)은 졸업에 맞게 고친 뒤 게시합니다.',
    /* 이름·사진·연구 분야·상세 프로필은 그대로, 학위는 과정에서 추정(박사과정 → 박사, 그 밖 → 석사), 졸업 연도는 올해.
       과정·입학·이메일·관심사·소개는 졸업생 정보에 없어 넘기지 않음 */
    convert: (m) => {
      const out: Item = {
        ...alumni.defaults(),
        slug: str(m.slug),
        name: str(m.name),
        nameEn: typeof m.nameEn === 'string' && m.nameEn ? m.nameEn : null,
        degree: m.role === 'phd' ? 'phd' : 'master',
        photo: typeof m.photo === 'string' && m.photo ? m.photo : null,
        areas: Array.isArray(m.areas) ? m.areas : [],
      };
      for (const k of PROFILE_LISTS) if (Array.isArray(m[k]) && (m[k] as unknown[]).length) out[k] = m[k];
      if (m.isSample === true) out.isSample = true;
      return out;
    },
  },
  suggestKey: (item) => slugify(str(item.nameEn)) || `alumni-${compactDate()}`,
  title: (item) => str(item.name) || '(이름 없음)',
  meta: (item) => {
    const deg = alumnusDegreeLabels[item.degree as 'phd' | 'master'] ?? '';
    return [`${item.graduatedYear ?? ''} 졸업`, deg, str(item.nameEn)].filter(Boolean).join(' · ');
  },
  thumb: (item) => (typeof item.photo === 'string' ? item.photo : null),
  sort: (a, b) => Number(b.graduatedYear ?? 0) - Number(a.graduatedYear ?? 0) || str(a.name).localeCompare(str(b.name), 'ko'),
};

/* ----------------------------------------------------- 논문·저역서·학술발표 */

const PUBLICATIONS_FILE = 'content/data/publications.json';

/** 실적 날짜 — 원문 표기 그대로 "2026", "2026.08", "2026.08.15". 모르면 "—" */
export const PUB_DATE_PATTERN = /^(\d{4}(\.\d{2}){0,2}|—)$/;
const URL_PATTERN = /^https?:\/\/\S+$/;

/** 날짜 → 연도·정렬값 (scripts/check-data.mjs 가 year 와 sortKey 앞 네 자리가 같은지 검사) */
function derivePublication(item: Item): Item {
  const date = str(item.date).trim() || '—';
  const m = date.match(/^(\d{4})(?:\.(\d{2}))?(?:\.(\d{2}))?$/);
  return { ...item, date, year: m ? Number(m[1]) : null, sortKey: m ? `${m[1]}${m[2] ?? '00'}${m[3] ?? '00'}` : null };
}

const langOptions = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: '영어' },
];
const scopeOptions = Object.entries(scopeLabels).map(([value, label]) => ({ value, label }));

const pubDate: FieldDef = {
  name: 'date',
  label: '날짜',
  type: 'text',
  placeholder: '2026.08',
  pattern: PUB_DATE_PATTERN,
  patternHint: '2026, 2026.08, 2026.08.15 처럼 점(.)으로 적어 주세요. 모르면 비워 둡니다.',
  help: '모르면 비워 두세요 (화면에는 연도 미상으로 나옵니다).',
  half: true,
};
const pubLang: FieldDef = { name: 'lang', label: '언어', type: 'select', required: true, options: langOptions, half: true };
const pubAreas: FieldDef = { name: 'areas', label: '연구 분야', type: 'areas', help: '고르지 않으면 ‘분야 미분류’로 남습니다.' };
const pubScope: FieldDef = { name: 'scope', label: '실적 구분', type: 'select', required: true, options: scopeOptions, half: true };
const pubAuthors = (placeholder: string): FieldDef => ({ name: 'authors', label: '저자', type: 'text', placeholder, help: '제1저자부터 원래 순서대로, 쉼표로 구분합니다.' });

const pubCommon = {
  group: '연구 실적',
  file: PUBLICATIONS_FILE,
  arrayKey: 'items',
  keyField: 'id' as const,
  uniqueAcross: ['items'],
  newPosition: 'group' as const,
  orderable: false,
  derive: derivePublication,
  title: (item: Item) => str(item.title) || '(제목 없음)',
  meta: (item: Item) => [str(item.date) === '—' ? '연도 미상' : str(item.date), str(item.venue)].filter(Boolean).join(' · '),
  sort: (a: Item, b: Item) => str(b.sortKey).localeCompare(str(a.sortKey)) || str(b.id).localeCompare(str(a.id), undefined, { numeric: true }),
  suggestKey: () => '',
};

const journals: CollectionDef = {
  ...pubCommon,
  id: 'journals',
  label: '논문',
  itemLabel: '논문',
  description: 'Publications 의 학술지 논문입니다. 새 논문은 j 번호가 자동으로 붙고, 최근 논문은 News 에 ‘연구 성과’로도 자동으로 나옵니다.',
  autoKey: { prefix: 'j', width: 2 },
  match: (item) => item.type === 'journal',
  publicPath: () => '/publications',
  fields: [
    { name: 'title', label: '제목', type: 'text', required: true },
    pubAuthors('이헌영, 이현우'),
    { name: 'venue', label: '학술지', type: 'text', required: true, placeholder: '교육정보미디어연구' },
    pubDate,
    pubLang,
    {
      name: 'doi',
      label: 'DOI',
      type: 'text',
      placeholder: '10.15833/kaeim.2026.32.4.027',
      pattern: /^10\.\S+$/,
      patternHint: 'DOI 는 10. 으로 시작합니다 (https://doi.org/ 는 빼고 적어 주세요).',
      help: '확인된 경우만 적습니다. 있으면 제목이 DOI 로 연결됩니다.',
      section: '링크·초록',
    },
    { name: 'url', label: '논문 페이지 주소', type: 'text', placeholder: 'https://www.kci.go.kr/…', pattern: URL_PATTERN, patternHint: 'https:// 로 시작하는 주소를 적어 주세요.', help: 'DOI 가 없을 때 KCI·RISS 등의 논문 페이지 주소.' },
    { name: 'abstract', label: '초록 (글)', type: 'textarea', rows: 4 },
    {
      name: 'abstractImage',
      label: '초록 이미지',
      type: 'image',
      image: { mode: 'fit', width: 1600, height: 3200, dir: 'abstracts', quality: 0.92 },
      help: '연구실이 받은 초록 캡처만 올립니다. 있으면 논문 목록에서 제목이나 ‘Abstract’ 를 누를 때 이 이미지가 열립니다.',
    },
    { ...pubAreas, section: '분류' },
    pubScope,
  ],
  defaults: () => ({ id: '', type: 'journal', title: '', venue: '', date: '', year: null, sortKey: null, authors: '', doi: undefined, url: undefined, lang: 'ko', areas: [], scope: 'professor', abstract: undefined, abstractImage: undefined }),
  thumb: () => null,
  listThumb: 'none',
  previewWide: true,
};

const books: CollectionDef = {
  ...pubCommon,
  id: 'books',
  label: '저역서',
  itemLabel: '저역서',
  description: 'Books 페이지에 표지 카드로 나옵니다. 새 책은 b 번호가 자동으로 붙습니다.',
  autoKey: { prefix: 'b', width: 2 },
  match: (item) => item.type === 'book',
  publicPath: () => '/books',
  fields: [
    { name: 'title', label: '제목', type: 'text', required: true },
    pubAuthors('홍길동 지음, 이현우 공역'),
    { name: 'venue', label: '출판사', type: 'text', required: true, placeholder: '학지사' },
    pubDate,
    pubLang,
    {
      name: 'cover',
      label: '표지',
      type: 'image',
      image: { mode: 'fit', width: 900, height: 1350, dir: 'books' },
      section: '표지·구매',
      help: '확인된 실제 표지만 올립니다. 없으면 중립 자리표시로 나옵니다.',
    },
    { name: 'coverAlt', label: '표지 설명', type: 'text', placeholder: '『책 제목』 표지 — 출판사, 2026', help: '화면 낭독기가 읽는 한 줄 설명입니다.' },
    { name: 'purchaseUrl', label: '구매 페이지 주소', type: 'text', placeholder: 'https://product.kyobobook.co.kr/…', pattern: URL_PATTERN, patternHint: 'https:// 로 시작하는 주소를 적어 주세요.', help: '있으면 표지를 누를 때 이 서점 페이지가 새 창으로 열립니다.' },
    { ...pubAreas, section: '분류' },
    pubScope,
  ],
  defaults: () => ({ id: '', type: 'book', title: '', venue: '', date: '', year: null, sortKey: null, authors: '', lang: 'ko', areas: [], scope: 'professor', cover: undefined, coverAlt: undefined, purchaseUrl: undefined }),
  thumb: (item) => (typeof item.cover === 'string' ? item.cover : null),
};

const conferences: CollectionDef = {
  ...pubCommon,
  id: 'conferences',
  label: '학술발표',
  itemLabel: '학술발표',
  description: 'Publications 의 학술발표(학술대회 발표)입니다. 새 발표는 c 번호가 자동으로 붙습니다.',
  autoKey: { prefix: 'c', width: 2 },
  match: (item) => item.type === 'conference',
  publicPath: () => '/publications',
  fields: [
    { name: 'title', label: '제목', type: 'text', required: true },
    pubAuthors('발표자, 공동발표자'),
    { name: 'venue', label: '학회·학술대회', type: 'text', required: true, placeholder: 'AECT' },
    pubDate,
    pubLang,
    { ...pubAreas, section: '분류' },
    pubScope,
  ],
  defaults: () => ({ id: '', type: 'conference', title: '', venue: '', date: '', year: null, sortKey: null, authors: undefined, lang: 'ko', areas: [], scope: 'professor' }),
  thumb: () => null,
  listThumb: 'none',
  previewWide: true,
};

/* --------------------------------------------------------------- 연구 과제 */

const PROJECT_POINT = /^\d{4}(\.\d{2})?$/;
const pointKey = (v: unknown) => {
  const m = str(v).match(/^(\d{4})(?:\.(\d{2}))?$/);
  return m ? `${m[1]}${m[2] ?? '00'}` : '';
};

const projects: CollectionDef = {
  id: 'projects',
  group: '연구 실적',
  label: '연구 과제',
  itemLabel: '연구 과제',
  description: 'Projects 페이지와 Research 의 과제 목록에 나옵니다. 새 과제는 p 번호가 자동으로 붙고, 구성원 프로필의 ‘참여 연구 프로젝트’에서 고를 수 있게 됩니다.',
  file: 'content/data/projects.json',
  arrayKey: 'items',
  keyField: 'id',
  autoKey: { prefix: 'p', width: 2 },
  uniqueAcross: ['items'],
  newPosition: 'start',
  orderable: false,
  publicPath: (key) => `/projects${key ? `#${key}` : ''}`,
  fields: [
    { name: 'title', label: '과제명', type: 'text', required: true },
    { name: 'funder', label: '지원 기관', type: 'text', required: true, placeholder: '한국연구재단' },
    { name: 'start', label: '시작', type: 'text', required: true, placeholder: '2026.03', pattern: PROJECT_POINT, patternHint: '2026 또는 2026.03 형식으로 적어 주세요.', half: true },
    { name: 'end', label: '종료', type: 'text', required: true, placeholder: '2027.02', pattern: PROJECT_POINT, patternHint: '2027 또는 2027.02 형식으로 적어 주세요.', half: true },
    {
      name: 'status',
      label: '진행 상태',
      type: 'select',
      required: true,
      options: [
        { value: 'ongoing', label: '진행 중' },
        { value: 'completed', label: '완료' },
      ],
      half: true,
    },
    { name: 'scope', label: '과제 구분', type: 'select', required: true, options: scopeOptions, half: true },
    { name: 'areas', label: '연구 분야', type: 'areas' },
    { name: 'summary', label: '과제 소개', type: 'textarea', rows: 3, empty: 'null', help: '한두 문장. 비우면 과제명·기간·기관만 나옵니다.', section: '소개·이미지' },
    {
      name: 'media',
      label: '대표 이미지',
      type: 'image',
      empty: 'null',
      image: { mode: 'crop', width: 1200, height: 900, dir: 'projects' },
      help: '가로 4:3 비율로 잘라 저장합니다. 없으면 자리표시로 나옵니다.',
    },
  ],
  defaults: () => ({ id: '', title: '', funder: '', period: '', start: '', end: '', startYear: null, endYear: null, status: 'ongoing', areas: [], scope: 'professor', summary: null, media: null }),
  derive: (item) => {
    const start = str(item.start).trim();
    const end = str(item.end).trim();
    const y = (v: string) => (/^\d{4}/.test(v) ? Number(v.slice(0, 4)) : null);
    return { ...item, period: start && end ? `${start}~${end}` : start || end, startYear: y(start), endYear: y(end) };
  },
  validate: (item): Record<string, string> => {
    const a = pointKey(item.start);
    const b = pointKey(item.end);
    return a && b && a > b ? { end: '종료 시점이 시작보다 빠릅니다.' } : {};
  },
  suggestKey: () => '',
  title: (item) => str(item.title) || '(과제명 없음)',
  meta: (item) => [str(item.period), str(item.funder), item.status === 'ongoing' ? '진행 중' : ''].filter(Boolean).join(' · '),
  thumb: (item) => (typeof item.media === 'string' ? item.media : null),
  listThumb: 'landscape',
  previewWide: true,
  sort: (a, b) => pointKey(b.start).localeCompare(pointKey(a.start)) || str(b.id).localeCompare(str(a.id), undefined, { numeric: true }),
};

/* ------------------------------------------------------------------ 목록 */

export const collections: Record<CollectionId, CollectionDef> = { news, members, alumni, journals, books, conferences, projects };
export const collectionList: CollectionDef[] = [news, members, alumni, journals, books, conferences, projects];

/** 메뉴 묶음 순서대로 */
export const collectionGroups: { title: string; items: CollectionDef[] }[] = Array.from(new Set(collectionList.map((c) => c.group))).map((title) => ({
  title,
  items: collectionList.filter((c) => c.group === title),
}));

export function isCollectionId(v: string): v is CollectionId {
  return v in collections;
}

/** 이 메뉴의 항목을 옮겨 갈 수 있는 메뉴들 (구성원 → 졸업생) */
export function moveTargets(id: CollectionId): CollectionDef[] {
  return collectionList.filter((c) => c.moveFrom?.collection === id);
}

/** CMS 가 읽고 쓰는 데이터 파일 (중복 없이) */
export const dataFiles = Array.from(new Set(collectionList.map((c) => c.file)));

/** 참여 프로젝트 선택지를 읽는 파일 */
export const PROJECTS_FILE = 'content/data/projects.json';

/**
 * 파일 단위로 맞춰야 하는 값 — 항목을 바꾼 뒤 저장 직전에 다시 계산합니다.
 * publications.json 의 counts(종류별 건수)는 scripts/check-data.mjs 가 실제 항목 수와 같은지 검사합니다.
 */
export const fileHooks: Record<string, (data: Record<string, unknown>) => void> = {
  [PUBLICATIONS_FILE]: (data) => {
    const counts = (data.counts && typeof data.counts === 'object' ? data.counts : {}) as Record<string, number>;
    for (const t of ['journal', 'book', 'conference']) counts[t] = 0;
    for (const it of itemsOf(data, 'items')) if (typeof it.type === 'string' && it.type in counts) counts[it.type] += 1;
    data.counts = counts;
  },
};

/** CMS 가 사진을 올리고 지울 수 있는 경로 — 이 밖의 파일은 절대 건드리지 않습니다 */
export const ASSET_PATH = /^public\/images\/(people|news|books|abstracts|projects)\/[a-z0-9][a-z0-9-]*\.(jpg|jpeg|png|webp)$/;

/** 화면 경로("/images/people/a.jpg") ↔ 저장소 경로("public/images/people/a.jpg") */
export const toRepoPath = (publicPath: string) => `public${publicPath}`;
export const toPublicPath = (repoPath: string) => repoPath.replace(/^public/, '');

/** 데이터 파일 안의 배열 */
export function itemsOf(data: unknown, arrayKey: string): Item[] {
  const arr = (data as Record<string, unknown> | null)?.[arrayKey];
  return Array.isArray(arr) ? (arr as Item[]) : [];
}

/** 항목의 키 — 주소(slug)가 있으면 주소, 없으면 번호(id) */
export function keyOf(item: Item): string {
  if (typeof item.slug === 'string') return item.slug;
  return typeof item.id === 'string' ? item.id : '';
}

/** 이 컬렉션에 속한 항목만 (한 배열을 여러 컬렉션이 나눠 쓸 때) */
export function collectionItems(data: unknown, def: CollectionDef): Item[] {
  const all = itemsOf(data, def.arrayKey);
  return def.match ? all.filter(def.match) : all;
}

/** 다음 자동 번호 — 같은 배열에서 그 접두어로 쓰인 가장 큰 번호 + 1 (예: j62 → j63) */
export function nextKey(def: CollectionDef, data: unknown): string {
  if (!def.autoKey) return '';
  const { prefix, width } = def.autoKey;
  const re = new RegExp(`^${prefix}(\\d+)$`);
  let max = 0;
  for (const it of itemsOf(data, def.arrayKey)) {
    const m = keyOf(it).match(re);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
}
