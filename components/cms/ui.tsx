'use client';
/** 관리자 화면 공용 작은 부품 — 버튼·배지·알림·안내 상자 (스타일: styles/admin.css 의 .cms-*) */
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 's' | 'm';
  busy?: boolean;
};

export function Btn({ variant = 'secondary', size = 'm', busy, className, children, disabled, type = 'button', ...rest }: BtnProps) {
  return (
    <button
      type={type}
      className={cx('cms-btn', `cms-btn--${variant}`, size === 's' && 'cms-btn--s', busy && 'is-busy', className)}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {busy ? <span className="cms-spinner" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}

export function LinkBtn({ href, variant = 'secondary', size = 'm', children, external }: { href: string; variant?: BtnProps['variant']; size?: 's' | 'm'; children: ReactNode; external?: boolean }) {
  return (
    <a
      href={href}
      className={cx('cms-btn', `cms-btn--${variant}`, size === 's' && 'cms-btn--s')}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
    >
      <span>{children}</span>
    </a>
  );
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'sample' | 'ok' | 'danger' | 'brand'; children: ReactNode }) {
  return <span className={cx('cms-badge', `cms-badge--${tone}`)}>{children}</span>;
}

export function Notice({ tone = 'info', title, children, actions }: { tone?: 'info' | 'warn' | 'danger' | 'ok'; title?: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className={cx('cms-notice', `cms-notice--${tone}`)} role={tone === 'danger' ? 'alert' : undefined}>
      <div className="cms-notice__body">
        {title ? <strong className="cms-notice__title">{title}</strong> : null}
        {children ? <div className="cms-notice__text">{children}</div> : null}
      </div>
      {actions ? <div className="cms-notice__actions">{actions}</div> : null}
    </div>
  );
}

export function Spinner({ label = '불러오는 중…' }: { label?: string }) {
  return (
    <div className="cms-loading" role="status">
      <span className="cms-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function Avatar({ src, name, size = 28 }: { src?: string; name: string; size?: number }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="cms-avatar" src={src} alt="" width={size} height={size} />;
  }
  return (
    <span className="cms-avatar cms-avatar--text" style={{ width: size, height: size }} aria-hidden="true">
      {name.slice(0, 1)}
    </span>
  );
}

export interface Toast {
  id: number;
  text: string;
  tone: 'ok' | 'error' | 'info';
}

export function Toasts({ items, onClose }: { items: Toast[]; onClose: (id: number) => void }) {
  return (
    <div className="cms-toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={cx('cms-toast', `cms-toast--${t.tone}`)} role={t.tone === 'error' ? 'alert' : 'status'}>
          <span>{t.text}</span>
          <button type="button" className="cms-toast__close" onClick={() => onClose(t.id)} aria-label="알림 닫기">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

/** 확인 창 — 브라우저 기본 <dialog> (Esc 로 닫힘, 바깥 화면은 막힘, 열리면 창 안으로 포커스) */
export function Dialog({ open, title, onClose, children, actions, wide }: { open: boolean; title: ReactNode; onClose: () => void; children: ReactNode; actions: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={cx('cms-dialog', wide && 'cms-dialog--wide')}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {open ? (
        <>
          <h2 className="cms-dialog__title" id={titleId}>
            {title}
          </h2>
          <div className="cms-dialog__body">{children}</div>
          <div className="cms-dialog__foot">{actions}</div>
        </>
      ) : null}
    </dialog>
  );
}

export { josa } from '@/lib/cms/josa';

/** "3분 전" 같은 상대 시각 */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '';
  const m = Math.round(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
