import type { Metadata } from 'next';
import { getPublicationsByType } from '@/lib/content';
import { PageHero } from '@/components/content/Headers';
import { BookGrid } from '@/components/content/Books';

/** Books — 저역서만 표지 카드로 나열. 논문·학술발표는 /publications, 연구 과제는 /projects 에 둡니다. */
export const metadata: Metadata = {
  title: 'Books',
  description: '저역서 목록 — 제목·출판사·출간일 기준, 최신 출간순.',
  alternates: { canonical: '/books' },
};

export default function BooksPage() {
  const books = getPublicationsByType('book');
  return (
    <>
      <PageHero
        index="05"
        eyebrow="Books"
        lines={['Books']}
        ko="저역서"
        lead="지도교수가 저술하고 번역한 책을 최신 출간순으로 소개합니다."
      />
      <section className="lab-sec lab-sec--tight-top lab-container" aria-label="저역서 목록">
        <BookGrid items={books} />
      </section>
    </>
  );
}
