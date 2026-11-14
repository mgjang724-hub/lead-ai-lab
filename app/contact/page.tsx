import type { Metadata } from 'next';
import { joinFaq, site } from '@/content/site';
import { brand } from '@/content/brand';
import { professor } from '@/content/profile';
import { PageHero } from '@/components/content/Headers';
import { Reveal } from '@/components/motion/Reveal';
import { Accordion } from '@/components/ui/Controls';
import { ContactForm } from '@/components/forms/ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: `${brand.name}(${brand.nameKo}) 연락처와 참여 안내 — ${site.university} ${site.department} ${professor.name} 교수 연구실, ${site.address.building} ${site.address.room}, ${site.phone}.`,
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <PageHero index="07" eyebrow="Contact" lines={['Let’s talk.']} ko="연락처와 연구실 참여 안내" lead={`${brand.name}에 대한 대학원 진학 상담, 공동연구 제안, 기타 문의를 환영합니다.`} />
      <section className="lab-sec lab-sec--tight-top lab-container lab-contact" aria-label="연락처와 문의">
        <div className="lab-contact__info">
          <Reveal variant="stagger" as="dl" className="lab-contact__dl">
            <div>
              <dt className="lab-t-label">Lab</dt>
              <dd className="lab-t-h4">{brand.name}</dd>
              <dd className="lab-t-caption" style={{ color: 'var(--text-tertiary)' }}>
                {brand.nameKo}
              </dd>
            </div>
            <div>
              <dt className="lab-t-label">Affiliation</dt>
              <dd className="lab-t-h4">
                {site.university} {site.department}
              </dd>
              <dd className="lab-t-caption" style={{ color: 'var(--text-tertiary)' }}>
                {site.universityEn} · {site.departmentEn} · {site.major}
              </dd>
            </div>
            <div>
              <dt className="lab-t-label">Address</dt>
              <dd className="lab-t-body-l">
                {site.address.building} {site.address.room}
              </dd>
              {site.address.street ? (
                <dd className="lab-t-caption" style={{ color: 'var(--text-tertiary)' }}>
                  {site.address.street}
                </dd>
              ) : null}
            </div>
            <div>
              <dt className="lab-t-label">Phone</dt>
              <dd className="lab-t-h4">
                <a href={site.phoneHref}>{site.phone}</a>
              </dd>
            </div>
            {site.email ? (
              <div>
                <dt className="lab-t-label">Email</dt>
                <dd className="lab-t-body-l">
                  <a href={`mailto:${site.email}`}>{site.email}</a>
                  {site.emailIsSample ? (
                    <span className="lab-badge lab-badge--sample" style={{ marginLeft: 8 }}>
                      예시
                    </span>
                  ) : null}
                </dd>
              </div>
            ) : null}
          </Reveal>
        </div>
        <div className="lab-contact__form">
          <h2 className="lab-t-h2">Send a message</h2>
          <p className="lab-t-body lab-contact__note">진학 상담, 공동연구 제안, 기타 문의 내용을 남겨 주세요.</p>
          <ContactForm />
        </div>
      </section>
      <section className="lab-sec lab-sec--subtle" aria-labelledby="contact-join" id="join">
        <div className="lab-container lab-twocol">
          <div className="lab-twocol__sticky">
            <h2 id="contact-join" className="lab-t-h1">
              Joining the lab
            </h2>
            <p className="lab-t-title-ko">연구실 참여 안내</p>
          </div>
          <div className="lab-twocol__flow">
            <Accordion items={joinFaq} defaultOpen={0} />
          </div>
        </div>
      </section>
    </>
  );
}
