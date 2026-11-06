/**
 * Brand Configuration — 연구실 브랜드(LEAD AI Lab)의 단일 출처.
 *
 * 편집 가능한 문구(명칭·슬로건·소개문·브랜드 축)는 content/data/brand.json 에 있고,
 * 이 모듈은 타입과 파생값(워드마크 분해 등)만 제공합니다.
 * 로고의 형태·토큰은 components/brand/Logo.tsx 와 styles/site.css 가 담당합니다(디자인 시스템 영역).
 *
 * 상태: brand.meta.status === 'proposal' — 대학 공식 승인 전 제안안. 공식 기관 명칭(site.university 등)과 구분해 표기합니다.
 */
import data from './data/brand.json';
import type { AreaId } from './types';

export interface BrandPillar {
  key: string;
  label: string;
  ko: string;
  /** 초안 문구 — 연구실 공식 비전 아님 */
  text: string;
  /** 연결되는 기존 연구 분야 (재분류가 아니라 안내 링크용) */
  areas: AreaId[];
}

export interface Brand {
  meta: { status: 'proposal' | 'approved'; note: string; updated: string };
  /** 공식 영문 브랜드명 */
  name: string;
  /** 로고 표기 */
  wordmark: string;
  /** 축약형 로고 표기 */
  shortWordmark: string;
  acronym: string;
  /** LEAD 의 의미 */
  meaning: string;
  /** 국문 브랜드명 */
  nameKo: string;
  affiliation: string;
  fields: string[];
  tagline: string;
  /** 큰 타이포에서 줄바꿈할 때의 태그라인 */
  taglineLines: string[];
  secondary: string;
  sloganKo: string;
  /** 연구실 소개 문구(초안) — 문단 배열 */
  intro: string[];
  pillars: BrandPillar[];
}

export const brand = data as Brand;

/** 브랜드가 대학의 공식 승인을 받았는지 — 승인 전에는 안내 문구를 함께 표시 */
export const brandApproved = brand.meta.status === 'approved';

/** 워드마크를 시각 구분 단위로 분해: "LEAD AI LAB." → { lead: 'LEAD', ai: 'AI', lab: 'LAB.' } — 로고 컴포넌트와 Home 히어로가 공유 */
export const wordmarkParts = (() => {
  const [lead = 'LEAD', ai = 'AI', ...rest] = brand.wordmark.split(' ');
  return { lead, ai, lab: rest.join(' ') || 'LAB.' };
})();
