import type { NextConfig } from 'next';

/**
 * 정적 내보내기(output: 'export')로 빌드합니다 — 대학 서버·GitHub Pages·Vercel 어디에나 `out/` 폴더를 올리면 동작합니다.
 * 폼 전송 등 서버 기능을 붙일 때는 `output`을 제거하고 서버 액션 또는 외부 폼 서비스를 연결하세요.
 *
 * 참고: Dropbox/OneDrive 같은 클라우드 동기화 폴더 안에서는 기존 `.next/` 캐시 정리가 readlink EINVAL 로 실패하므로
 * `npm run build` / `npm run dev` 가 먼저 scripts/clean.mjs 로 `.next/` 와 `out/` 을 지웁니다 (package.json 의 prebuild/predev).
 */
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
