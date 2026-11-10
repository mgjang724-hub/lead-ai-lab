import type { Metadata } from 'next';
import '@/styles/admin.css';
import { CmsApp } from '@/components/cms/CmsApp';

/**
 * 관리자 화면(CMS) — 소식·구성원·졸업생을 고쳐 GitHub 저장소에 저장합니다. 사용법·설정은 docs/CMS-설정-안내.md.
 * 검색엔진에 나오지 않게 하고, 사이트 머리말·바닥글은 components/nav/SiteChrome.tsx 가 이 경로에서 숨깁니다.
 */
export const metadata: Metadata = {
  title: '홈페이지 관리',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function AdminPage() {
  return <CmsApp />;
}
