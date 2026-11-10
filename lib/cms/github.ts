/**
 * 실제 GitHub 저장소 백엔드 — 브라우저에서 GitHub REST API 를 직접 부릅니다(서버 없음).
 * 토큰은 로그인한 사람의 것이므로, GitHub 가 그 사람에게 준 권한(저장소 협업자 역할)만큼만 할 수 있습니다.
 */
import { base64ToUtf8 } from './encoding';
import { CmsError, type CmsUser, type DeployInfo, type FileChange, type PullInfo, type RepoBackend, type Role } from './types';

const API = 'https://api.github.com';

/* GitHub 응답 중 쓰는 부분만 */
interface GhContent {
  type: string;
  sha: string;
  size: number;
  content?: string;
  encoding?: string;
}
interface GhPull {
  number: number;
  html_url: string;
}

const encodePath = (p: string) => p.split('/').map(encodeURIComponent).join('/');

function toError(status: number, data: { message?: string; errors?: unknown } | undefined): CmsError {
  const msg = data?.message ?? '';
  if (status === 401) return new CmsError('unauthorized', '로그인이 만료되었습니다. 다시 로그인해 주세요.', data);
  if (status === 403 && /rate limit/i.test(msg)) return new CmsError('forbidden', 'GitHub 요청 한도를 넘었습니다. 잠시 뒤 다시 시도해 주세요.', data);
  if (/rule violation|protected branch/i.test(msg)) return new CmsError('rule-violation', '저장소 보호 규칙 때문에 바로 저장할 수 없습니다.', data);
  if (status === 403) return new CmsError('forbidden', '이 작업을 할 권한이 없습니다. 연구실 관리자에게 권한을 확인해 주세요.', data);
  if (status === 404) return new CmsError('not-found', '저장소나 파일을 찾을 수 없습니다.', data);
  if (status === 422 && /fast.forward/i.test(msg)) return new CmsError('not-fast-forward', '다른 저장이 먼저 반영되었습니다.', data);
  if (status === 405 || status === 409) return new CmsError('not-mergeable', '지금은 병합할 수 없습니다.', data);
  return new CmsError('unknown', `GitHub 오류 (${status}) ${msg}`.trim(), data);
}

export class GitHubBackend implements RepoBackend {
  readonly kind = 'github' as const;
  readonly repoLabel: string;
  readonly webUrl: string;

  constructor(
    private token: string,
    private owner: string,
    private repo: string,
    readonly branch: string,
  ) {
    this.repoLabel = `${owner}/${repo}`;
    this.webUrl = `https://github.com/${owner}/${repo}`;
  }

  private get base() {
    return `/repos/${this.owner}/${this.repo}`;
  }

  private async req<T>(method: string, path: string, body?: unknown): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${API}${path}`, {
        method,
        cache: 'no-store',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new CmsError('network', 'GitHub 에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.', e);
    }
    const text = res.status === 204 ? '' : await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      data = undefined;
    }
    if (!res.ok) throw toError(res.status, data as { message?: string });
    return data as T;
  }

  async getUser(): Promise<CmsUser> {
    const u = await this.req<{ login: string; id: number; name: string | null; avatar_url: string }>('GET', '/user');
    let role: Role = 'none';
    try {
      const r = await this.req<{ permissions?: { admin?: boolean; maintain?: boolean; push?: boolean } }>('GET', this.base);
      // 쓰기 권한(Write·Maintain·Admin)이 있으면 편집자 — 관리자 구분은 두지 않습니다
      const p = r.permissions;
      if (p) role = p.admin || p.maintain || p.push ? 'editor' : 'none';
      else {
        const c = await this.req<{ permission: string; role_name?: string }>('GET', `${this.base}/collaborators/${encodeURIComponent(u.login)}/permission`);
        role = ['admin', 'maintain', 'write'].includes(c.permission) || c.role_name === 'maintain' ? 'editor' : 'none';
      }
    } catch (e) {
      if (e instanceof CmsError && e.code === 'unauthorized') throw e;
      role = 'none';
    }
    return { login: u.login, id: u.id, name: u.name || u.login, avatarUrl: u.avatar_url, role };
  }

  async getHead(branch: string): Promise<string | null> {
    try {
      const r = await this.req<{ object: { sha: string } }>('GET', `${this.base}/git/ref/heads/${encodePath(branch)}`);
      return r.object.sha;
    } catch (e) {
      if (e instanceof CmsError && e.code === 'not-found') return null;
      throw e;
    }
  }

  private async content(path: string, ref: string): Promise<GhContent | null> {
    try {
      const r = await this.req<GhContent | GhContent[]>('GET', `${this.base}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`);
      if (Array.isArray(r) || r.type !== 'file') return null;
      return r;
    } catch (e) {
      if (e instanceof CmsError && e.code === 'not-found') return null;
      throw e;
    }
  }

  async readBase64(path: string, ref: string): Promise<string | null> {
    const c = await this.content(path, ref);
    if (!c) return null;
    if (c.content && c.encoding === 'base64') return c.content.replace(/\s/g, '');
    // 1MB 가 넘는 파일은 contents 응답에 내용이 없음 → blob 으로
    const blob = await this.req<{ content: string }>('GET', `${this.base}/git/blobs/${c.sha}`);
    return blob.content.replace(/\s/g, '');
  }

  async readText(path: string, ref: string): Promise<string | null> {
    const b64 = await this.readBase64(path, ref);
    return b64 === null ? null : base64ToUtf8(b64);
  }

  async blobSha(path: string, ref: string): Promise<string | null> {
    return (await this.content(path, ref))?.sha ?? null;
  }

  async createCommit(input: { parent: string; changes: FileChange[]; message: string; author?: { name: string; email: string } }): Promise<string> {
    const parent = await this.req<{ tree: { sha: string } }>('GET', `${this.base}/git/commits/${input.parent}`);
    const tree: Record<string, unknown>[] = [];
    for (const c of input.changes) {
      if ('remove' in c) tree.push({ path: c.path, mode: '100644', type: 'blob', sha: null });
      else if ('text' in c) tree.push({ path: c.path, mode: '100644', type: 'blob', content: c.text });
      else if ('base64' in c) {
        const blob = await this.req<{ sha: string }>('POST', `${this.base}/git/blobs`, { content: c.base64, encoding: 'base64' });
        tree.push({ path: c.path, mode: '100644', type: 'blob', sha: blob.sha });
      } else tree.push({ path: c.path, mode: '100644', type: 'blob', sha: c.blobSha });
    }
    const t = await this.req<{ sha: string }>('POST', `${this.base}/git/trees`, { base_tree: parent.tree.sha, tree });
    const commit = await this.req<{ sha: string }>('POST', `${this.base}/git/commits`, {
      message: input.message,
      tree: t.sha,
      parents: [input.parent],
      ...(input.author ? { author: { ...input.author, date: new Date().toISOString() } } : {}),
    });
    return commit.sha;
  }

  async setBranch(branch: string, sha: string, opts: { force: boolean; create?: boolean }): Promise<void> {
    if (opts.create) await this.req('POST', `${this.base}/git/refs`, { ref: `refs/heads/${branch}`, sha });
    else await this.req('PATCH', `${this.base}/git/refs/heads/${encodePath(branch)}`, { sha, force: opts.force });
  }

  async deleteBranch(branch: string): Promise<void> {
    try {
      await this.req('DELETE', `${this.base}/git/refs/heads/${encodePath(branch)}`);
    } catch (e) {
      if (e instanceof CmsError && (e.code === 'not-found' || e.code === 'unknown')) return;
      throw e;
    }
  }

  async createPull(input: { title: string; body: string; head: string; base: string }): Promise<PullInfo> {
    const p = await this.req<GhPull>('POST', `${this.base}/pulls`, { ...input, maintainer_can_modify: true });
    return { number: p.number, url: p.html_url };
  }

  async mergePull(number: number, input: { sha: string; title: string }): Promise<void> {
    try {
      await this.req('PUT', `${this.base}/pulls/${number}/merge`, { merge_method: 'squash', sha: input.sha, commit_title: input.title });
    } catch (e) {
      // 저장소 설정에서 squash 병합을 꺼 두었으면 일반 병합으로
      if (e instanceof CmsError && e.code === 'not-mergeable' && /squash/i.test(JSON.stringify(e.detail ?? ''))) {
        await this.req('PUT', `${this.base}/pulls/${number}/merge`, { merge_method: 'merge', sha: input.sha, commit_title: input.title });
        return;
      }
      throw e;
    }
  }

  async latestDeploy(): Promise<DeployInfo | null> {
    try {
      const r = await this.req<{ workflow_runs: { status: string; conclusion: string | null; html_url: string; created_at: string; updated_at: string }[] }>(
        'GET',
        `${this.base}/actions/runs?branch=${encodeURIComponent(this.branch)}&event=push&per_page=1`,
      );
      const run = r.workflow_runs[0];
      return run ? { status: run.status, conclusion: run.conclusion, url: run.html_url, createdAt: run.created_at, updatedAt: run.updated_at } : null;
    } catch (e) {
      if (e instanceof CmsError && e.code === 'unauthorized') throw e;
      return null;
    }
  }
}
