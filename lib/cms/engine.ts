/**
 * 저장 엔진 — 편집자가 확인한 변경을 게시 브랜치(main)에 커밋합니다(= 공개 사이트 배포).
 *
 * 모든 저장은 같은 순서를 따릅니다.
 *   1) 게시 브랜치(main)의 최신 커밋을 읽고
 *   2) 그 시점 파일에 변경 작업(ops)을 다시 적용한 뒤 검사하고
 *   3) 커밋을 만들어 브랜치를 옮깁니다. 그 사이 다른 사람이 먼저 저장했으면(앞서가지 않음) 1) 부터 다시 합니다.
 * 다른 사람이 같은 항목의 다른 칸을 고쳤으면 칸 단위로 합치고(ops.ts mergeItem), 같은 칸이면 conflict 오류로 알립니다.
 */
import { CMS_BRANCH_PREFIX } from './config';
import { PROJECTS_FILE, collections, dataFiles, itemsOf, keyOf, toRepoPath } from './collections';
import { applyOps, assertAssetPath, describeOp, isDataOp, opsTitle, type Conflict, type Op } from './ops';
import { validateItem } from './validate';
import { CmsError, isCmsError, type CmsUser, type CommitAuthor, type FileChange, type RepoBackend } from './types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 공개 저장소의 커밋에 개인 이메일이 남지 않도록 GitHub 의 noreply 주소를 씁니다 */
export function authorOf(user: { login: string; id: number; name?: string }): CommitAuthor {
  return { name: user.name || user.login, email: `${user.id}+${user.login}@users.noreply.github.com` };
}

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function headOf(backend: RepoBackend): Promise<string> {
  const head = await backend.getHead(backend.branch);
  if (!head) throw new CmsError('not-found', `${backend.branch} 브랜치를 찾을 수 없습니다.`);
  return head;
}

export async function readJson(backend: RepoBackend, path: string, ref: string): Promise<unknown> {
  const text = await backend.readText(path, ref);
  if (text === null) throw new CmsError('not-found', `${path} 파일이 저장소에 없습니다.`);
  try {
    return JSON.parse(text);
  } catch {
    throw new CmsError('validation', `${path} 파일을 읽을 수 없습니다 (JSON 형식 오류).`);
  }
}

/* ------------------------------------------------------------ 읽기 */

export interface ProjectRef {
  id: string;
  title: string;
  period: string;
}

export interface RepoSnapshot {
  head: string;
  /** 경로 → 파싱한 JSON */
  files: Record<string, unknown>;
  projects: ProjectRef[];
}

export async function loadSnapshot(backend: RepoBackend): Promise<RepoSnapshot> {
  const head = await headOf(backend);
  const files: Record<string, unknown> = {};
  await Promise.all(
    dataFiles.map(async (p) => {
      files[p] = await readJson(backend, p, head);
    }),
  );
  let projects: ProjectRef[] = [];
  try {
    const pj = files[PROJECTS_FILE] ?? (await readJson(backend, PROJECTS_FILE, head));
    projects = itemsOf(pj, 'items').map((x) => ({ id: String(x.id), title: String(x.title ?? ''), period: String(x.period ?? '') }));
  } catch {
    projects = [];
  }
  return { head, files, projects };
}

/* ------------------------------------------------------- 변경 만들기 */

/** ops 를 ref 시점 파일에 적용하고 검사해, 커밋할 파일 변경 목록을 만듭니다 */
export async function prepareChanges(backend: RepoBackend, ref: string, ops: Op[]): Promise<{ changes: FileChange[]; conflicts: Conflict[] }> {
  const dataPaths = Array.from(new Set(ops.filter(isDataOp).map((op) => collections[op.collection].file)));
  const files: Record<string, unknown> = {};
  for (const p of dataPaths) files[p] = await readJson(backend, p, ref);
  const { conflicts, keys } = applyOps(files, ops);

  const putPaths = new Set(ops.flatMap((op) => (op.kind === 'putFile' ? [op.path] : [])));
  const deletePaths = new Set(ops.flatMap((op) => (op.kind === 'deleteFile' ? [op.path] : [])));

  let projectIds: Set<string> | null = null;
  if (ops.some((op) => op.kind === 'upsert' && Array.isArray(op.item.projects) && op.item.projects.length)) {
    try {
      projectIds = new Set(itemsOf(await readJson(backend, PROJECTS_FILE, ref), 'items').map((x) => String(x.id)));
    } catch {
      projectIds = null;
    }
  }

  for (const op of ops) {
    if (op.kind !== 'upsert') continue;
    const def = collections[op.collection];
    const data = files[def.file];
    const key = keys.get(op) ?? op.key;
    const taken = new Set<string>();
    let count = 0;
    for (const arrayKey of def.uniqueAcross) {
      for (const it of itemsOf(data, arrayKey)) {
        const k = keyOf(it);
        if (k === key) count++;
        else taken.add(k);
      }
    }
    if (count > 1) throw new CmsError('validation', `"${key}" 를 쓰는 항목이 이미 있습니다.${def.autoKey ? '' : ' 다른 주소를 적어 주세요.'}`);
    // 다른 사람의 수정과 병합된, 실제로 저장될 항목을 검사
    const actual = itemsOf(data, def.arrayKey).find((x) => keyOf(x) === key) ?? op.item;
    const errors = validateItem(def, actual, { takenKeys: taken, projectIds, isNew: !op.before });
    const first = Object.values(errors)[0];
    if (first) throw new CmsError('validation', `${def.itemLabel} "${def.title(actual)}": ${first}`, errors);
    for (const f of def.fields) {
      if (f.type !== 'image') continue;
      const v = actual[f.name];
      if (typeof v !== 'string' || !v || v === op.before?.[f.name]) continue;
      const rp = toRepoPath(v);
      if (putPaths.has(rp)) continue;
      if (deletePaths.has(rp) || !(await backend.blobSha(rp, ref))) throw new CmsError('validation', `사진 파일을 찾을 수 없습니다: ${v}`);
    }
  }

  const changes: FileChange[] = dataPaths.map((p) => ({ path: p, text: `${JSON.stringify(files[p], null, 2)}\n` }));
  for (const op of ops) {
    if (op.kind === 'putFile') {
      assertAssetPath(op.path);
      if (op.base64) changes.push({ path: op.path, base64: op.base64 });
      else if (op.blobSha) changes.push({ path: op.path, blobSha: op.blobSha });
      else throw new CmsError('validation', `사진 데이터가 없습니다: ${op.path}`);
    } else if (op.kind === 'deleteFile') {
      assertAssetPath(op.path);
      if (putPaths.has(op.path)) continue;
      if (await backend.blobSha(op.path, ref)) changes.push({ path: op.path, remove: true });
    }
  }
  return { changes, conflicts };
}

/* ----------------------------------------------------------- 게시 */

export interface PublishResult {
  sha: string;
  /** 저장소 보호 규칙 때문에 Pull Request 를 거쳐 바로 병합한 경우 그 번호 */
  viaPull?: number;
}

function commitMessage(ops: Op[], footer: string): string {
  return `${opsTitle(ops)}\n\n${ops.map((o) => `- ${describeOp(o)}`).join('\n')}\n\n${footer}`;
}

/** 게시 — main 에 바로 커밋(= 공개 사이트 배포). 같은 칸을 다른 사람이 먼저 고쳤으면 force 없이는 conflict 오류 */
export async function publishDirect(backend: RepoBackend, user: CmsUser, ops: Op[], opts: { force?: boolean } = {}): Promise<PublishResult> {
  const message = commitMessage(ops, `관리자 화면에서 게시 (${user.login})`);
  for (let attempt = 0; attempt < 4; attempt++) {
    const head = await headOf(backend);
    const { changes, conflicts } = await prepareChanges(backend, head, ops);
    if (conflicts.length && !opts.force) throw new CmsError('conflict', '다른 사람이 먼저 이 항목을 수정했습니다.', conflicts);
    const sha = await backend.createCommit({ parent: head, changes, message, author: authorOf(user) });
    try {
      await backend.setBranch(backend.branch, sha, { force: false });
      return { sha };
    } catch (e) {
      if (isCmsError(e, 'not-fast-forward')) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      if (isCmsError(e, 'rule-violation')) {
        const n = await mergeThroughPull(backend, user, sha, ops);
        return { sha, viaPull: n };
      }
      throw e;
    }
  }
  throw new CmsError('unknown', '다른 저장과 겹쳐 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
}

/**
 * main 이 "Pull Request 필수" 규칙으로 보호되어 바로 올릴 수 없을 때 — PR 을 만들고 곧바로 병합합니다.
 * (설정 안내서는 이 규칙을 권하지 않지만, 나중에 누가 켜 두어도 저장이 막히지 않도록)
 */
async function mergeThroughPull(backend: RepoBackend, user: CmsUser, sha: string, ops: Op[]): Promise<number> {
  const login = user.login.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const branch = `${CMS_BRANCH_PREFIX}${login}-${stamp()}`;
  await backend.setBranch(branch, sha, { force: false, create: true });
  const title = opsTitle(ops);
  const pull = await backend.createPull({
    title,
    body: [
      '연구실 관리자 화면(CMS)에서 게시한 변경입니다. 저장소 보호 규칙 때문에 Pull Request 를 거쳐 바로 병합했습니다.',
      '',
      `- 게시한 사람: ${user.name} (${user.login})`,
      ...ops.map((o) => `- ${describeOp(o)}`),
    ].join('\n'),
    head: branch,
    base: backend.branch,
  });
  for (let i = 0; i < 4; i++) {
    try {
      await backend.mergePull(pull.number, { sha, title: `${title} (#${pull.number})` });
      break;
    } catch (e) {
      // 브랜치를 막 만든 직후에는 GitHub 가 병합 가능 여부를 계산하는 동안 잠깐 거절할 수 있음
      if (isCmsError(e, 'not-mergeable') && i < 3) {
        await sleep(1500 * (i + 1));
        continue;
      }
      throw e;
    }
  }
  await backend.deleteBranch(branch).catch(() => undefined);
  return pull.number;
}
