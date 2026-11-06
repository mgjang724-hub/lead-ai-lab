import type { Metadata } from 'next';
import { site } from '@/content/site';
import { brand } from '@/content/brand';
import { areaById } from '@/content/research-areas';
import { professor } from '@/content/profile';
import { getCareer, getCurrentRoles, getResearchAreas } from '@/lib/content';
import { PageHero } from '@/components/content/Headers';
import { MediaFrame } from '@/components/motion/MediaFrame';
import { ScrollText } from '@/components/motion/Kinetic';
import { Reveal } from '@/components/motion/Reveal';
import { Accordion } from '@/components/ui/Controls';
import { Button, TextLink } from '@/components/ui/Button';
import { TransitionLink } from '@/components/nav/TransitionLink';

export const metadata: Metadata = {
  title: 'About',
  description: `${brand.name}(${brand.nameKo}) 소개 — ${brand.meaning}. ${site.university} ${site.department} ${professor.name} 교수 연구실의 지도교수 소개, 연구실 개요, 연구 비전.`,
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const areas = getResearchAreas();
  const career = getCareer().filter((c) => !c.current);
  const current = getCurrentRoles();

  return (
    <>
      <PageHero
        index="02"
        eyebrow="About"
        lines={['Learning Experience,', 'Analytics & Design.']}
        ko={`${brand.name} — ${brand.nameKo}`}
        lead={brand.intro[0]}
      />

      {/* 01 Professor — 지도교수 소개는 이 섹션이 유일한 프로필입니다 (People 은 구성원만). */}
      <section className="lab-sec lab-container lab-prof" aria-labelledby="about-prof" id="professor">
        <MediaFrame ratio="4/5" tone="gray" src={professor.photo} alt={professor.photoAlt} className="lab-prof__img lab-prof__photo" eager sizes="(min-width: 1024px) 30vw, 100vw" />
        <div className="lab-prof__body">
          <p className="lab-t-label">
            <span className="lab-t-index" style={{ marginRight: 14 }}>
              01
            </span>
            Professor
          </p>
          <h2 id="about-prof" className="lab-t-h1">
            {professor.name}
          </h2>
          <p className="lab-t-title-ko">
            {professor.title} · {professor.affiliation}
          </p>
          {professor.bio ? <p className="lab-t-body-l">{professor.bio}</p> : null}
          <dl className="lab-dl lab-prof__dl">
            <dt>Education</dt>
            <dd>
              {professor.education.map((e) => (
                <span key={e.institution} style={{ display: 'block' }}>
                  {e.institution}, {e.degree} ({e.date})
                  <span className="lab-t-caption">{e.detail ?? e.program}</span>
                </span>
              ))}
            </dd>
            <dt>Current roles</dt>
            <dd>
              {current.map((c) => (
                <span key={c.id} style={{ display: 'block' }}>
                  {c.org} {c.role}
                  <span className="lab-t-caption">{c.period}</span>
                </span>
              ))}
            </dd>
            <dt>Career</dt>
            <dd>
              <ul className="lab-rows" style={{ marginTop: 4 }}>
                {career.map((c) => (
                  <li key={c.id}>
                    <span className="lab-rows__k">{c.period}</span>
                    <span className="lab-rows__v">
                      <span>
                        {c.org} {c.role}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </dd>
            <dt>Interests</dt>
            <dd>
              <span className="lab-rcard__kw">
                {professor.interestAreas.map((id) => (
                  <TransitionLink key={id} href={`/research/${areaById[id].slug}`} className="lab-tag" label="Research">
                    {areaById[id].title}
                  </TransitionLink>
                ))}
              </span>
            </dd>
            <dt>Office</dt>
            <dd>
              {professor.office}
              <span className="lab-t-caption">
                <a href={site.phoneHref} style={{ color: 'inherit' }}>
                  {professor.phone}
                </a>
              </span>
            </dd>
            {professor.email ? (
              <>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${professor.email}`}>{professor.email}</a>
                </dd>
              </>
            ) : null}
          </dl>
          <div className="lab-footer__ctas" style={{ marginTop: 8 }}>
            <Button variant="secondary" href="/publications" icon="arrow-right">
              Publications
            </Button>
            <TextLink href="/books" variant="standalone">
              Books
            </TextLink>
          </div>
        </div>
      </section>

      {/* 02 Overview */}
      <section className="lab-sec lab-sec--subtle" aria-labelledby="about-overview" id="overview">
        <div className="lab-container lab-twocol">
          <div className="lab-twocol__sticky">
            <span className="lab-t-index">02</span>
            <h2 id="about-overview" className="lab-t-h1">
              Overview
            </h2>
            <p className="lab-t-title-ko">연구실 소개</p>
          </div>
          <div className="lab-twocol__flow">
            <ScrollText className="lab-t-h3" text={`LEAD stands for ${brand.meaning}: we understand how people learn with data and AI, and design better learning experiences from what we learn.`} />
            <Reveal variant="stagger">
              <dl className="lab-dl">
                <dt>Lab</dt>
                <dd>
                  {brand.name}
                  <span className="lab-t-caption">{brand.nameKo}</span>
                </dd>
                <dt>Focus</dt>
                <dd>
                  {brand.fields.join(' · ')}
                  <span className="lab-t-caption">{brand.meaning}</span>
                </dd>
                <dt>Affiliation</dt>
                <dd>
                  {site.university} {site.department}
                  <span className="lab-t-caption">{site.universityEn} · {site.departmentEn}</span>
                </dd>
                <dt>Field</dt>
                <dd>
                  {site.major}
                  <span className="lab-t-caption">{site.majorEn}</span>
                </dd>
                <dt>Director</dt>
                <dd>
                  {professor.name} {professor.title}
                </dd>
                <dt>Location</dt>
                <dd>
                  {site.address.building} {site.address.room}
                  <span className="lab-t-caption">{site.phone}</span>
                </dd>
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 03 Vision */}
      <section className="lab-sec" aria-labelledby="about-vision" id="vision">
        <div className="lab-container lab-twocol">
          <div className="lab-twocol__sticky">
            <span className="lab-t-index">03</span>
            <h2 id="about-vision" className="lab-t-h1">
              Vision
            </h2>
            <p className="lab-t-title-ko">연구 비전</p>
          </div>
          <div className="lab-twocol__flow">
            <ScrollText className="lab-t-h3" text="We start from the learner’s experience, read it through analytics, improve it by design — and judge every AI tool by the learning it produces." />
            <p className="lab-t-title-ko">{brand.sloganKo}</p>
            <p className="lab-t-body">{brand.intro[1]}</p>
            {/* LEAD 네 축 — 문구는 content/data/brand.json pillars. 관련 연구 분야 링크는 기존 분류를 그대로 가리킴 */}
            <Accordion
              defaultOpen={0}
              items={brand.pillars.map((pl) => ({
                title: `${pl.label} — ${pl.ko}`,
                content: (
                  <>
                    {pl.text}
                    <span className="lab-t-caption" style={{ display: 'block', marginTop: 10 }}>
                      관련 연구 분야:{' '}
                      {pl.areas.map((id, i) => {
                        const a = areaById[id];
                        return a ? (
                          <span key={id}>
                            {i ? ' · ' : ''}
                            <TransitionLink href={`/research/${a.slug}`} label="Research">
                              {a.title}
                            </TransitionLink>
                          </span>
                        ) : null;
                      })}
                    </span>
                  </>
                ),
              }))}
            />
            <Reveal variant="stagger">
              <p className="lab-t-label" style={{ color: 'var(--text-tertiary)' }}>
                Research areas
              </p>
              <div className="lab-rcard__kw">
                {areas.map((a) => (
                  <TransitionLink key={a.id} href={`/research/${a.slug}`} className="lab-tag" label="Research">
                    {a.title}
                  </TransitionLink>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 04 Contact CTA */}
      <section className="lab-sec lab-sec--subtle" aria-labelledby="about-cta">
        <div className="lab-container lab-twocol">
          <div className="lab-twocol__sticky">
            <span className="lab-t-index">04</span>
            <h2 id="about-cta" className="lab-t-h1">
              Join us
            </h2>
            <p className="lab-t-title-ko">연구실 참여 안내</p>
          </div>
          <Reveal variant="stagger" className="lab-twocol__flow">
            <p className="lab-t-lead">대학원 진학, 공동연구, 자문 제안을 기다립니다. 연구실 참여 절차와 연락 방법은 Contact 페이지에서 안내합니다.</p>
            <div className="lab-footer__ctas">
              <Button variant="primary" size="l" magnetic href="/contact">
                Contact the Lab
              </Button>
              <TextLink href="/research" variant="standalone">
                Explore research
              </TextLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
