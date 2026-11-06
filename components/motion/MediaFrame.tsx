'use client';
import { forwardRef, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cx, dur, ease, motion, type DurToken } from '@/lib/motion/core';
import { useIso, useMergedRef, useScrollLink } from '@/lib/motion/hooks';

export interface MediaFrameProps {
  /** "4/5", "16/10", "21/9" … */
  ratio?: string;
  src?: string | null;
  alt?: string;
  /** placeholder 용도 라벨 (실제 이미지가 없을 때) */
  label?: string;
  tone?: 'navy' | 'gray';
  reveal?: 'clip' | 'expand' | 'none';
  trigger?: 'view' | 'mount';
  delay?: DurToken | number;
  /** 0–1 */
  parallax?: number;
  caption?: ReactNode;
  eager?: boolean;
  replay?: unknown;
  className?: string;
  style?: CSSProperties;
  /** <img> 의 sizes 힌트 */
  sizes?: string;
}

/* MediaFrame — 이미지 또는 조용한 대체 면(이미지가 없을 때: 무늬 면 + 짧은 라벨만, 개발용 표시 없음). reveal: clip(아래에서) | expand(중앙 슬릿에서) | none. */
export const MediaFrame = forwardRef<HTMLElement, MediaFrameProps>(function MediaFrame(p, fref) {
  const ref = useRef<HTMLElement>(null);
  const inner = useRef<HTMLElement>(null);
  const mref = useMergedRef<HTMLElement>(ref, fref);
  const [loaded, setLoaded] = useState(!p.src);
  // 서버 HTML 의 eager/캐시된 이미지는 hydration 전에 로드가 끝나 onLoad 가 오지 않으므로 마운트 시 complete 를 확인합니다.
  useEffect(() => {
    const el = inner.current;
    if (p.src && el instanceof HTMLImageElement && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, [p.src]);
  const reveal = p.reveal || 'clip';
  const trigger = p.trigger || 'view';
  const { delay, replay } = p;
  useIso(() => {
    const el = ref.current;
    const im = inner.current;
    if (!el) return;
    const ready = () => el.setAttribute('data-reveal-ready', '');
    if (reveal === 'none' || motion.reduced() || !el.animate) {
      ready();
      return;
    }
    const dl = typeof delay === 'string' ? dur(delay) : delay || 0;
    const kf: Keyframe[] =
      reveal === 'expand'
        ? [{ clipPath: 'inset(0% 49.5% 0% 49.5%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }]
        : [{ clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }];
    const D = dur(reveal === 'expand' ? 'dur-cinematic' : 'dur-slower');
    const a = el.animate(kf, { duration: D, easing: ease('ease-in-out'), delay: dl, fill: 'both' });
    const b = im?.animate([{ transform: `scale(${reveal === 'expand' ? 1.4 : 1.18})` }, { transform: 'scale(1)' }], { duration: D + 300, easing: ease('ease-out'), delay: dl, fill: 'both' });
    a.pause();
    b?.pause();
    a.onfinish = () => {
      try {
        a.cancel();
      } catch {}
    };
    if (b)
      b.onfinish = () => {
        try {
          b.cancel();
        } catch {}
      };
    ready();
    const play = () => {
      a.play();
      b?.play();
    };
    let io: IntersectionObserver | null = null;
    if (trigger === 'mount' || !window.IntersectionObserver) requestAnimationFrame(play);
    else {
      io = new IntersectionObserver(
        (es) => {
          es.forEach((e) => {
            if (e.isIntersecting) {
              play();
              io?.disconnect();
            }
          });
        },
        { rootMargin: '0px 0px -10% 0px' },
      );
      io.observe(el);
    }
    return () => {
      io?.disconnect();
      try {
        a.cancel();
        b?.cancel();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal, trigger, replay]);
  const px = p.parallax || 0;
  useScrollLink(
    ref,
    (pr) => {
      if (!px || motion.reduced() || !inner.current) return;
      const wrap = inner.current.parentNode as HTMLElement;
      wrap.style.transform = `translate3d(0,${((pr - 0.5) * px * -18).toFixed(2)}%,0)`;
    },
    [px],
  );
  const tone = p.tone || 'navy';
  const ratio = p.ratio || '4/5';
  const body = p.src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={inner as React.RefObject<HTMLImageElement>}
      className={cx('lab-media__img', loaded && 'is-loaded')}
      src={p.src}
      alt={p.alt || ''}
      loading={p.eager ? 'eager' : 'lazy'}
      fetchPriority={p.eager ? 'high' : undefined}
      decoding="async"
      sizes={p.sizes}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
    />
  ) : (
    <div
      ref={inner as React.RefObject<HTMLDivElement>}
      className="lab-media__img lab-media__ph"
      role={p.alt || p.label ? 'img' : undefined}
      aria-label={p.alt || p.label || undefined}
      aria-hidden={p.alt || p.label ? undefined : true}
    >
      {p.label ? (
        <span className="lab-media__label" aria-hidden="true">
          <span>{p.label}</span>
        </span>
      ) : null}
    </div>
  );
  return (
    <figure
      ref={mref as React.Ref<HTMLElement>}
      className={cx('lab-media', `lab-media--${tone}`, !loaded && 'is-loading', px && 'has-parallax', p.className)}
      style={p.style}
      data-reveal={reveal !== 'none' ? '' : undefined}
    >
      <div className="lab-media__frame" style={{ aspectRatio: ratio }}>
        <div className="lab-media__px">{body}</div>
      </div>
      {p.caption ? <figcaption className="lab-media__cap">{p.caption}</figcaption> : null}
    </figure>
  );
});
