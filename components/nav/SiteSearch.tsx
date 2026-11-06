'use client';
/**
 * SiteSearch — 헤더 검색 다이얼로그. 연구 분야·논문·프로젝트·소식·구성원을 제목으로 검색해 해당 페이지로 이동.
 * 인덱스는 서버 레이아웃에서 만들어 props 로 전달됩니다 (lib/search.ts).
 */
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { SearchField, type SearchResult } from '@/components/ui/Controls';
import { usePageTransition } from './TransitionProvider';
import { labelForHref } from './TransitionLink';

export interface SearchEntry extends SearchResult {
  href: string;
  /** 소문자 검색용 텍스트 */
  text: string;
}

export function SiteSearch({ open, onClose, index }: { open: boolean; onClose: () => void; index: SearchEntry[] }) {
  const { go } = usePageTransition();
  const router = useRouter();
  const results = (q: string): SearchEntry[] => {
    const s = q.toLowerCase().trim();
    if (!s) return [];
    return index.filter((e) => e.text.includes(s)).slice(0, 8);
  };
  return (
    <Modal open={open} onClose={onClose} title="Search" variant="dialog">
      <SearchField
        label="사이트 검색"
        placeholder="연구 분야, 논문, 프로젝트, 소식 검색"
        results={results}
        autoFocus
        onSelect={(r) => {
          const e = r as SearchEntry;
          onClose();
          if (e.href.startsWith('/') && !e.href.includes('?')) go(e.href, labelForHref(e.href));
          else router.push(e.href);
        }}
      />
    </Modal>
  );
}
