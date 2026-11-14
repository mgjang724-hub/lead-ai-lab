'use client';
/**
 * SiteHeader — sticky 글로벌 헤더: 브랜드, 7개 메뉴 + 슬라이딩 인디케이터, 드롭다운, 스크롤 진행 hairline, 모바일 메뉴.
 * 160px 이후 아래로 스크롤하면 숨고 위로 스크롤하면 돌아옴. 24px 이후 배경.
 * 활성 메뉴는 현재 경로에서 계산합니다.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cx, dur, motion, scrollMax, scrollTop, subscribeScroll } from '@/lib/motion/core';
import { useFocusTrap, useIso } from '@/lib/motion/hooks';
import { nav as NAV, site, type NavItem } from '@/content/site';
import { brand } from '@/content/brand';
import { Wordmark } from '@/components/brand/Logo';
import { Icon } from '@/components/ui/Icon';
import { IconButton, Roll } from '@/components/ui/Button';
import { TransitionLink } from './TransitionLink';
import { SiteSearch, type SearchEntry } from './SiteSearch';

const basePath = (href: string) => href.split(/[?#]/)[0];

/**
 * 현재 경로에 해당하는 상단 메뉴 id.
 * 상단 항목이 없는 경로(/publications)는 그 경로를 하위 메뉴로 가진 항목(Research)을 활성화합니다.
 */
export function activeNavId(pathname: string | null): string | null {
  if (!pathname) return null;
  if (pathname === '/') return 'home';
  const seg = '/' + pathname.split('/')[1];
  const top = NAV.find((n) => basePath(n.href) === seg);
  if (top) return top.id;
  return NAV.find((n) => n.children?.some((c) => basePath(c.href) === seg))?.id ?? null;
}

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <TransitionLink className="lab-brand" href="/" label="Home" aria-label={`${brand.name} 홈`} onClick={onClick}>
      <span className="lab-brand__text">
        <Wordmark height={20} decorative />
        <span className="lab-brand__sub">{brand.affiliation}</span>
      </span>
    </TransitionLink>
  );
}

export function ScrollProgress({ className }: { className?: string }) {
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    return subscribeScroll(null, () => {
      const m = scrollMax(null);
      const v = m > 0 ? scrollTop(null) / m : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${v.toFixed(4)})`;
    });
  }, []);
  return (
    <div className={cx('lab-progress', className)} aria-hidden="true">
      <span ref={bar} className="lab-progress__bar" />
    </div>
  );
}

function NavDropdown({ item, open, id, onPick }: { item: NavItem; open: boolean; id: string; onPick: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || !panel.current) return;
    panel.current.querySelectorAll('.lab-dd__item').forEach((r, i) => {
      motion.animate(r, [{ opacity: 0, transform: 'translate3d(0,12px,0)' }, { opacity: 1, transform: 'none' }], { duration: 'dur-base', easing: 'ease-out', delay: i * dur('stagger-tight') });
    });
  }, [open]);
  return (
    <div ref={panel} id={id} className={cx('lab-dd', open && 'is-open')} hidden={!open}>
      <ul className="lab-dd__list" role="list">
        {(item.children || []).map((c) => (
          <li key={c.label}>
            <TransitionLink className="lab-dd__item" href={c.href} label={item.label} onClick={onPick}>
              <span className="lab-dd__text">
                <span className="lab-dd__label">{c.label}</span>
                {c.ko ? <span className="lab-dd__ko">{c.ko}</span> : null}
              </span>
              <span className="lab-dd__arrow" aria-hidden="true">
                <Icon name="arrow-right" size={16} />
              </span>
            </TransitionLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface SiteHeaderProps {
  searchIndex?: SearchEntry[];
  hideOnScroll?: boolean;
  progress?: boolean;
  menuFooter?: ReactNode;
}

export function SiteHeader({ searchIndex = [], hideOnScroll = true, progress = true, menuFooter }: SiteHeaderProps) {
  const pathname = usePathname();
  const active = activeNavId(pathname);
  const items = NAV;
  const navRef = useRef<HTMLElement>(null);
  const ind = useRef<HTMLSpanElement>(null);
  const hdr = useRef<HTMLElement>(null);
  const lastT = useRef(0);
  const closeT = useRef(0);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const openRef = useRef<string | null>(null);
  openRef.current = openId;

  useEffect(() => {
    return subscribeScroll(null, () => {
      const t = scrollTop(null);
      const d = t - lastT.current;
      lastT.current = t;
      setScrolled(t > 24);
      if (!hideOnScroll || openRef.current) {
        setHidden(false);
        return;
      }
      const hasFocus = hdr.current?.contains(document.activeElement);
      if (t > 160 && d > 4 && !hasFocus) setHidden(true);
      else if (d < -4 || t < 160) setHidden(false);
    });
  }, [hideOnScroll]);

  /* 헤더가 스크롤로 숨겨졌는지를 문서 루트에 알림 — 헤더 높이만큼 아래에 붙는 sticky 보조 내비(.lab-subnav)가
     헤더가 사라진 자리로 올라붙어, 그 틈으로 본문이 비쳐 보이지 않게 합니다(site.css 의 :root[data-header-hidden]) */
  useEffect(() => {
    const root = document.documentElement;
    root.toggleAttribute('data-header-hidden', hidden && !menu);
    return () => root.removeAttribute('data-header-hidden');
  }, [hidden, menu]);

  /* indicator: 링크를 측정해 그 위치로 미끄러짐 */
  const moveTo = useCallback((id: string | null, instant?: boolean) => {
    const nav = navRef.current;
    const el = id ? nav?.querySelector<HTMLElement>(`[data-nav-id="${id}"]`) : null;
    const bar = ind.current;
    if (!bar || !nav) return;
    if (!el) {
      bar.style.opacity = '0';
      return;
    }
    const nr = nav.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    bar.style.transition = instant || motion.reduced() ? 'none' : '';
    bar.style.opacity = '1';
    bar.style.width = `${r.width}px`;
    bar.style.transform = `translate3d(${r.left - nr.left}px,0,0)`;
  }, []);
  const first = useRef(true);
  useIso(() => {
    moveTo(active, first.current);
    first.current = false;
  }, [active, moveTo]);
  useEffect(() => {
    const rs = () => moveTo(active, true);
    window.addEventListener('resize', rs);
    const t = setTimeout(rs, 300);
    document.fonts?.ready.then(rs);
    return () => {
      window.removeEventListener('resize', rs);
      clearTimeout(t);
    };
  }, [active, moveTo]);

  const hush = useRef(false);
  const openSoon = (id: string) => {
    if (hush.current) return;
    clearTimeout(closeT.current);
    closeT.current = window.setTimeout(() => setOpenId(id), 90);
  };
  const closeSoon = () => {
    clearTimeout(closeT.current);
    closeT.current = window.setTimeout(() => setOpenId(null), 160);
  };
  useEffect(() => {
    if (!openId) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const btn = navRef.current?.querySelector<HTMLElement>(`[data-dd-toggle="${openId}"]`);
        setOpenId(null);
        btn?.focus();
      }
    };
    const out = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenId(null);
    };
    document.addEventListener('keydown', key);
    document.addEventListener('pointerdown', out);
    return () => {
      document.removeEventListener('keydown', key);
      document.removeEventListener('pointerdown', out);
    };
  }, [openId]);

  /* 경로가 바뀌면 메뉴·드롭다운 정리 */
  useEffect(() => {
    setOpenId(null);
    setMenu(false);
  }, [pathname]);

  const picked = () => {
    clearTimeout(closeT.current);
    hush.current = true;
    setOpenId(null);
  };

  return (
    <>
      <a className="lab-skip" href="#lab-main">
        본문 바로가기
      </a>
      <header ref={hdr} className={cx('lab-header', scrolled && 'is-scrolled', hidden && !menu && 'is-hidden')}>
        <div className="lab-header__bar">
          <Brand onClick={picked} />
          <nav
            className="lab-header__nav"
            aria-label="주 메뉴"
            ref={navRef}
            onPointerLeave={() => {
              hush.current = false;
              moveTo(active);
            }}
          >
            <ul className="lab-nav" role="list">
              {items.map((it, i) => {
                const has = !!it.children?.length;
                const ddId = `lab-dd-${it.id}`;
                return (
                  <li
                    key={it.id}
                    className={cx('lab-nav__item', has && 'has-dd', openId === it.id && 'is-open')}
                    onPointerEnter={() => {
                      moveTo(it.id);
                      if (has && motion.finePointer()) openSoon(it.id);
                      else if (motion.finePointer()) closeSoon();
                    }}
                    onPointerLeave={() => {
                      if (has) closeSoon();
                    }}
                  >
                    <TransitionLink
                      className="lab-nav__link"
                      href={it.href}
                      label={it.label}
                      data-nav-id={it.id}
                      aria-current={active === it.id ? 'page' : undefined}
                      onFocus={() => moveTo(it.id)}
                      onBlur={() => moveTo(active)}
                      onClick={picked}
                    >
                      <span className="lab-nav__num" aria-hidden="true">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <Roll>{it.label}</Roll>
                    </TransitionLink>
                    {has ? (
                      <button
                        type="button"
                        className="lab-nav__toggle"
                        data-dd-toggle={it.id}
                        aria-expanded={openId === it.id}
                        aria-controls={ddId}
                        aria-label={`${it.label} 하위 메뉴`}
                        onClick={() => setOpenId(openId === it.id ? null : it.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setOpenId(it.id);
                            setTimeout(() => document.querySelector<HTMLElement>(`#${ddId} a`)?.focus(), 40);
                          }
                        }}
                      >
                        <Icon name="chevron-down" size={14} stroke={1.75} />
                      </button>
                    ) : null}
                    {has ? <NavDropdown id={ddId} item={it} open={openId === it.id} onPick={picked} /> : null}
                  </li>
                );
              })}
            </ul>
            <span ref={ind} className="lab-nav__indicator" aria-hidden="true" />
          </nav>
          <div className="lab-header__actions">
            {searchIndex.length ? (
              <IconButton label="사이트 검색" icon="search" variant="ghost" size="s" className="lab-header__search" onClick={() => setSearch(true)} />
            ) : null}
            <button
              ref={menuBtn}
              type="button"
              className={cx('lab-menubtn', menu && 'is-open')}
              aria-expanded={menu}
              aria-controls="lab-mobile-menu"
              aria-label={menu ? '메뉴 닫기' : '메뉴 열기'}
              onClick={() => setMenu(!menu)}
            >
              <span className="lab-menubtn__label" aria-hidden="true">
                <Roll>{menu ? 'Close' : 'Menu'}</Roll>
              </span>
              <span className="lab-menubtn__lines" aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
        {progress ? <ScrollProgress className="lab-header__progress" /> : null}
      </header>
      <MobileMenu
        open={menu}
        items={items}
        active={active}
        anchor={menuBtn}
        onClose={() => {
          setMenu(false);
          menuBtn.current?.focus();
        }}
        onNavigate={() => setMenu(false)}
        footer={menuFooter}
      />
      {searchIndex.length ? <SiteSearch open={search} onClose={() => setSearch(false)} index={searchIndex} /> : null}
    </>
  );
}

/* MobileMenu — 풀스크린 브랜드 오버레이. 메뉴 버튼에서 원형으로 열리고 항목이 순서대로 올라옴.
   하위 메뉴가 있는 항목은 큰 메뉴 아래에 하위 바로가기를 함께 보여 줍니다(2026-11-09 요청). */
export function MobileMenu(p: {
  open: boolean;
  items: NavItem[];
  active: string | null;
  anchor: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onNavigate: () => void;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(p.open);
  useEffect(() => {
    if (p.open) setMounted(true);
  }, [p.open]);
  useFocusTrap(ref, p.open, p.onClose);
  useEffect(() => {
    const el = panel.current;
    if (!mounted || !el) return;
    const sc = document.documentElement;
    const a = p.anchor.current ? p.anchor.current.getBoundingClientRect() : { left: window.innerWidth - 40, top: 32, width: 0, height: 0 };
    const ox = a.left + a.width / 2;
    const oy = a.top + a.height / 2;
    if (p.open) {
      sc.style.overflow = 'hidden';
      motion.animate(el, [{ clipPath: `circle(0px at ${ox}px ${oy}px)` }, { clipPath: `circle(150vmax at ${ox}px ${oy}px)` }], { duration: 'dur-slower', easing: 'ease-in-out' });
      el.querySelectorAll('.lab-mmenu__row').forEach((r, i) => {
        motion.animate(r, [{ opacity: 0, transform: 'translate3d(0,48px,0)' }, { opacity: 1, transform: 'none' }], { duration: 'dur-slower', easing: 'ease-out', delay: 260 + i * dur('stagger-base') });
      });
    } else {
      sc.style.overflow = '';
      const an = motion.animate(el, [{ clipPath: `circle(150vmax at ${ox}px ${oy}px)` }, { clipPath: `circle(0px at ${ox}px ${oy}px)` }], { duration: 'dur-slow', easing: 'ease-in' });
      if (an) an.onfinish = () => setMounted(false);
      else setMounted(false);
    }
    return () => {
      sc.style.overflow = '';
    };
  }, [p.open, mounted, p.anchor]);
  if (!mounted) return null;
  return (
    <div ref={ref} id="lab-mobile-menu" className="lab-mmenu" role="dialog" aria-modal="true" aria-label="사이트 메뉴">
      <div ref={panel} className="lab-mmenu__panel">
        <div className="lab-mmenu__top">
          <Wordmark tone="dark" height={16} />
          <IconButton label="메뉴 닫기" icon="close" variant="on-brand" onClick={p.onClose} autoFocus />
        </div>
        <nav aria-label="모바일 메뉴">
          <ul className="lab-mmenu__list" role="list">
            {p.items.map((it, i) => (
              <li key={it.id} className="lab-mmenu__row">
                <TransitionLink href={it.href} label={it.label} className="lab-mmenu__link" aria-current={p.active === it.id ? 'page' : undefined} onClick={p.onNavigate}>
                  <span className="lab-mmenu__num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="lab-mmenu__label">{it.label}</span>
                </TransitionLink>
                {/* 하위 메뉴 바로가기 — 데스크톱 드롭다운과 같은 항목(content/site.ts 의 children) */}
                {it.children?.length ? (
                  <ul className="lab-mmenu__sub" role="list" aria-label={`${it.label} 하위 메뉴`}>
                    {it.children.map((c) => (
                      <li key={c.label}>
                        <TransitionLink href={c.href} label={it.label} className="lab-mmenu__sublink" onClick={p.onNavigate}>
                          <span>{c.label}</span>
                          {c.ko ? (
                            <span className="lab-mmenu__subko" lang="ko">
                              {c.ko}
                            </span>
                          ) : null}
                        </TransitionLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
        <div className="lab-mmenu__row lab-mmenu__foot">
          {p.footer || (
            <span>
              {site.university} {site.department} · {site.address.building} {site.address.room} · {site.phone}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
