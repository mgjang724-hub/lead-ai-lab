'use client';
import { forwardRef, useRef, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { cx } from '@/lib/motion/core';
import { useMagnetic, useMergedRef, useWipe } from '@/lib/motion/hooks';
import { Icon, type IconName } from './Icon';
import { TransitionLink } from '@/components/nav/TransitionLink';

export interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'on-brand';
  size?: 's' | 'm' | 'l';
  /** 아이콘 이름, null 이면 없음 (기본 arrow-right) */
  icon?: IconName | null;
  href?: string;
  external?: boolean;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  /** 뷰당 1개의 CTA 에만 */
  magnetic?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  style?: CSSProperties;
  'aria-label'?: string;
}

/* Button — pill. Hover: 포인터 진입점에서 원형 wipe; 화살표가 나갔다 들어옴. Press: scale .97. */
export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(p, fref) {
  const ref = useRef<HTMLElement>(null);
  const mref = useMergedRef<HTMLElement>(ref, fref);
  const variant = p.variant || 'primary';
  const size = p.size || 'm';
  useWipe(ref);
  useMagnetic(ref, { disabled: !p.magnetic || p.disabled, strength: 0.28 });
  const icon = p.icon === undefined ? 'arrow-right' : p.icon;
  const className = cx('lab-btn', `lab-btn--${variant}`, `lab-btn--${size}`, p.magnetic && 'lab-magnetic', p.loading && 'is-loading', p.className);
  const inner = (
    <>
      <span className="lab-btn__clip" aria-hidden="true">
        <span className="lab-btn__wipe" />
      </span>
      <span className="lab-btn__inner lab-magnetic__inner">
        <span className="lab-btn__label">{p.children}</span>
        {icon ? (
          <span className="lab-btn__icon" aria-hidden="true">
            <span className="lab-btn__icon-a">
              <Icon name={icon} size={18} />
            </span>
            <span className="lab-btn__icon-b">
              <Icon name={icon} size={18} />
            </span>
          </span>
        ) : null}
        {p.loading ? <span className="lab-btn__spinner" aria-hidden="true" /> : null}
      </span>
    </>
  );
  if (p.href && !p.disabled) {
    return (
      <TransitionLink
        ref={mref as React.Ref<HTMLAnchorElement>}
        href={p.href}
        className={className}
        onClick={p.onClick as (e: MouseEvent<HTMLAnchorElement>) => void}
        id={p.id}
        style={p.style}
        aria-label={p['aria-label']}
        target={p.external ? '_blank' : undefined}
        rel={p.external ? 'noopener noreferrer' : undefined}
      >
        {inner}
      </TransitionLink>
    );
  }
  return (
    <button
      ref={mref as React.Ref<HTMLButtonElement>}
      type={p.type || 'button'}
      className={className}
      onClick={p.disabled || p.loading ? undefined : p.onClick}
      aria-disabled={p.disabled ? 'true' : undefined}
      aria-busy={p.loading ? 'true' : undefined}
      aria-label={p['aria-label']}
      disabled={!!p.disabled}
      id={p.id}
      style={p.style}
    >
      {inner}
    </button>
  );
});

export interface IconButtonProps {
  /** 필수 — aria-label */
  label: string;
  icon?: IconName;
  variant?: 'outline' | 'solid' | 'ghost' | 'on-brand';
  size?: 's' | 'm' | 'l';
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  magnetic?: boolean;
  disabled?: boolean;
  expanded?: boolean;
  controls?: string;
  pressed?: boolean;
  title?: string;
  className?: string;
  style?: CSSProperties;
  autoFocus?: boolean;
  children?: ReactNode;
}

/* IconButton — 48px 원형 (44px 터치 최소 충족). */
export const IconButton = forwardRef<HTMLElement, IconButtonProps>(function IconButton(p, fref) {
  const ref = useRef<HTMLElement>(null);
  const mref = useMergedRef<HTMLElement>(ref, fref);
  useWipe(ref);
  useMagnetic(ref, { disabled: !p.magnetic || p.disabled, strength: 0.4 });
  const className = cx('lab-iconbtn', `lab-iconbtn--${p.variant || 'outline'}`, `lab-iconbtn--${p.size || 'm'}`, p.magnetic && 'lab-magnetic', p.className);
  const inner = (
    <>
      <span className="lab-btn__clip" aria-hidden="true">
        <span className="lab-btn__wipe" />
      </span>
      <span className="lab-iconbtn__inner lab-magnetic__inner">{p.children || <Icon name={p.icon || 'arrow-right'} size={p.size === 's' ? 16 : 20} />}</span>
    </>
  );
  if (p.href) {
    return (
      <TransitionLink ref={mref as React.Ref<HTMLAnchorElement>} href={p.href} className={className} aria-label={p.label} title={p.title} onClick={p.onClick} style={p.style}>
        {inner}
      </TransitionLink>
    );
  }
  return (
    <button
      ref={mref as React.Ref<HTMLButtonElement>}
      type="button"
      className={className}
      aria-label={p.label}
      title={p.title}
      onClick={p.onClick}
      aria-expanded={p.expanded}
      aria-controls={p.controls}
      aria-pressed={p.pressed}
      style={p.style}
      disabled={!!p.disabled}
      data-autofocus={p.autoFocus ? '' : undefined}
    >
      {inner}
    </button>
  );
});

export interface TextLinkProps {
  href: string;
  children: ReactNode;
  variant?: 'inline' | 'standalone';
  onBrand?: boolean;
  external?: boolean;
  /** standalone 화살표 방향 — 'up-right' 는 대각선 화살표(↗), hover 시 대각선으로 이동 (섹션 헤더 CTA) */
  arrow?: 'right' | 'up-right';
  current?: boolean;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

/* TextLink — inline: 밑줄 유지, hover 시 오른쪽으로 빠지고 왼쪽에서 다시 그려짐. standalone: 밑줄 draw-in + 화살표. */
export function TextLink(p: TextLinkProps) {
  const v = p.variant || 'inline';
  const className = cx('lab-link', `lab-link--${v}`, p.onBrand && 'lab-link--on-brand', p.className);
  const body = (
    <>
      <span className="lab-link__text">{p.children}</span>
      {p.external ? (
        <span className="lab-link__ext" aria-hidden="true">
          <Icon name="arrow-up-right" size={14} stroke={1.75} />
        </span>
      ) : null}
      {p.external ? <span className="lab-sr-only"> (새 창)</span> : null}
      {v === 'standalone' && !p.external ? (
        <span className={cx('lab-link__arrow', p.arrow === 'up-right' && 'lab-link__arrow--diag')} aria-hidden="true">
          <Icon name={p.arrow === 'up-right' ? 'arrow-up-right' : 'arrow-right'} size={16} stroke={1.75} />
        </span>
      ) : null}
    </>
  );
  if (p.external) {
    return (
      <a href={p.href} className={className} target="_blank" rel="noopener noreferrer" onClick={p.onClick}>
        {body}
      </a>
    );
  }
  return (
    <TransitionLink href={p.href} className={className} onClick={p.onClick} aria-current={p.current ? 'page' : undefined}>
      {body}
    </TransitionLink>
  );
}

/* Roll — 라벨이 위로 빠지고 복제본이 아래에서 올라옴 */
export function Roll({ children }: { children: ReactNode }) {
  return (
    <span className="lab-roll">
      <span className="lab-roll__a">{children}</span>
      <span className="lab-roll__b" aria-hidden="true">
        {children}
      </span>
    </span>
  );
}
