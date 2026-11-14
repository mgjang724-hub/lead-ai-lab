/**
 * CMS 설정 — 값은 빌드할 때 환경 변수로 들어옵니다(.github/workflows/deploy.yml).
 *
 * - NEXT_PUBLIC_CMS_REPO      "소유자/저장소" — 배포 워크플로가 github.repository 로 자동 지정 (저장소를 옮겨도 그대로 동작)
 * - NEXT_PUBLIC_CMS_BRANCH    게시 브랜치 — 기본 main
 * - NEXT_PUBLIC_CMS_AUTH_URL  로그인 중계 서버(cms-auth/worker.js) 주소 — 저장소 Settings › Variables 의 CMS_AUTH_URL
 *
 * 로컬에서 실제 저장소에 연결해 보려면 .env.local 에 같은 이름으로 적습니다. 비워 두면 개발 서버에서는 체험 모드만 쓸 수 있습니다.
 */
export const cmsConfig = {
  repo: process.env.NEXT_PUBLIC_CMS_REPO || '',
  branch: process.env.NEXT_PUBLIC_CMS_BRANCH || 'main',
  authUrl: (process.env.NEXT_PUBLIC_CMS_AUTH_URL || '').replace(/\/+$/, ''),
  /** 개발 서버(npm run dev)에서만 체험 모드(가짜 저장소)를 켭니다 — 배포본에는 체험 모드 코드가 들어가지 않습니다 */
  mockEnabled: process.env.NODE_ENV === 'development',
};

export function repoParts(): { owner: string; name: string } | null {
  const [owner, name] = cmsConfig.repo.split('/');
  return owner && name ? { owner, name } : null;
}

/** 편집자용 사용 안내(docs/홈페이지-관리-가이드.md)를 GitHub 에서 여는 주소 — 저장소 설정이 없으면(체험 모드 등) 빈 문자열 */
export function guideUrl(): string {
  return cmsConfig.repo ? `https://github.com/${cmsConfig.repo}/blob/${cmsConfig.branch}/docs/${encodeURIComponent('홈페이지-관리-가이드.md')}` : '';
}

/** 보호 규칙 때문에 Pull Request 를 거쳐 게시할 때 CMS 가 잠깐 만드는 브랜치 접두어 */
export const CMS_BRANCH_PREFIX = 'cms/';
