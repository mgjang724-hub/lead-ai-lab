import type { AreaId, EducationEntry } from './types';

/**
 * 지도교수 프로필 — 「이현우 교수 논문·실적 목록.docx」(2026-11-05) 기본 정보 기준.
 * 문서에 없는 항목(영문 이름, 이메일, 학사·석사 학력, 소개문)은 비워 두었습니다.
 */
export const professor = {
  slug: 'lee-hyunwoo',
  name: '이현우',
  /** 영문 표기 — 문서에 없어 확인 후 입력 */
  nameEn: null as string | null,
  /** 화면 표기는 '교수'(2026-11-06 연구실 요청: '이현우 정교수'가 아니라 '이현우 교수'). 임용 직위 기록은 career.json 에 그대로 둠 */
  title: '교수',
  titleEn: 'Professor',
  affiliation: '상명대학교 교육학과(서울)',
  affiliationEn: 'Department of Education, Sangmyung University (Seoul)',
  major: '교육공학 / HRD',
  education: [
    {
      degree: '박사',
      institution: 'Pennsylvania State University',
      program: 'Instructional Systems',
      detail: '세부전공: Instructional Systems',
      date: '2008.08',
    },
  ] as EducationEntry[],
  office: '중앙교수회관(S관) S214',
  phone: '02-2287-5456',
  email: null as string | null,
  photo: '/images/professor-lee-hyunwoo.png',
  photoAlt: '이현우 교수',
  /** 연구 관심 분야 — 임시 분류된 연구 분야 id (research-areas.ts) */
  interestAreas: [
    'ai-in-education',
    'learning-analytics',
    'instructional-design',
    'teacher-competency',
    'hrd',
  ] as AreaId[],
  /** 소개문 — 연구실이 확정 문안을 주기 전까지 null (화면에서는 소개문 단락을 생략). 임의의 문구를 만들지 않습니다 */
  bio: null as string | null,
  links: [] as { label: string; href: string }[],
};
