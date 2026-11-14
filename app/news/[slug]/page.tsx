import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { formatDate, getNews, getNewsBySlug, newsCategoryLabels } from '@/lib/content';
import { PageHero } from '@/components/content/Headers';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { MediaFrame } from '@/components/motion/MediaFrame';
import { Reveal } from '@/components/motion/Reveal';
import { NewsCard } from '@/components/content/News';
import { Button, TextLink } from '@/components/ui/Button';

export function generateStaticParams() {
  return getNews().map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const n = getNewsBySlug(slug);
  if (!n) return {};
  /* 예시 소식은 화면에 '예시' 배지로 표시하되 검색 색인에서는 제외 */
  if (n.isSample) return { title: `${n.title} — News (예시)`, description: n.excerpt || n.title, robots: { index: false, follow: true } };
  return { title: `${n.title} — News`, description: n.excerpt || n.title, alternates: { canonical: `/news/${n.slug}` }, openGraph: { type: 'article', title: n.title, description: n.excerpt } };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const all = getNews();
  const idx = all.findIndex((n) => n.slug === slug);
  const item = all[idx];
  if (!item) notFound();
  const cat = newsCategoryLabels[item.category];
  const prev = all[idx + 1];
  const next = all[idx - 1];
  const related = all.filter((n) => n.category === item.category && n.slug !== item.slug).slice(0, 2);
  return (
    <>
      {/* 글 제목이 이 페이지의 가장 큰 제목입니다. 분류는 위 라벨에, 날짜는 제목 아래에 한 번씩만(2026-11-15) */}
      <PageHero index="06" eyebrow={cat.en} lines={[item.title]} titleSize="text" lead={item.excerpt}>
        <p className="lab-article__meta">
          <time className="lab-t-index" dateTime={item.date}>
            {formatDate(item.date)}
          </time>
          <span lang="ko">{cat.ko}</span>
          {item.isSample ? <span className="lab-badge lab-badge--sample">예시</span> : null}
        </p>
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'News', href: '/news' }, { label: item.title }]} />
      </PageHero>
      <article className="lab-sec lab-sec--tight-top lab-container lab-article" aria-label={item.title}>
        <div className="lab-article__body">
          {/* 사진은 있을 때만 — 없으면 본문이 바로 시작합니다 */}
          {item.image ? <MediaFrame ratio="16/9" src={item.image} alt={item.title} trigger="mount" /> : null}
          <Reveal variant="stagger">
            {(item.body || [item.excerpt || '']).map((para, i) => (
              <p key={i} className="lab-t-body-l">
                {para}
              </p>
            ))}
          </Reveal>
          {item.link ? (
            <Button variant="secondary" href={item.link.href} icon="arrow-right">
              {item.link.label}
            </Button>
          ) : null}
        </div>
        <aside className="lab-article__side">
          {related.length ? (
            <Reveal variant="stagger">
              <p className="lab-t-label" style={{ color: 'var(--text-tertiary)', marginBottom: 20 }}>
                Related
              </p>
              <div className="lab-newslist">
                {related.map((n) => (
                  <NewsCard key={n.slug} item={n} size="s" />
                ))}
              </div>
            </Reveal>
          ) : null}
        </aside>
        <div className="lab-article__nav" style={{ gridColumn: '1 / -1' }}>
          {prev ? (
            <TextLink href={`/news/${prev.slug}`} variant="standalone">
              ← 이전 소식
            </TextLink>
          ) : (
            <span />
          )}
          <TextLink href="/news" variant="standalone">
            All news
          </TextLink>
          {next ? (
            <TextLink href={`/news/${next.slug}`} variant="standalone">
              다음 소식
            </TextLink>
          ) : (
            <span />
          )}
        </div>
      </article>
    </>
  );
}
