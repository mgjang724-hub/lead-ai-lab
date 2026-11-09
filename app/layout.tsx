import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@/styles/tokens.css';
import '@/styles/components.css';
import '@/styles/site.css';
import { site } from '@/content/site';
import { brand } from '@/content/brand';
import { buildSearchIndex } from '@/lib/search';
import { withBasePath } from '@/lib/base-path';
import { TransitionProvider } from '@/components/nav/TransitionProvider';
import { SiteHeader } from '@/components/nav/SiteHeader';
import { SiteFooter } from '@/components/nav/SiteFooter';
import { BackToTop } from '@/components/nav/BackToTop';
import { GridOverlay } from '@/components/motion/GridOverlay';

const siteTitle = `${brand.name} — ${brand.nameKo} · ${site.university} ${site.department}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: siteTitle, template: `%s — ${brand.name}` },
  description: site.description,
  applicationName: brand.name,
  keywords: [brand.name, brand.nameKo, brand.meaning, ...brand.fields, '교육공학', '학습분석', '교수설계', '상명대학교 교육학과', '이현우'],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: brand.name,
    title: siteTitle,
    description: site.description,
    url: '/',
  },
  twitter: { card: 'summary_large_image', title: siteTitle, description: site.description },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#060817' },
  ],
};

/* <html> 에 lab-js 클래스를 가장 먼저 붙여, CSS 가 리빌 초기 상태를 hydration 전부터 적용하도록 함 */
const jsFlag = "document.documentElement.classList.add('lab-js');";

export default function RootLayout({ children }: { children: ReactNode }) {
  const searchIndex = buildSearchIndex();
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: jsFlag }} />
        <link rel="preload" href={withBasePath('/fonts/PretendardVariable.woff2')} as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href={withBasePath('/fonts/InterVariable-latin.woff2')} as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <TransitionProvider>
          <div className="lab-site">
            <SiteHeader searchIndex={searchIndex} />
            <main id="lab-main" tabIndex={-1} className="lab-main">
              {children}
            </main>
            <SiteFooter />
            <BackToTop />
          </div>
        </TransitionProvider>
        {process.env.NODE_ENV !== 'production' ? <GridOverlay /> : null}
      </body>
    </html>
  );
}
