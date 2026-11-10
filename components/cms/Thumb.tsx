'use client';
import { useState } from 'react';
import { withBasePath } from '@/lib/base-path';

/**
 * 목록·검토 화면의 작은 사진. src 가 data URL 이면 그대로, "/images/…" 면 사이트 주소로.
 * 방금 저장해 아직 사이트에 배포되지 않은 사진은 불러오지 못하므로 그때는 글자 자리표시로 보여 줍니다.
 */
export function Thumb({ src, label, ratio = 'portrait' }: { src: string | null | undefined; label: string; ratio?: 'portrait' | 'landscape' }) {
  const url = src ? (src.startsWith('data:') ? src : withBasePath(src)) : null;
  const [failed, setFailed] = useState<string | null>(null);
  const show = url && failed !== url;
  return (
    <span className={`cms-thumb cms-thumb--${ratio}`} aria-hidden="true">
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" loading="lazy" onError={() => setFailed(url)} />
      ) : (
        <span className="cms-thumb__ph">{label.slice(0, 1)}</span>
      )}
    </span>
  );
}
