'use client';
import { useEffect, useRef } from 'react';
import { SPRINGS, Spring, clamp, cx, dur, motion } from '@/lib/motion/core';
import { useHtmlAttr } from '@/lib/motion/hooks';

/* FieldLattice — 시그니처 배경: 그리드 위 점 격자가 포인터 주변에서 렌즈처럼 휘고 천천히 숨 쉼.
   화면 밖·숨은 탭에서는 정지, reduced motion 에서는 정적. 장식 (aria-hidden). Home Hero 전용. */
export function FieldLattice(p: { gap?: number; radius?: number; className?: string; replay?: unknown }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const theme = useHtmlAttr('data-theme');
  const mo = useHtmlAttr('data-motion');
  const { gap: gapProp, radius, replay } = p;
  useEffect(() => {
    const canvas = cv.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0;
    let H = 0;
    let pts: { x: number; y: number; d: number }[] = [];
    let raf = 0;
    let visible = true;
    const t0 = performance.now();
    let gap = gapProp || 28;
    const R = radius || 170;
    const still = motion.reduced();
    const fine = motion.finePointer();
    const cs = getComputedStyle(canvas);
    const cDot = cs.getPropertyValue('--lattice-dot').trim() || '#acbbc6';
    const cAct = cs.getPropertyValue('--lattice-dot-active').trim() || '#16254f';
    let px = -9999;
    let py = -9999;
    let has = false;
    const sx = new Spring(-9999, SPRINGS.gentle, (v) => (px = v));
    const sy = new Spring(-9999, SPRINGS.gentle, (v) => (py = v));
    const size = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width;
      H = r.height;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = W < 768 ? 22 : gapProp || 28;
      pts = [];
      const cols = Math.ceil(W / gap) + 1;
      const rows = Math.ceil(H / gap) + 1;
      const ox = (W - (cols - 1) * gap) / 2;
      const oy = (H - (rows - 1) * gap) / 2;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) pts.push({ x: ox + i * gap, y: oy + j * gap, d: Math.hypot(i / cols, (rows - j) / rows) });
    };
    const draw = (now: number) => {
      raf = 0;
      if (!W) return;
      const t = (now - t0) / 1000;
      const intro = still ? 1 : clamp(t / ((dur('dur-cinematic') / 1000) * 1.4), 0, 1);
      if (!has && !still) {
        /* 포인터가 없을 때(터치·대기) 가상의 렌즈가 천천히 떠돎 */
        sx.set(W * (0.62 + 0.22 * Math.sin(t * 0.21)));
        sy.set(H * (0.48 + 0.26 * Math.cos(t * 0.17)));
      }
      ctx.clearRect(0, 0, W, H);
      const lx = px;
      const ly = py;
      const R2 = R * R;
      for (let k = 0; k < pts.length; k++) {
        const q = pts[k];
        const a = clamp((intro * 1.6 - q.d * 0.6) * 1.6, 0, 1);
        if (a <= 0) continue;
        let x = q.x;
        let y = q.y + (still ? 0 : Math.sin(t * 0.8 + q.x * 0.012) * 1.4);
        const dx = x - lx;
        const dy = y - ly;
        const d2 = dx * dx + dy * dy;
        let near = 0;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1;
          near = 1 - d / R;
          const push = near * near * 22;
          x += (dx / d) * push;
          y += (dy / d) * push;
        }
        const r = 0.9 + near * 1.6;
        ctx.globalAlpha = a * (0.55 + near * 0.45);
        ctx.fillStyle = near > 0.15 ? cAct : cDot;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!still && visible && !document.hidden) raf = requestAnimationFrame(draw);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const move = (e: PointerEvent) => {
      if (!fine) return;
      const r = canvas.getBoundingClientRect();
      has = true;
      sx.set(e.clientX - r.left);
      sy.set(e.clientY - r.top);
      kick();
    };
    const out = () => (has = false);
    size();
    kick();
    const host = canvas.parentNode as HTMLElement;
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', out);
    const ro = window.ResizeObserver
      ? new ResizeObserver(() => {
          size();
          kick();
        })
      : null;
    ro?.observe(canvas);
    const io = window.IntersectionObserver
      ? new IntersectionObserver((es) => {
          visible = es[0].isIntersecting;
          if (visible) kick();
        })
      : null;
    io?.observe(canvas);
    const vis = () => {
      if (!document.hidden) kick();
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      sx.stop();
      sy.stop();
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', out);
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener('visibilitychange', vis);
    };
  }, [theme, mo, replay, gapProp, radius]);
  return <canvas ref={cv} className={cx('lab-lattice', p.className)} aria-hidden="true" />;
}
