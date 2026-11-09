import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { researchAreas } from '@/content/research-areas';
import { getAreaBySlug, getProjectsByArea, getPublicationsByArea, publicationTypeLabels } from '@/lib/content';
import { PageHero, SectionHeader } from '@/components/content/Headers';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { MediaFrame } from '@/components/motion/MediaFrame';
import { Reveal } from '@/components/motion/Reveal';
import { PublicationList } from '@/components/content/Publications';
import { TextLink } from '@/components/ui/Button';
import { TransitionLink } from '@/components/nav/TransitionLink';

export function generateStaticParams() {
  return researchAreas.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) return {};
  return { title: `${area.title} — Research`, description: area.summary, alternates: { canonical: `/research/${area.slug}` } };
}

export default async function ResearchAreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) notFound();
  const pubs = getPublicationsByArea(area.id);
  const projects = getProjectsByArea(area.id);
  const idx = researchAreas.findIndex((a) => a.id === area.id);
  const prev = researchAreas[(idx - 1 + researchAreas.length) % researchAreas.length];
  const next = researchAreas[(idx + 1) % researchAreas.length];
  const byType = (['journal', 'book', 'conference'] as const).map((t) => ({ t, n: pubs.filter((p) => p.type === t).length })).filter((x) => x.n);

  return (
    <>
      <PageHero index={`0${idx + 1}`} eyebrow="Research Area" lines={area.title.split(' & ').length > 1 ? area.title.split(' & ').map((s, i) => (i ? `& ${s}` : s)) : [area.title]} ko={area.ko} lead={area.summary}>
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Research Areas', href: '/research' }, { label: area.title }]} />
      </PageHero>

      <section className="lab-sec lab-sec--tight-top lab-container lab-detail" aria-label="연구 분야 상세">
        <div className="lab-detail__main">
          {area.image ? <MediaFrame ratio="16/10" src={area.image} alt={area.title} /> : null}
          <Reveal variant="stagger">
            <p className="lab-t-lead">{area.description}</p>
            <div className="lab-rcard__kw" style={{ marginTop: 24 }}>
              {area.keywords.map((k) => (
                <span key={k} className="lab-tag">
                  {k}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
        <aside className="lab-detail__side">
          <Reveal variant="stagger">
            <p className="lab-t-label">In numbers</p>
            <dl className="lab-dl">
              {byType.map((x) => (
                <span key={x.t} style={{ display: 'contents' }}>
                  <dt>{publicationTypeLabels[x.t].en}</dt>
                  <dd>{x.n}</dd>
                </span>
              ))}
              <dt>Projects</dt>
              <dd>{projects.length}</dd>
            </dl>
          </Reveal>
          {projects.length ? (
            <Reveal variant="stagger">
              <p className="lab-t-label">Related projects</p>
              <ul className="lab-sidelist">
                {projects.map((p) => (
                  <li key={p.id}>
                    <TransitionLink href={`/projects#${p.id}`} label="Projects">
                      <span className="lab-t-body-s">{p.title}</span>
                      <span className="lab-t-index">{p.startYear}</span>
                    </TransitionLink>
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}
        </aside>
      </section>

      <section className="lab-sec lab-sec--subtle" aria-labelledby="area-pubs">
        <div className="lab-container">
          <SectionHeader
            id="area-pubs"
            index="02"
            eyebrow="Archive"
            lines={['Research archive.']}
            ko="관련 연구 아카이브"
          />
          {pubs.length ? (
            <PublicationList compact items={pubs} search={false} grouped={false} />
          ) : (
            <div className="lab-empty">
              <p className="lab-t-h4">아직 분류된 실적이 없습니다</p>
            </div>
          )}
        </div>
      </section>

      <section className="lab-sec lab-container" aria-label="다른 연구 분야">
        <div className="lab-article__nav">
          <TextLink href={`/research/${prev.slug}`} variant="standalone">
            ← {prev.title}
          </TextLink>
          <TextLink href={`/research/${next.slug}`} variant="standalone">
            {next.title}
          </TextLink>
        </div>
      </section>
    </>
  );
}
