'use client';
/**
 * 사이트 틀 — 페이지 전환·머리말·바닥글을 감쌉니다. 관리자 화면(/admin)에서는 틀 없이 본문만 그립니다.
 * (머리말·바닥글은 서버에서 만든 요소를 받아 그대로 놓기만 합니다 — app/layout.tsx)
 */
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { TransitionProvider } from './TransitionProvider';

export function isAdminPath(pathname: string | null): boolean {
  return pathname === '/admin' || !!pathname?.startsWith('/admin/');
}

export function SiteChrome({ header, footer, extras, children }: { header: ReactNode; footer: ReactNode; extras?: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  if (isAdminPath(pathname)) return <>{children}</>;
  return (
    <TransitionProvider>
      <div className="lab-site">
        {header}
        <main id="lab-main" tabIndex={-1} className="lab-main">
          {children}
        </main>
        {footer}
        {extras}
      </div>
    </TransitionProvider>
  );
}
