/**
 * Brand components — 타이포그래피 워드마크(SVG)와 기하 마크.
 *
 * <Wordmark />   "LEAD AI LAB." — LEAD(700) 를 중심으로, AI 는 가는 굵기와 보조색으로 구분, LAB.(600).
 *                tone: 'auto'(상속 색) | 'light'(밝은 배경용) | 'dark'(네이비·어두운 배경용). compact → "LEAD."
 *                Inter(self-hosted) 글리프를 사용하며 textLength 로 박스 폭을 고정해 글꼴 로드 전후 레이아웃이 흔들리지 않습니다.
 * <Mark />       파비콘·축약 마크 — app/icon.svg 와 같은 형태(네이비 사각 + L + 점).
 *
 * 색은 디자인 토큰만 사용합니다(그라디언트·장식 없음). 문구는 content/data/brand.json 에서 옵니다.
 */
import { brand, wordmarkParts } from '@/content/brand';
import { cx } from '@/lib/motion/core';

export interface WordmarkProps {
  tone?: 'auto' | 'light' | 'dark';
  compact?: boolean;
  /** 렌더 높이(px). 폭은 비율로 계산 */
  height?: number;
  className?: string;
  /** 옆에 텍스트 라벨이 따로 있을 때 true — 스크린리더에 중복으로 읽히지 않음 */
  decorative?: boolean;
}

const FULL = { w: 580, h: 100 };
const COMPACT = { w: 270, h: 100 };

export function Wordmark({ tone = 'auto', compact = false, height = 18, className, decorative = false }: WordmarkProps) {
  const text = compact ? brand.shortWordmark : brand.wordmark;
  const box = compact ? COMPACT : FULL;
  return (
    <svg
      className={cx('lab-logo', tone === 'dark' && 'lab-logo--dark', tone === 'light' && 'lab-logo--light', compact && 'lab-logo--compact', className)}
      viewBox={`0 0 ${box.w} ${box.h}`}
      height={height}
      width={Math.round((height * box.w) / box.h)}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : text}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
    >
      {decorative ? null : <title>{text}</title>}
      <text x="0" y="82" fontSize="92" textLength={box.w} lengthAdjust="spacing" className="lab-logo__text">
        <tspan className="lab-logo__lead">{wordmarkParts.lead}</tspan>
        {compact ? (
          <tspan className="lab-logo__lab">.</tspan>
        ) : (
          <>
            <tspan className="lab-logo__ai" dx="24">
              {wordmarkParts.ai}
            </tspan>
            <tspan className="lab-logo__lab" dx="24">
              {wordmarkParts.lab}
            </tspan>
          </>
        )}
      </text>
    </svg>
  );
}

export interface MarkProps {
  size?: number;
  className?: string;
  /** 배경 사각형 없이 글리프만 (어두운 배경 위) */
  bare?: boolean;
  decorative?: boolean;
}

/* Mark — 64×64 격자. L 두 획 + 점(워드마크의 마침표). app/icon.svg 와 동일 */
export function Mark({ size = 32, className, bare = false, decorative = true }: MarkProps) {
  return (
    <svg className={cx('lab-mark', bare && 'lab-mark--bare', className)} viewBox="0 0 64 64" width={size} height={size} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : brand.name} aria-hidden={decorative ? true : undefined} focusable="false">
      {bare ? null : <rect className="lab-mark__bg" width="64" height="64" />}
      <path className="lab-mark__glyph" d="M16 14h9v27h15v9H16z" />
      <rect className="lab-mark__dot" x="44" y="41" width="9" height="9" />
    </svg>
  );
}

/* 워드마크 텍스트 버전 — 히어로 등 HTML 타이포 안에서 같은 위계(LEAD·AI·LAB.)를 재사용할 때 */
export function WordmarkText({ className }: { className?: string }) {
  return (
    <span className={cx('lab-wm', className)}>
      <span className="lab-wm__lead">{wordmarkParts.lead}</span> <span className="lab-wm__ai">{wordmarkParts.ai}</span> <span className="lab-wm__lab">{wordmarkParts.lab}</span>
    </span>
  );
}
