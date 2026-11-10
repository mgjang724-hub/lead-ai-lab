/**
 * 체험 모드용 가짜 저장소 — 개발 서버(npm run dev)에서만 쓰입니다. 배포본에는 들어가지 않습니다.
 *
 * 실제 GitHub 대신 브라우저 탭 안(sessionStorage)에 커밋·브랜치를 흉내 내어,
 * 저장소를 건드리지 않고 편집·확인·게시 흐름을 끝까지 시험해 볼 수 있습니다.
 */
import newsData from '@/content/data/news.json';
import membersData from '@/content/data/members.json';
import projectsData from '@/content/data/projects.json';
import publicationsData from '@/content/data/publications.json';
import { bytesToBase64, utf8ToBase64 } from './encoding';
import { CmsError, type CmsUser, type DeployInfo, type FileChange, type PullInfo, type RepoBackend } from './types';

interface MockCommit {
  sha: string;
  parent: string | null;
  /** 경로 → 텍스트 | "b64:<base64>" | "url:/images/…"(개발 서버의 기존 파일) */
  files: Record<string, string>;
  message: string;
}

interface MockState {
  commits: Record<string, MockCommit>;
  branches: Record<string, string>;
  pulls: { number: number; head: string; open: boolean }[];
  seq: number;
  deployAt: number | null;
}

const STORE_KEY = 'lead-cms:mock-store';

const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;

function initialFiles(): Record<string, string> {
  const files: Record<string, string> = {
    'content/data/news.json': json(newsData),
    'content/data/members.json': json(membersData),
    'content/data/projects.json': json(projectsData),
    'content/data/publications.json': json(publicationsData),
  };
  const pick = (list: unknown[], ...keys: string[]) => list.flatMap((x) => keys.map((k) => (x as Record<string, unknown>)[k]));
  const images = [
    ...pick(newsData.items, 'image'),
    ...pick(membersData.members, 'photo'),
    ...pick(membersData.alumni, 'photo'),
    ...pick(publicationsData.items, 'cover', 'abstractImage'),
    ...pick(projectsData.items, 'media'),
  ];
  for (const p of images) if (typeof p === 'string' && p.startsWith('/images/')) files[`public${p}`] = `url:${p}`;
  return files;
}

function safeSession(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export class MockBackend implements RepoBackend {
  readonly kind = 'mock' as const;
  readonly repoLabel = '체험용 가짜 저장소';
  readonly branch = 'main';
  readonly webUrl = '';
  private state: MockState;

  constructor() {
    const saved = safeSession()?.getItem(STORE_KEY);
    if (saved) {
      try {
        this.state = JSON.parse(saved) as MockState;
        if (!Array.isArray(this.state.pulls)) this.state.pulls = [];
        return;
      } catch {
        /* 새로 만듦 */
      }
    }
    const root: MockCommit = { sha: 'mock000000', parent: null, files: initialFiles(), message: '체험 시작' };
    this.state = { commits: { [root.sha]: root }, branches: { main: root.sha }, pulls: [], seq: 0, deployAt: null };
    this.save();
  }

  static reset() {
    safeSession()?.removeItem(STORE_KEY);
  }

  private save() {
    safeSession()?.setItem(STORE_KEY, JSON.stringify(this.state));
  }

  private nextSha() {
    this.state.seq += 1;
    return `mock${this.state.seq.toString(16).padStart(6, '0')}`;
  }

  private filesAt(ref: string): Record<string, string> {
    const sha = this.state.branches[ref] ?? ref;
    const c = this.state.commits[sha];
    if (!c) throw new CmsError('not-found', `체험 저장소에 ${ref} 가 없습니다.`);
    return c.files;
  }

  private isAncestor(ancestor: string, sha: string) {
    let cur: string | null = sha;
    while (cur) {
      if (cur === ancestor) return true;
      cur = this.state.commits[cur]?.parent ?? null;
    }
    return false;
  }

  async getUser(): Promise<CmsUser> {
    return { login: 'demo-editor', id: 2, name: '체험 편집자', avatarUrl: '', role: 'editor' };
  }

  async getHead(branch: string) {
    return this.state.branches[branch] ?? null;
  }

  async readText(path: string, ref: string) {
    const v = this.filesAt(ref)[path];
    if (v === undefined) return null;
    if (v.startsWith('b64:') || v.startsWith('url:')) throw new CmsError('validation', `${path} 는 텍스트 파일이 아닙니다.`);
    return v;
  }

  async readBase64(path: string, ref: string) {
    const v = this.filesAt(ref)[path];
    if (v === undefined) return null;
    if (v.startsWith('b64:')) return v.slice(4);
    if (v.startsWith('url:')) {
      const res = await fetch(v.slice(4));
      return res.ok ? bytesToBase64(new Uint8Array(await res.arrayBuffer())) : null;
    }
    return utf8ToBase64(v);
  }

  async blobSha(path: string, ref: string) {
    const sha = this.state.branches[ref] ?? ref;
    return this.filesAt(ref)[path] !== undefined ? `blob|${sha}|${path}` : null;
  }

  async createCommit(input: { parent: string; changes: FileChange[]; message: string }) {
    const files = { ...this.filesAt(input.parent) };
    for (const c of input.changes) {
      if ('remove' in c) delete files[c.path];
      else if ('text' in c) files[c.path] = c.text;
      else if ('base64' in c) files[c.path] = `b64:${c.base64}`;
      else {
        const [, ref, path] = c.blobSha.split('|');
        const v = ref && path ? this.filesAt(ref)[path] : undefined;
        if (v === undefined) throw new CmsError('not-found', `체험 저장소에서 ${c.path} 를 찾을 수 없습니다.`);
        files[c.path] = v;
      }
    }
    const sha = this.nextSha();
    this.state.commits[sha] = { sha, parent: input.parent, files, message: input.message };
    this.save();
    return sha;
  }

  async setBranch(branch: string, sha: string, opts: { force: boolean; create?: boolean }) {
    const cur = this.state.branches[branch];
    if (opts.create) {
      if (cur) throw new CmsError('unknown', `${branch} 브랜치가 이미 있습니다.`);
    } else {
      if (!cur) throw new CmsError('not-found', `${branch} 브랜치가 없습니다.`);
      if (!opts.force && !this.isAncestor(cur, sha)) throw new CmsError('not-fast-forward', '다른 저장이 먼저 반영되었습니다.');
    }
    this.state.branches[branch] = sha;
    if (branch === this.branch) this.state.deployAt = Date.now();
    this.save();
  }

  async deleteBranch(branch: string) {
    delete this.state.branches[branch];
    this.save();
  }

  /* 체험 저장소에는 보호 규칙이 없어 아래 두 메서드는 실제로 쓰이지 않지만, 같은 모양을 갖춰 둡니다 */
  async createPull(input: { title: string; body: string; head: string; base: string }): Promise<PullInfo> {
    const number = this.state.pulls.length + 1;
    this.state.pulls.push({ number, head: input.head, open: true });
    this.save();
    return { number, url: '' };
  }

  async mergePull(number: number, input: { sha: string; title: string }) {
    const p = this.state.pulls.find((x) => x.number === number);
    if (!p?.open || this.state.branches[p.head] !== input.sha) throw new CmsError('not-mergeable', '병합할 수 없습니다.');
    const main = this.state.branches[this.branch];
    if (this.state.commits[input.sha]?.parent !== main) throw new CmsError('not-mergeable', '게시 브랜치가 앞서 있습니다.');
    this.state.branches[this.branch] = input.sha;
    this.state.deployAt = Date.now();
    p.open = false;
    this.save();
  }

  async latestDeploy(): Promise<DeployInfo | null> {
    const at = this.state.deployAt;
    if (!at) return null;
    const done = Date.now() - at > 6000;
    const iso = new Date(at).toISOString();
    return { status: done ? 'completed' : 'in_progress', conclusion: done ? 'success' : null, url: '', createdAt: iso, updatedAt: iso };
  }
}
