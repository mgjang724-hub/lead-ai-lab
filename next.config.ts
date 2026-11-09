import type { NextConfig } from 'next';

/**
 * 정적 내보내기(output: 'export')로 빌드합니다 — 대학 서버·GitHub Pages·Vercel 어디에나 `out/` 폴더를 올리면 동작합니다.
 * 폼 전송 등 서버 기능을 붙일 때는 `output`을 제거하고 서버 액션 또는 외부 폼 서비스를 연결하세요.
 *
 * 참고: Dropbox/OneDrive 같은 클라우드 동기화 폴더 안에서는 기존 `.next/` 캐시 정리가 readlink EINVAL 로 실패하므로
 * `npm run build` / `npm run dev` 가 먼저 scripts/clean.mjs 로 `.next/` 와 `out/` 을 지웁니다 (package.json 의 prebuild/predev).
 *
 * basePath: GitHub Pages 프로젝트 사이트처럼 https://<host>/<repo>/ 하위에 배포할 때는 NEXT_PUBLIC_BASE_PATH="/<repo>" 를 지정합니다
 * (.github/workflows/deploy.yml 이 자동으로 넣음). 루트 도메인(학교 서버·커스텀 도메인)에 올릴 때는 비워 두면 됩니다.
 * next/link·router 는 자동으로 붙지만 public/ 자산을 직접 가리키는 경로(<img src>, 폰트 preload, CSS url())는 lib/base-path.ts 의 withBasePath 로 감쌉니다.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  // basePath 가 있을 때 홈("/") 링크가 "/<repo>" 로 정규화되면 클라이언트 라우터가 RSC 페이로드를 "/<repo>.txt" 에서 찾아 404 → 전체 새로고침으로
  // 떨어집니다. 트레일링 슬래시 정규화를 끄면 "/<repo>/" → "/<repo>/index.txt" 를 요청해 정상적인 클라이언트 전환(커튼 애니메이션)이 됩니다.
  skipTrailingSlashRedirect: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
