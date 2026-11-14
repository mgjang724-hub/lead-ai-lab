'use client';
/** 미리보기 — 공개 사이트와 같은 부품(카드·목록 한 줄)으로 그립니다. 링크는 눌리지 않게 막아 둡니다 */
import type { ReactNode } from 'react';
import type { Alumnus, Member, NewsItem, Project, Publication } from '@/content/types';
import type { CollectionId, Item } from '@/lib/cms/collections';
import { NewsCard } from '@/components/content/News';
import { MemberProfile } from '@/components/content/People';
import { AlumniList } from '@/components/content/Alumni';
import { PublicationItem } from '@/components/content/Publications';
import { BookGrid } from '@/components/content/Books';
import { ProjectShowcase } from '@/components/content/Projects';

export function ItemPreview({ collection, item, images }: { collection: CollectionId; item: Item; images: Record<string, string> }) {
  const resolve = (v: unknown): string | null => (typeof v === 'string' && v ? (images[v] ?? (v.startsWith('/') || v.startsWith('data:') ? v : null)) : null);
  const text = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() ? v : fallback);
  let body: ReactNode = null;
  switch (collection) {
    case 'news':
      body = <NewsCard item={{ ...item, title: text(item.title, '제목'), image: resolve(item.image) } as unknown as NewsItem} layout="card" />;
      break;
    case 'members':
      body = <MemberProfile member={{ ...item, name: text(item.name, '이름'), interests: Array.isArray(item.interests) ? item.interests : [], photo: resolve(item.photo) } as unknown as Member} />;
      break;
    case 'alumni':
      body = <AlumniList items={[{ ...item, name: text(item.name, '이름'), photo: resolve(item.photo) } as unknown as Alumnus]} />;
      break;
    case 'journals':
    case 'conferences': {
      const p = { ...item, id: text(item.id, 'new'), title: text(item.title, '제목'), venue: text(item.venue, ''), areas: Array.isArray(item.areas) ? item.areas : [], abstractImage: resolve(item.abstractImage) ?? undefined } as unknown as Publication;
      body = (
        <ul role="list" className="lab-pubs__ul">
          <PublicationItem item={p} dataKey="cms-preview" />
        </ul>
      );
      break;
    }
    case 'books':
      body = <BookGrid items={[{ ...item, id: text(item.id, 'new'), title: text(item.title, '제목'), cover: resolve(item.cover) ?? undefined } as unknown as Publication]} />;
      break;
    case 'projects':
      body = <ProjectShowcase items={[{ ...item, id: text(item.id, 'new'), title: text(item.title, '과제명'), areas: Array.isArray(item.areas) ? item.areas : [], media: resolve(item.media) } as unknown as Project]} />;
      break;
  }
  return (
    <div className={`cms-preview cms-preview--${collection}`} inert>
      {body}
    </div>
  );
}
