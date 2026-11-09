/**
 * 배포 하위 경로(basePath) 헬퍼.
 *
 * GitHub Pages 프로젝트 사이트처럼 https://<host>/<repo>/ 아래에 배포하면 next.config.ts 의 basePath 가
 * NEXT_PUBLIC_BASE_PATH("/<repo>") 로 설정됩니다. next/link·useRouter 는 이 접두어를 자동으로 붙이지만,
 * public/ 폴더의 자산을 직접 가리키는 <img src>·<link rel="preload" href> 에는 붙지 않으므로 이 함수로 감쌉니다.
 * (CSS 의 @font-face url() 은 scripts/build-tokens.mjs 가 같은 환경변수를 읽어 생성합니다.)
 *
 * 루트 도메인에 배포할 때(환경변수 미지정)는 경로를 그대로 돌려줍니다.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** "/images/a.jpg" → "/<repo>/images/a.jpg". 절대 URL·이미 접두어가 붙은 경로·상대 경로는 그대로 둡니다. */
export function withBasePath(path: string): string {
  if (!basePath || !path.startsWith('/') || path.startsWith('//')) return path;
  if (path === basePath || path.startsWith(`${basePath}/`)) return path;
  return `${basePath}${path}`;
}
