import type { Metadata } from 'next';
import { Fragment } from 'react';
import { site, keywordBand } from '@/content/site';
import { brand, wordmarkParts } from '@/content/brand';
import { professor } from '@/content/profile';
import {
  getLatestNews,
  getMembers,
  getProjects,
  getResearchAreas,
  getSelectedPublications,
} from '@/lib/content';
import { Hero, SectionHeader } from '@/components/content/Headers';
import { Button, TextLink } from '@/components/ui/Button';
import { Reveal } from '@/components/motion/Reveal';
import { FullBleed, Marquee, ScrollText } from '@/components/motion/Kinetic';
import { ResearchGrid } from '@/components/content/Research';
import { ResearchFeed } from '@/components/content/ResearchFeed';
import { MemberGrid } from '@/components/content/People';
import { NewsCard } from '@/components/content/News';

export const metadata: Metadata = {
  title: { absolute: `${brand.name} — ${brand.nameKo} · ${site.university} ${site.department} ${professor.name} 교수 연구실` },
  description: site.description,
  alternates: { canonical: '/' },
};

export default function HomePage() {
  const areas = getResearchAreas();
  const projects = getProjects().slice(0, 2);
  const members = getMembers();
  const people = members.slice(0, 4); // 지도교수 카드는 Home 에 두지 않음(About › Professor 로 충분, 2026-11-06 요청)
  const pubs = getSelectedPublications(5);
  const news = getLatestNews(3);

  return (
    <>
      {/* 워드마크 타이포가 시각적 중심 — 'LEAD AI' / 'LAB.' 두 줄, AI 는 가는 굵기·보조색. 모바일에서는 줄 안에서 자연스럽게 줄바꿈 */}
      <Hero
        className="lab-hero--wm"
        lines={[`${wordmarkParts.lead} ${wordmarkParts.ai}`, wordmarkParts.lab]}
        lineNodes={[
          <Fragment key="lead-ai">
            <span className="lab-wm__lead">{wordmarkParts.lead}</span> <span className="lab-wm__ai">{wordmarkParts.ai}</span>
          </Fragment>,
          <span key="lab" className="lab-wm__lab">
            {wordmarkParts.lab}
          </span>,
        ]}
        tagline={brand.tagline}
        ko={brand.sloganKo}
        lead={brand.intro[0]}
        meta={[brand.meaning, `${site.university} ${site.department}`]}
        actions={
          <>
            <Button variant="primary" size="l" magnetic href="/research">
              Explore Research
            </Button>
            <Button variant="secondary" size="l" icon={null} href="/contact">
              Join the Lab
            </Button>
          </>
        }
        media={{
          src: professor.photo,
          alt: professor.photoAlt,
          label: '지도교수 사진',
          ratio: '2/3',
          sizes: '(min-width: 1024px) 34vw, 70vw',
          caption: `${site.university} 교육학과 ${professor.name} 교수 연구실`,
        }}
      />

      {/* (01) About preview */}
      <section className="lab-sec lab-vision lab-container" aria-labelledby="home-vision">
        <div className="lab-vision__meta">
          <span className="lab-t-index">01</span>
          <span className="lab-t-label" id="home-vision">
            Vision
          </span>
        </div>
        <ScrollText className="lab-t-h1 lab-vision__text" text={`${brand.meaning} — we use data and AI to understand how people learn, and design better learning experiences from what we learn.`} />
        <div className="lab-vision__side">
          <Reveal variant="stagger">
            <p className="lab-t-title-ko">{brand.sloganKo}</p>
            <p className="lab-t-body">{brand.intro[1]}</p>
            <TextLink href="/about" variant="standalone">
              About the Lab
            </TextLink>
          </Reveal>
        </div>
      </section>

      <Marquee items={keywordBand} />

      {/* (02) Research preview — brand scene 1. 헤더는 2단 에디토리얼(라벨 → display 제목 → hairline → 국문 소제목 | 설명·CTA), 문안은 연구실 제공(2026-11-06) */}
      <FullBleed tone="brand" className="lab-sec" labelledBy="home-research">
        <div className="lab-container">
          <SectionHeader
            onBrand
            id="home-research"
            index="02"
            eyebrow="Research"
            lines={['Research Areas.']}
            ko="주요 연구 분야"
            description="학습이 이루어지는 방식과 더 나은 교육의 가능성을 탐구합니다. 인공지능, 학습분석, 교수설계 등 다양한 연구를 통해 의미 있는 학습 경험을 설계합니다."
            action={
              <TextLink href="/research" variant="standalone" arrow="up-right" onBrand>
                All research
              </TextLink>
            }
          />
          <ResearchGrid areas={areas} />
        </div>
      </FullBleed>

      {/* (03) Research — 논문·연구 과제를 한 섹션에, Publications/Projects 칩으로 전환. 문구는 연구실 제공 문안(내부 관리용 표현 없음) */}
      <ResearchFeed
        index="03"
        pubs={pubs}
        projects={projects}
        pubsDescription="교육공학과 학습과학을 기반으로 학습과 교육의 다양한 문제를 탐구합니다. 연구를 통해 축적한 지식과 발견을 학술논문으로 공유하고 있습니다."
        projectsDescription="학습분석, 교수설계, 교육기술에 대한 탐구를 바탕으로 교육의 문제를 해결하고 새로운 가능성을 모색합니다."
      />

      {/* (04) People preview — 예시(가상) 구성원도 '예시' 배지와 함께 표시(2026-11-06 결정). 구성원이 하나도 없을 때만 섹션을 숨기고 News 번호를 당깁니다 */}
      {people.length ? (
      <section className="lab-sec lab-sec--subtle" aria-labelledby="home-people">
        <div className="lab-container">
          <SectionHeader
            id="home-people"
            index="04"
            eyebrow="People"
            lines={['The people', 'behind the work.']}
            ko="연구실 구성원"
            action={
              <TextLink href="/people" variant="standalone" arrow="up-right">
                Meet everyone
              </TextLink>
            }
          />
          <MemberGrid members={people} />
        </div>
      </section>
      ) : null}

      {/* (05) News */}
      <section className="lab-sec lab-sec--tight-top" aria-labelledby="home-news">
        <div className="lab-container">
          <SectionHeader
            id="home-news"
            index={people.length ? '05' : '04'}
            eyebrow="News"
            lines={['Latest from', 'the lab.']}
            ko="연구실 소식"
            action={
              <TextLink href="/news" variant="standalone" arrow="up-right">
                All news
              </TextLink>
            }
          />
          <Reveal variant="stagger" className="lab-newsgrid">
            {news.map((n, i) => (
              <NewsCard key={n.slug} item={n} size={i === 0 ? 'l' : 's'} />
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}
