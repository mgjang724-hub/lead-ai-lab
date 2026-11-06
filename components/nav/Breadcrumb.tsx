import { TransitionLink } from './TransitionLink';
import { Icon } from '@/components/ui/Icon';

export interface Crumb {
  label: string;
  href?: string;
}

/* Breadcrumb — 상세 페이지 상단 현재 위치 */
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="현재 위치" className={['lab-crumb', className].filter(Boolean).join(' ')}>
      <ol className="lab-crumb__list" role="list">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="lab-crumb__item">
              {c.href && !last ? (
                <TransitionLink href={c.href} className="lab-crumb__link">
                  {c.label}
                </TransitionLink>
              ) : (
                <span className="lab-crumb__cur" aria-current={last ? 'page' : undefined}>
                  {c.label}
                </span>
              )}
              {!last ? (
                <span className="lab-crumb__sep" aria-hidden="true">
                  <Icon name="arrow-right" size={12} stroke={1.75} />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
