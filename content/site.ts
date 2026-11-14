/**
 * 사이트 전역 설정 — 연구실 정체성·내비게이션·연락처.
 * 대괄호 [ ] 로 묶인 값은 확정 전 placeholder 입니다. 확정되면 그대로 바꿔 넣으세요.
 */

import { brand, brandApproved } from './brand';

export const site = {
  /** 연구실 명칭(국문) — 브랜드 제안안(content/data/brand.json). 대학 공식 승인 전이므로 공식 기관 명칭(university/department)과 구분해 표기 */
  labName: brand.nameKo,
  /** 연구실 명칭(영문) — 브랜드 제안안 */
  labNameEn: brand.name,
  /** 브랜드가 대학의 공식 승인을 받았는지 (brand.json meta.status) */
  labNameConfirmed: brandApproved,
  brandSub: brand.meaning,
  university: '상명대학교',
  universityEn: 'Sangmyung University',
  department: '교육학과(서울)',
  departmentEn: 'Department of Education, Seoul Campus',
  major: '교육공학 / HRD',
  majorEn: 'Educational Technology & Human Resource Development',
  address: {
    building: '중앙교수회관(S관)',
    room: 'S214',
    /** 도로명 주소 — 문서에 없어 확인 후 입력 */
    street: null as string | null,
  },
  phone: '02-2287-5456',
  phoneHref: 'tel:+82-2-2287-5456',
  /** 문의 이메일 — Contact 문의 폼이 이 주소로 방문자의 메일 앱을 엽니다.
   *  지금 값은 2026-11-15 연구실 요청으로 넣은 예시(가상) 주소입니다. example.com 은 문서·예시용으로 예약된 도메인이라
   *  이 주소로 보낸 메일은 누구에게도 배달되지 않습니다. 실제 주소가 정해지면 이 값을 바꾸고 emailIsSample 을 false 로 바꾸세요.
   *  null 이면 메일 주소 표시와 메일 보내기가 모두 숨고, 폼은 입력 내용을 정리해 보여 주기만 합니다. */
  email: 'leadailab@example.com' as string | null,
  /** true 면 화면에서 주소 옆에 '예시' 배지를 붙이고, 푸터에는 주소를 싣지 않습니다 */
  emailIsSample: true as boolean,
  /** 배포 URL — 메타데이터·사이트맵에 사용. 배포 시 NEXT_PUBLIC_SITE_URL 로 덮어씀 */
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://lab.example.ac.kr',
  /** 첨부 실적 문서 기준일 */
  dataAsOf: '2026-11-05',
  description: `${brand.name}(${brand.nameKo}) — 상명대학교 교육학과 이현우 교수 연구실. ${brand.sloganKo} ${brand.intro[0]}`,
} as const;

export interface NavChild {
  label: string;
  ko?: string;
  href: string;
}
export interface NavItem {
  id: string;
  label: string;
  href: string;
  children?: NavChild[];
}

/** 상단 내비게이션 — 순서 고정 (Home · About · Research · People · Books · News · Contact).
 *  About 은 지도교수 소개가 먼저(Professor › Overview › Vision), People 은 구성원·졸업생만.
 *  Research 아래에 논문(Publications)·연구 과제(Projects)·학술발표(Presentations)를 두고, 저역서(Books)는 별도 메뉴·별도 페이지(/books).
 *  Research(/research)는 다섯 분야 설명 + 분야별 관련 연구만 보여 주는 Research Areas 페이지입니다(2026-11-09).
 *  children 은 데스크톱 드롭다운과 모바일 메뉴의 하위 바로가기에 함께 쓰입니다. */
export const nav: NavItem[] = [
  { id: 'home', label: 'Home', href: '/' },
  {
    id: 'about',
    label: 'About',
    href: '/about',
    children: [
      { label: 'Professor', ko: '지도교수', href: '/about#professor' },
      { label: 'Overview', ko: '연구실 소개', href: '/about#overview' },
      { label: 'Vision', ko: '연구 비전', href: '/about#vision' },
    ],
  },
  {
    id: 'research',
    label: 'Research',
    href: '/research',
    children: [
      { label: 'Research Areas', ko: '주요 연구 분야', href: '/research' },
      { label: 'Publications', ko: '논문', href: '/publications?type=journal' },
      { label: 'Projects', ko: '연구 과제', href: '/projects' },
      { label: 'Presentations', ko: '학술발표', href: '/publications?type=conference' },
    ],
  },
  {
    id: 'people',
    label: 'People',
    href: '/people',
    children: [
      { label: 'Members', ko: '재학생·연구원', href: '/people#members' },
      { label: 'Alumni', ko: '졸업생', href: '/people#alumni' },
    ],
  },
  { id: 'books', label: 'Books', href: '/books' },
  { id: 'news', label: 'News', href: '/news' },
  { id: 'contact', label: 'Contact', href: '/contact' },
];

export const navLabels: Record<string, string> = Object.fromEntries(nav.map((n) => [n.id, n.label]));

/** 연구 키워드 마키(Home) — 브랜드 연구 분야(brand.json fields) + 기존 연구 분야의 핵심어 */
export const keywordBand = [...brand.fields, 'Teacher Competency', 'Generative AI'];

/** 연구실 참여 안내 (Contact) — 일반 안내. 지원 시기·서류 등 세부 요건은 연구실이 확정하면 교체 */
export const joinFaq = [
  {
    title: '대학원 진학을 희망합니다. 무엇을 준비해야 하나요?',
    content: '상명대학교 일반대학원 교육학과 모집 요강에서 지원 시기와 필요 서류를 확인하고, 지원 전에 연구실로 연락해 사전 면담을 신청해 주세요.',
  },
  {
    title: '연구실 면담은 어떻게 신청하나요?',
    content: '연구실 전화(02-2287-5456)로 면담 가능 시간을 문의해 주세요.',
  },
  {
    title: '공동연구·자문 제안은 어디로 보내나요?',
    content: '제안 개요(목적·기간·역할)를 정리해 연구실로 연락해 주세요.',
  },
];
