import type { Metadata } from 'next';
import { Button, TextLink } from '@/components/ui/Button';
import { SplitText } from '@/components/motion/Reveal';

export const metadata: Metadata = { title: '페이지를 찾을 수 없습니다', robots: { index: false } };

export default function NotFound() {
  return (
    <section className="lab-sec lab-container lab-404" aria-labelledby="nf-title">
      <span className="lab-t-label" style={{ color: 'var(--text-tertiary)' }}>
        404
      </span>
      <SplitText as="h1" id="nf-title" className="lab-t-display-l" lines={['Page', 'not found.']} trigger="mount" />
      <p className="lab-t-lead">요청한 페이지가 없거나 주소가 바뀌었습니다.</p>
      <div className="lab-footer__ctas">
        <Button variant="primary" href="/" magnetic>
          Home
        </Button>
        <TextLink href="/research" variant="standalone">
          Research
        </TextLink>
      </div>
    </section>
  );
}
