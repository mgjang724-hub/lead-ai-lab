import type { SearchEntry } from '@/components/nav/SiteSearch';
import { getMembers, getNews, getProjects, getPublications, getResearchAreas, publicationTypeLabels } from './content';

/** 헤더 검색 인덱스 — 서버에서 생성해 클라이언트로 전달 (제목·키워드만 포함) */
export function buildSearchIndex(): SearchEntry[] {
  const out: SearchEntry[] = [];
  for (const a of getResearchAreas()) {
    out.push({ group: 'Research', title: `${a.title} · ${a.ko}`, href: `/research/${a.slug}`, text: `${a.title} ${a.ko} ${a.keywords.join(' ')}`.toLowerCase() });
  }
  for (const p of getProjects()) {
    out.push({ group: 'Project', title: p.title, href: `/projects#${p.id}`, text: `${p.title} ${p.funder}`.toLowerCase() });
  }
  for (const p of getPublications()) {
    /* 저역서는 /books 카드 목록으로, 논문·학술발표는 /publications 검색으로 */
    const href = p.type === 'book' ? '/books' : `/publications?q=${encodeURIComponent(p.title.slice(0, 24))}`;
    out.push({ group: publicationTypeLabels[p.type].en, title: p.title, href, text: `${p.title} ${p.authors ?? ''} ${p.venue}`.toLowerCase() });
  }
  for (const n of getNews()) {
    out.push({ group: 'News', title: n.title, href: `/news/${n.slug}`, text: n.title.toLowerCase() });
  }
  for (const m of getMembers()) {
    out.push({ group: 'People', title: m.name, href: `/people/${m.slug}`, text: `${m.name} ${m.nameEn ?? ''} ${m.interests.join(' ')}`.toLowerCase() });
  }
  return out;
}
