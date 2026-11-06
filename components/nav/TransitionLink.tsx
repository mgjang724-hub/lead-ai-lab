'use client';
/**
 * TransitionLink — Next <Link> 에 커튼 전환을 얹은 링크. 모든 내부 링크 컴포넌트의 공통 베이스.
 * 실제 <a href> 를 유지하므로 JS 없이도 동작하고, 새 탭·수정키 클릭은 브라우저 기본 동작을 따릅니다.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { forwardRef, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { shouldTransition, usePageTransition } from './TransitionProvider';
import { nav } from '@/content/site';

export interface TransitionLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  /** 커튼에 표시할 페이지 이름 (없으면 내비게이션에서 추정) */
  label?: string;
  /** 커튼 전환 없이 일반 이동 */
  plain?: boolean;
  children?: ReactNode;
}

export function labelForHref(href: string): string {
  const path = href.split(/[?#]/)[0];
  const match = (h: string) => {
    const base = h.split(/[?#]/)[0];
    return base === '/' ? path === '/' : path === base || path.startsWith(base + '/');
  };
  /* 상단 항목 우선, 없으면 그 경로를 하위 메뉴로 가진 항목(/publications → Research) */
  const item = nav.find((n) => match(n.href)) || nav.find((n) => n.children?.some((c) => match(c.href)));
  return item?.label || '';
}

export const TransitionLink = forwardRef<HTMLAnchorElement, TransitionLinkProps>(function TransitionLink(
  { href, label, plain, onClick, children, ...rest },
  ref,
) {
  const { go } = usePageTransition();
  const pathname = usePathname();
  const external = /^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:');
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (plain || external) return;
    if (shouldTransition(e, href, pathname)) {
      e.preventDefault();
      go(href, label ?? labelForHref(href));
    }
  };
  if (external) {
    return (
      <a ref={ref} href={href} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link ref={ref} href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  );
});
