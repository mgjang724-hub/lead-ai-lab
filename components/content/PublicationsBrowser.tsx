'use client';
/**
 * PublicationsBrowser — URL 쿼리(?type=journal,conference&q=…&order=oldest)를 초기 상태로 읽어 PublicationList 를 렌더.
 * 연구 분야 필터와 연도별 그룹은 연구실 요청(2026-11-06)으로 없앴습니다(행의 분야 태그·유형 칩·검색·정렬은 그대로).
 * 정적 내보내기에서는 useSearchParams 가 Suspense 경계를 요구하므로 페이지에서 감쌉니다.
 */
import { useSearchParams } from 'next/navigation';
import type { Publication, PublicationType } from '@/content/types';
import { PublicationList, type PublicationListState } from './Publications';

const TYPES: PublicationType[] = ['journal', 'book', 'conference'];

function Inner({ items }: { items: Publication[] }) {
  const sp = useSearchParams();
  const types = (sp.get('type') || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is PublicationType => (TYPES as string[]).includes(s));
  const initial: Partial<PublicationListState> = {
    types,
    q: sp.get('q') || '',
    order: sp.get('order') === 'oldest' ? 'oldest' : 'newest',
  };
  const key = `${types.join(',')}|${initial.q}|${initial.order}`;
  return <PublicationList key={key} items={items} initial={initial} syncUrl grouped={false} />;
}

export function PublicationsBrowser({ items, noParams }: { items: Publication[]; noParams?: boolean }) {
  if (noParams) return <PublicationList items={items} grouped={false} />;
  return <Inner items={items} />;
}
