import { nav, site } from '@/content/site';
import { brand } from '@/content/brand';
import { SplitText } from '@/components/motion/Reveal';
import { Button, Roll, TextLink } from '@/components/ui/Button';
import { Wordmark } from '@/components/brand/Logo';
import { TransitionLink } from './TransitionLink';

/* SiteFooter — 딥 푸터: 브랜드 태그라인 + CTA 1개("연구실 참여 문의"), 텍스트 롤 페이지 링크, 연락처, 워드마크·소속. 페이지의 두 번째 다크 씬. */
export function SiteFooter() {
  const year = new Date(site.dataAsOf).getFullYear();
  return (
    <footer className="lab-footer">
      <div className="lab-container lab-footer__grid">
        <div className="lab-footer__cta">
          <p className="lab-t-label lab-footer__eyebrow">{brand.meaning}</p>
          <SplitText as="p" className="lab-t-display-m lab-footer__big" lines={brand.taglineLines} />
          <div className="lab-footer__ctas">
            <Button variant="on-brand" size="l" magnetic href="/contact">
              연구실 참여 문의
            </Button>
            <TextLink href="/research" variant="standalone" onBrand>
              Explore research
            </TextLink>
          </div>
        </div>
        <nav className="lab-footer__nav" aria-label="푸터 메뉴">
          <p className="lab-t-label">Navigate</p>
          <ul role="list">
            {nav.map((it, i) => (
              <li key={it.id}>
                <TransitionLink href={it.href} label={it.label} className="lab-footer__link">
                  <span className="lab-t-index">{String(i + 1).padStart(2, '0')}</span>
                  <Roll>{it.label}</Roll>
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="lab-footer__info">
          <p className="lab-t-label">Contact</p>
          <address className="lab-t-body-s">
            {brand.nameKo}
            <br />
            {site.university} {site.department}
            <br />
            {site.address.building} {site.address.room}
            {site.address.street ? (
              <>
                <br />
                {site.address.street}
              </>
            ) : null}
          </address>
          <p className="lab-t-body-s">
            <a href={site.phoneHref} className="lab-footer__plain">
              {site.phone}
            </a>
            {site.email ? (
              <>
                <br />
                <a href={`mailto:${site.email}`} className="lab-footer__plain">
                  {site.email}
                </a>
              </>
            ) : null}
          </p>
        </div>
        <div className="lab-footer__base">
          <span className="lab-footer__brand">
            <Wordmark tone="dark" height={16} />
            <span className="lab-t-caption">
              {brand.affiliation}
            </span>
          </span>
          <span className="lab-t-caption">
            © {year} {brand.name} · {site.university} {site.department}
          </span>
        </div>
      </div>
    </footer>
  );
}
