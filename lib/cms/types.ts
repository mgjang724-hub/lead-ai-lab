/**
 * CMS 공통 타입.
 *
 * 역할은 하나뿐입니다 — 저장소에 쓰기 권한이 있는 사람(편집자)이 바뀐 내용을 확인하고 바로 게시합니다(2026-11-10 연구실 결정:
 * 관리자 승인 단계 없음). 누가 무엇을 바꿨는지는 커밋 기록에 남고, 언제든 되돌릴 수 있습니다.
 *
 * 관리자 화면(/admin)은 서버 없이 브라우저에서 GitHub API 로 저장소 파일(content/data/*.json, public/images/…)을 직접 고칩니다.
 * 저장소에 접근하는 부분은 RepoBackend 하나로 감싸 두어, 실제 GitHub(github.ts)와 개발용 체험 저장소(mock.ts)를 바꿔 끼울 수 있습니다.
 */

/** editor: 저장소 쓰기 권한(Write 이상)이 있어 바뀐 내용을 확인한 뒤 바로 게시 / none: 쓰기 권한 없음 */
export type Role = 'editor' | 'none';

export interface CmsUser {
  login: string;
  id: number;
  name: string;
  avatarUrl: string;
  role: Role;
}

/** 커밋 하나에 담을 파일 변경 */
export type FileChange =
  | { path: string; text: string }
  | { path: string; base64: string }
  | { path: string; blobSha: string }
  | { path: string; remove: true };

/** 저장소 보호 규칙 때문에 바로 저장할 수 없을 때 거쳐 가는 Pull Request (만들자마자 병합) */
export interface PullInfo {
  number: number;
  url: string;
}

export interface DeployInfo {
  /** queued | in_progress | completed … */
  status: string;
  /** success | failure | cancelled … (completed 일 때) */
  conclusion: string | null;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommitAuthor {
  name: string;
  email: string;
}

export interface RepoBackend {
  readonly kind: 'github' | 'mock';
  /** 저장소 이름 (화면 표시용, 예: "mgjang724-hub/lead-ai-lab") */
  readonly repoLabel: string;
  /** 게시 브랜치 (main) */
  readonly branch: string;
  /** 저장소 웹 주소 (GitHub 에서 보기 링크용) */
  readonly webUrl: string;
  getUser(): Promise<CmsUser>;
  /** 브랜치 최신 커밋. 없으면 null */
  getHead(branch: string): Promise<string | null>;
  /** 파일 내용(UTF-8). 없으면 null */
  readText(path: string, ref: string): Promise<string | null>;
  /** 파일 내용(base64, 이미지 미리보기용). 없으면 null */
  readBase64(path: string, ref: string): Promise<string | null>;
  /** 파일의 blob sha — 파일이 있는지 확인하거나 다른 커밋의 파일을 그대로 옮길 때. 없으면 null */
  blobSha(path: string, ref: string): Promise<string | null>;
  createCommit(input: { parent: string; changes: FileChange[]; message: string; author?: CommitAuthor }): Promise<string>;
  /** 브랜치를 커밋으로 옮김. create: 새 브랜치. force=false 인데 앞서가지 않으면 CmsError('not-fast-forward') */
  setBranch(branch: string, sha: string, opts: { force: boolean; create?: boolean }): Promise<void>;
  deleteBranch(branch: string): Promise<void>;
  createPull(input: { title: string; body: string; head: string; base: string }): Promise<PullInfo>;
  /** sha 가 PR 머리와 같을 때만 병합. 병합할 수 없으면 CmsError('not-mergeable') */
  mergePull(number: number, input: { sha: string; title: string }): Promise<void>;
  /** 최근 사이트 배포(GitHub Actions) 상태. 권한이 없으면 null */
  latestDeploy(): Promise<DeployInfo | null>;
}

export type CmsErrorCode =
  | 'not-fast-forward'
  | 'rule-violation'
  | 'not-mergeable'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'validation'
  | 'network'
  | 'unknown';

export class CmsError extends Error {
  constructor(
    public code: CmsErrorCode,
    message: string,
    public detail?: unknown,
  ) {
    super(message);
    this.name = 'CmsError';
  }
}

export function isCmsError(e: unknown, code?: CmsErrorCode): e is CmsError {
  return e instanceof CmsError && (code === undefined || e.code === code);
}

/** 사람이 읽을 오류 문장 */
export function errorMessage(e: unknown): string {
  if (e instanceof CmsError) return e.message;
  if (e instanceof Error) return e.message;
  return String(e);
}
