'use client';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx, dur, flipFrom, motion } from '@/lib/motion/core';
import { useFocusTrap, useIso } from '@/lib/motion/hooks';
import { IconButton } from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  variant?: 'dialog' | 'profile' | 'article' | 'media';
  /** className="lab-modal__hero" 인 MediaFrame */
  hero?: ReactNode;
  /** 공유 요소 전환의 출발 박스 */
  originRect?: DOMRect | null;
  children?: ReactNode;
}

/* Modal — body 포털, 포커스 트랩, Esc, 스크롤 락, 포커스 반환. originRect 가 있으면 hero 가 그 박스에서 자람. */
export function Modal(p: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(p.open);
  const tid = useId();
  const { open, originRect, onClose } = p;
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);
  useFocusTrap(ref, open && mounted, onClose);
  useIso(() => {
    if (!mounted) return;
    const pn = panel.current;
    const sc = scrim.current;
    if (!pn) return;
    const lock = document.documentElement;
    if (open) {
      lock.style.overflow = 'hidden';
      motion.animate(sc, [{ opacity: 0 }, { opacity: 1 }], { duration: 'dur-base', easing: 'ease-standard' });
      const hero = pn.querySelector<HTMLElement>('.lab-modal__hero');
      if (originRect && hero && !motion.reduced()) {
        flipFrom(originRect, hero, { duration: 'dur-slower' });
        pn.querySelectorAll('.lab-modal__rest > *').forEach((el, i) => {
          motion.animate(el, [{ opacity: 0, transform: 'translate3d(0,24px,0)' }, { opacity: 1, transform: 'none' }], { duration: 'dur-slow', easing: 'ease-out', delay: 380 + i * dur('stagger-base') });
        });
        motion.animate(pn.querySelector('.lab-modal__surface'), [{ opacity: 0 }, { opacity: 1 }], { duration: 'dur-base', delay: 200 });
      } else {
        motion.animate(pn, [{ opacity: 0, transform: 'translate3d(0,48px,0)' }, { opacity: 1, transform: 'none' }], { duration: 'dur-slow', easing: 'ease-out' });
      }
    } else {
      lock.style.overflow = '';
      motion.animate(sc, [{ opacity: 1 }, { opacity: 0 }], { duration: 'dur-base', easing: 'ease-in' });
      const a = motion.animate(pn, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translate3d(0,24px,0)' }], { duration: 'dur-base', easing: 'ease-in' });
      if (a) a.onfinish = () => setMounted(false);
      else setMounted(false);
    }
    return () => {
      lock.style.overflow = '';
    };
  }, [open, mounted]);
  if (!mounted) return null;
  const node = (
    <div ref={ref} className={cx('lab-modal', `lab-modal--${p.variant || 'dialog'}`)} role="dialog" aria-modal="true" aria-labelledby={tid}>
      <div ref={scrim} className="lab-modal__scrim" onClick={onClose} />
      <div ref={panel} className="lab-modal__panel">
        <div className="lab-modal__surface" aria-hidden="true" />
        <div className="lab-modal__bar">
          <h2 id={tid} className="lab-t-h5 lab-modal__title">
            {p.title}
          </h2>
          <IconButton label="닫기" icon="close" size="s" onClick={onClose} autoFocus />
        </div>
        <div className="lab-modal__content">
          {p.variant === 'media' ? (
            p.children
          ) : (
            <>
              {p.hero || null}
              <div className="lab-modal__rest">{p.children}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
  return createPortal(node, document.body);
}
