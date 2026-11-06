import type { Metadata } from 'next';
import { getNews } from '@/lib/content';
import { PageHero } from '@/components/content/Headers';
import { NewsBrowser } from '@/components/content/News';

export const metadata: Metadata = {
  title: 'News',
  description: '연구실 공지, 학술대회, 연구 성과, 구성원 소식.',
  alternates: { canonical: '/news' },
};

export default function NewsPage() {
  const items = getNews();
  return (
    <>
      <PageHero index="06" eyebrow="News" lines={['News']} ko="연구실 소식" lead="공지, 학술대회, 연구 성과, 수상·선정, 행사, 구성원 소식을 분류별로 모아 봅니다." />
      <section className="lab-sec lab-sec--tight-top lab-container" aria-label="소식 목록">
        <NewsBrowser items={items} />
      </section>
    </>
  );
}
