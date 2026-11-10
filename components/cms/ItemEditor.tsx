'use client';
/** 항목 편집 — 입력 폼 + 미리보기 → '확인하고 게시' 를 누르면 바뀐 칸을 보여 주고, 확인하면 바로 게시합니다 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { collections, itemsOf, keyOf, moveTargets, nextKey, toPublicPath, toRepoPath, type CollectionId, type FieldDef, type Item } from '@/lib/cms/collections';
import { publishDirect } from '@/lib/cms/engine';
import { dataUrl } from '@/lib/cms/encoding';
import { findItem, mergeItem, normalizeItem, sameValue, type Conflict, type Op } from '@/lib/cms/ops';
import { validateItem, type FieldErrors } from '@/lib/cms/validate';
import { imageFileName, prepareImage, type PreparedImage } from '@/lib/cms/image';
import { errorMessage, isCmsError } from '@/lib/cms/types';
import { useCms } from './context';
import { FieldControl, type FieldEnv } from './fields';
import { ItemPreview } from './Preview';
import { ChangeTable, countChanges } from './ChangeTable';
import { Badge, Btn, Dialog, Notice, josa, timeAgo } from './ui';

const DRAFT_PREFIX = 'lead-cms:draft:';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** 이 항목 전용으로 CMS 가 올린 사진인지 ("/images/people/<주소>-xxxx.jpg" 또는 "<주소>.jpg") */
function ownedImage(path: unknown, dir: string, key: string): path is string {
  if (typeof path !== 'string' || !key) return false;
  const esc = key.replace(/[-]/g, '\\-');
  return new RegExp(`^/images/${dir}/${esc}(-[a-z0-9]+)?\\.(jpg|jpeg|png|webp)$`).test(path);
}

/** 게시 전 확인 창에 띄울 내용 — 이 ops 를 그대로 게시합니다 */
interface Pending {
  ops: Op[];
  item: Item;
  images: Record<string, string>;
}

const hasValue = (v: unknown) => v !== null && v !== undefined && v !== '' && v !== false && !(Array.isArray(v) && v.length === 0);

/** 옮기지 않는 칸을 안내할 때 쓰는 짧은 값 — 고르는 칸·한 줄 칸만 괄호로 보여 줌 */
function shortValue(f: FieldDef, v: unknown): string {
  if (f.type === 'select') return ` (${f.options?.find((o) => o.value === v)?.label ?? String(v)})`;
  if (f.type === 'text' && typeof v === 'string') return ` (${v.length > 24 ? `${v.slice(0, 23)}…` : v})`;
  if (f.type === 'tags' && Array.isArray(v)) return ` (${v.join(', ')})`;
  return '';
}

/**
 * itemKey: 고칠 항목의 키(null 이면 새 항목).
 * moveFrom: 다른 메뉴에서 옮겨 오는 항목의 키 (구성원 → 졸업생, collections.ts 의 moveFrom) — 새 항목처럼 채운 폼을 보여 주고,
 *           게시하면 원래 항목 삭제 + 같은 주소로 이 메뉴에 추가를 한 번에 커밋합니다.
 */
export function ItemEditor({ collection, itemKey, moveFrom = null }: { collection: CollectionId; itemKey: string | null; moveFrom?: string | null }) {
  const def = collections[collection];
  const { snapshot, user, backend, navigate, notify, fail, reload, setDirty, watchDeploy } = useCms();
  const move = moveFrom && def.moveFrom ? def.moveFrom : null;
  const srcDef = move ? collections[move.collection] : null;
  const isMove = move !== null;
  const isNew = itemKey === null;
  const draftKey = `${DRAFT_PREFIX}${collection}:${isMove ? `move:${moveFrom}` : (itemKey ?? 'new')}`;

  const [base, setBase] = useState<Item | null>(() => (itemKey && snapshot ? findItem(snapshot.files[def.file], def, itemKey) : null));
  /** 옮기기: 원래 메뉴의 항목 (게시할 때 이 내용 그대로인지 확인한 뒤 지움) */
  const [source, setSource] = useState<Item | null>(() => (srcDef && moveFrom && snapshot ? findItem(snapshot.files[srcDef.file], srcDef, moveFrom) : null));
  const [draft, setDraft] = useState<Item>(() => (base ? clone(base) : move && source ? move.convert(source) : def.defaults()));
  const [formKey, setFormKey] = useState(0);
  const [changed, setChanged] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [images, setImages] = useState<Record<string, PreparedImage>>({});
  const [imageBusy, setImageBusy] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState<null | 'save' | 'delete'>(null);
  const [confirming, setConfirming] = useState<Pending | null>(null);
  const [conflict, setConflict] = useState<{ list: Conflict[]; ops: Op[]; kind: 'save' | 'delete' } | null>(null);
  const [restorable, setRestorable] = useState<{ draft: Item; at: number } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  /* 주소(slug) — 새 항목은 손대기 전까지 이름·날짜로 자동 제안 */
  const takenKeys = useMemo(() => {
    const s = new Set<string>();
    for (const k of def.uniqueAcross) for (const it of itemsOf(snapshot?.files[def.file], k)) s.add(keyOf(it));
    if (itemKey) s.delete(itemKey);
    if (moveFrom) s.delete(moveFrom); // 옮기면 원래 항목은 지워지므로 같은 주소를 씀
    return s;
  }, [snapshot, def, itemKey, moveFrom]);

  const suggestion = useMemo(() => {
    const raw = def.suggestKey(draft);
    if (!takenKeys.has(raw)) return raw;
    let n = 2;
    while (takenKeys.has(`${raw}-${n}`)) n++;
    return `${raw}-${n}`;
  }, [def, draft, takenKeys]);
  /* 번호(id)로 구분하는 항목은 새로 만들 때 다음 번호를 미리 보여 주고, 게시할 때 확정(그새 누가 썼으면 다음 번호) */
  const KF = def.keyField;
  const autoKey = !!def.autoKey;
  const predictedKey = useMemo(() => (autoKey && isNew ? nextKey(def, snapshot?.files[def.file]) : ''), [autoKey, isNew, def, snapshot]);
  /** 이 항목의 키 — 주소(slug) 또는 번호(id) */
  const slug = isMove ? (moveFrom as string) : !isNew ? (itemKey as string) : autoKey ? predictedKey : slugTouched ? str(draft.slug) : suggestion;

  const projectIds = useMemo(() => (snapshot?.projects.length ? new Set(snapshot.projects.map((p) => p.id)) : null), [snapshot]);

  /** 저장할 모양으로 정리 (사진은 게시할 때 실제 파일 이름을 정함) */
  const finalize = (forSave: boolean) => {
    const replaced: Item = { ...draft, [KF]: slug };
    const puts: Op[] = [];
    for (const f of def.fields) {
      if (f.type !== 'image' || !f.image) continue;
      const v = replaced[f.name];
      if (typeof v === 'string' && v.startsWith('pending:') && images[v]) {
        const path = `/images/${f.image.dir}/${forSave ? imageFileName(slug) : `${slug || 'new'}-preview.jpg`}`;
        replaced[f.name] = path;
        if (forSave) puts.push({ kind: 'putFile', path: toRepoPath(path), base64: images[v].base64 });
      }
    }
    const item = normalizeItem(def, replaced, base);
    const removals: Op[] = [];
    // 사진을 바꿨으면 예전 사진 파일을 지움 — 옮기기에서는 원래 항목의 사진이 예전 사진
    const origin = base ?? (isMove ? source : null);
    if (origin) {
      for (const f of def.fields) {
        if (f.type !== 'image' || !f.image) continue;
        const old = origin[f.name];
        if (old !== item[f.name] && ownedImage(old, f.image.dir, keyOf(origin))) removals.push({ kind: 'deleteFile', path: toRepoPath(old) });
      }
    }
    return { item, puts, removals };
  };

  const errors: FieldErrors = useMemo(
    () => validateItem(def, finalize(false).item, { takenKeys, projectIds, isNew }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, slug, images, takenKeys, projectIds],
  );
  const shownErrors = showErrors ? errors : {};
  const errorCount = Object.keys(errors).length;

  /* 수정 중 표시 + 이 브라우저에 자동 임시 저장(사진 제외) */
  useEffect(() => {
    setDirty(changed);
  }, [changed, setDirty]);
  useEffect(() => () => setDirty(false), [setDirty]);

  useEffect(() => {
    const raw = storage()?.getItem(draftKey);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { draft: Item; at: number };
      if (saved?.draft && !sameValue(saved.draft, base ?? (move && source ? move.convert(source) : def.defaults()))) setRestorable(saved);
    } catch {
      storage()?.removeItem(draftKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!changed) return;
    const t = window.setTimeout(() => {
      const keep: Item = { ...draft, [KF]: slug };
      for (const f of def.fields) if (f.type === 'image' && typeof keep[f.name] === 'string' && (keep[f.name] as string).startsWith('pending:')) keep[f.name] = base?.[f.name] ?? null;
      try {
        storage()?.setItem(draftKey, JSON.stringify({ draft: keep, at: Date.now() }));
      } catch {
        /* 저장 공간 부족 등 — 무시 */
      }
    }, 600);
    return () => window.clearTimeout(t);
  }, [draft, slug, changed, draftKey, def, base, KF]);

  const clearDraft = () => storage()?.removeItem(draftKey);

  const setField = (name: string, value: unknown) => {
    setDraft((d) => ({ ...d, [name]: value }));
    setChanged(true);
  };

  const env: FieldEnv = {
    projects: snapshot?.projects ?? [],
    images: Object.fromEntries(Object.entries(images).map(([k, v]) => [k, v.dataUrl])),
    imageBusy,
    pickImage: async (field: FieldDef, file: File) => {
      if (!field.image) return;
      setImageBusy(field.name);
      try {
        const prepared = await prepareImage(file, field.image);
        const id = `pending:${Date.now().toString(36)}`;
        setImages((m) => ({ ...m, [id]: prepared }));
        setField(field.name, id);
      } catch (e) {
        notify(errorMessage(e), 'error');
      } finally {
        setImageBusy(null);
      }
    },
  };

  const focusFirstError = () => {
    window.setTimeout(() => {
      const el = formRef.current?.querySelector<HTMLElement>('.has-error input, .has-error textarea, .has-error select');
      el?.focus();
    }, 0);
  };

  /** '확인하고 게시' — 입력을 검사하고, 게시할 내용을 확인 창으로 보여 줌 */
  const openConfirm = () => {
    setShowErrors(true);
    if (errorCount) {
      notify(`입력 내용을 확인해 주세요 — ${Object.values(errors)[0]}`, 'error');
      focusFirstError();
      return;
    }
    const { item, puts, removals } = finalize(true);
    const ops: Op[] = [
      // 옮기기: 원래 항목을 먼저 지우고(그새 바뀌었으면 충돌로 알림) 같은 주소로 추가
      ...(move && source ? [{ kind: 'delete', collection: move.collection, key: keyOf(source), before: source } as Op] : []),
      { kind: 'upsert', collection, key: str(item[KF]), item, before: base },
      ...puts,
      ...removals,
    ];
    const imgs: Record<string, string> = {};
    for (const op of puts) if (op.kind === 'putFile' && op.base64) imgs[toPublicPath(op.path)] = dataUrl(op.base64, op.path);
    setConfirming({ ops, item, images: imgs });
  };

  const publish = async (ops: Op[], kind: 'save' | 'delete', force = false) => {
    setSaving(kind);
    setConflict(null);
    try {
      const r = await publishDirect(backend, user, ops, { force });
      const done = kind === 'delete' ? '삭제했습니다' : isMove ? `${josa(def.itemLabel, '으로', '로')} 옮겼습니다` : '게시했습니다';
      notify(`${done}. 1~2분 뒤 사이트에 반영됩니다.${r.viaPull ? ` (보호 규칙에 따라 #${r.viaPull} 로 반영)` : ''}`);
      watchDeploy();
      clearDraft();
      setChanged(false);
      setDirty(false);
      setConfirming(null);
      await reload();
      navigate(collection);
    } catch (e) {
      setConfirming(null);
      if (isCmsError(e, 'conflict')) setConflict({ list: (e.detail as Conflict[]) ?? [], ops, kind });
      else if (isCmsError(e, 'validation')) notify(errorMessage(e), 'error');
      else fail(e);
    } finally {
      setSaving(null);
    }
  };

  const remove = () => {
    if (!base) return;
    if (!window.confirm(`「${def.title(base)}」 ${josa(def.itemLabel, '을', '를')} 삭제할까요?\n공개 사이트에서 바로 사라집니다. 변경 기록에는 남습니다.`)) return;
    const ops: Op[] = [{ kind: 'delete', collection, key: keyOf(base), before: base }];
    for (const f of def.fields) if (f.type === 'image' && f.image && ownedImage(base[f.name], f.image.dir, keyOf(base))) ops.push({ kind: 'deleteFile', path: toRepoPath(base[f.name] as string) });
    void publish(ops, 'delete');
  };

  const loadLatest = (c: Conflict) => {
    if (move && c.collection === move.collection) {
      // 옮기기 중 원래 항목이 바뀜 — 바뀐 내용을 다시 옮겨 채우되, 내가 고친 칸(학위·졸업 연도 등)은 그대로 둠
      if (c.current && source) {
        const prev = move.convert(source);
        const fresh = move.convert(c.current);
        setDraft((d) => mergeItem(prev, fresh, d).merged);
      }
      setSource(c.current);
      setConflict(null);
      setFormKey((k) => k + 1);
      notify('최신 정보를 반영했습니다. 내가 고친 칸은 그대로 두었으니 확인한 뒤 다시 게시해 주세요.', 'info');
      return;
    }
    setBase(c.current);
    setDraft(c.current ? clone(c.current) : def.defaults());
    setImages({});
    setChanged(false);
    setConflict(null);
    clearDraft();
    setFormKey((k) => k + 1);
    notify('저장소의 최신 내용을 불러왔습니다. 필요한 수정을 다시 해 주세요.', 'info');
  };

  if (itemKey && !base && !conflict) {
    return (
      <div className="cms-page">
        <Notice tone="warn" title="이 항목을 찾을 수 없습니다" actions={<Btn onClick={() => navigate(collection)}>{def.label} 목록으로</Btn>}>
          이미 삭제되었거나 주소가 바뀌었을 수 있습니다.
        </Notice>
      </div>
    );
  }

  if (move && srcDef && !source && !conflict) {
    return (
      <div className="cms-page">
        <Notice
          tone="warn"
          title={`옮길 ${josa(srcDef.itemLabel, '을', '를')} 찾을 수 없습니다`}
          actions={
            <>
              <Btn onClick={() => navigate(move.collection)}>{srcDef.label} 목록으로</Btn>
              <Btn onClick={() => navigate(collection)}>{def.label} 목록으로</Btn>
            </>
          }
        >
          이미 옮겼거나 삭제되었을 수 있습니다.
        </Notice>
      </div>
    );
  }

  const previewItem = normalizeItem(def, { ...draft, [KF]: slug }, base);
  const changeCount = confirming ? countChanges(def, base, confirming.item) : 0;

  /* 옮기기 안내 — 그대로 옮기는 칸과, 이 메뉴에 없어 버리는 칸 */
  const carried = move && srcDef && source ? def.fields.filter((f) => srcDef.fields.some((s) => s.name === f.name) && hasValue(source[f.name])).map((f) => f.label) : [];
  const dropped = move && srcDef && source ? srcDef.fields.filter((f) => !def.fields.some((t) => t.name === f.name) && hasValue(source[f.name])).map((f) => `${f.label}${shortValue(f, source[f.name])}`) : [];
  const sourcePath = move ? `${move.collection}/edit/${moveFrom}` : '';
  /* 이 항목을 다른 메뉴로 옮기는 버튼 (구성원 편집 화면의 '졸업생으로 옮기기') */
  const targets = !isNew ? moveTargets(collection) : [];

  /* 소제목(section) 단위로 칸 묶기 */
  const groups: { title: string | null; fields: FieldDef[] }[] = [];
  for (const f of def.fields) {
    if (f.section || groups.length === 0) groups.push({ title: f.section ?? null, fields: [] });
    groups[groups.length - 1].fields.push(f);
  }

  const clashLabels = (c: Conflict) => c.fields.map((n) => def.fields.find((f) => f.name === n)?.label ?? n).join(', ');

  return (
    <div className="cms-page cms-editor">
      <header className={targets.length ? 'cms-page__head cms-page__head--row' : 'cms-page__head'}>
        <div>
          {move && srcDef && source ? (
            <a
              className="cms-back"
              href={`#/${sourcePath}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(sourcePath);
              }}
            >
              ← {srcDef.itemLabel} 「{srcDef.title(source)}」
            </a>
          ) : (
            <a
              className="cms-back"
              href={`#/${collection}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(collection);
              }}
            >
              ← {def.label} 목록
            </a>
          )}
          <h1 className="cms-h1">
            {move ? move.buttonLabel : isNew ? `${def.itemLabel} 추가` : def.title(base ?? draft)}
            {(base ?? source)?.isSample ? <Badge tone="sample">예시</Badge> : null}
          </h1>
          {move && srcDef && source ? (
            <p className="cms-lead">
              {srcDef.itemLabel} 「{srcDef.title(source)}」 → {def.itemLabel} · 사이트 주소 <code>{def.publicPath(slug)}</code> 그대로
            </p>
          ) : !isNew ? (
            <p className="cms-lead">
              {autoKey ? `번호 ${slug} · ` : ''}사이트 주소 <code>{def.publicPath(slug)}</code>
            </p>
          ) : null}
        </div>
        {targets.length ? (
          <div className="cms-row">
            {targets.map((t) => (
              <Btn key={t.id} variant="secondary" disabled={saving !== null} onClick={() => navigate(`${t.id}/move/${itemKey}`)}>
                {t.moveFrom?.buttonLabel}
              </Btn>
            ))}
          </div>
        ) : null}
      </header>

      {move && srcDef && source ? (
        <Notice tone="info" title={`게시하면 ${srcDef.label} 목록에서 빠지고 ${def.label} 목록에 들어갑니다`}>
          <p className="cms-notice__p">
            {carried.length ? `${josa(carried.join(', '), '은', '는')} 그대로 옮겨 채워 두었습니다. ` : ''}
            {move.hint}
          </p>
          {dropped.length ? (
            <p className="cms-notice__p">
              {def.itemLabel} 정보에는 없는 칸이라 옮기지 않습니다: {dropped.join(', ')}
            </p>
          ) : null}
        </Notice>
      ) : null}

      {restorable ? (
        <Notice
          tone="info"
          title={`게시하지 않은 수정 내용이 있습니다 (${timeAgo(new Date(restorable.at).toISOString())})`}
          actions={
            <>
              <Btn
                variant="ghost"
                onClick={() => {
                  clearDraft();
                  setRestorable(null);
                }}
              >
                버리기
              </Btn>
              <Btn
                variant="secondary"
                onClick={() => {
                  setDraft(restorable.draft);
                  if (isNew && str(restorable.draft.slug)) setSlugTouched(true);
                  setRestorable(null);
                  setChanged(true);
                  setFormKey((k) => k + 1);
                }}
              >
                불러오기
              </Btn>
            </>
          }
        >
          이 브라우저에 자동으로 임시 저장된 내용입니다. 새로 고른 사진은 임시 저장되지 않으니 다시 골라 주세요.
        </Notice>
      ) : null}

      {conflict ? (
        <Notice
          tone="danger"
          title={
            move && srcDef
              ? !conflict.list[0]?.current
                ? `다른 사람이 이 ${josa(srcDef.itemLabel, '을', '를')} 먼저 삭제했거나 옮겼습니다`
                : `다른 사람이 이 ${srcDef.itemLabel} 정보를 먼저 수정했습니다`
              : !conflict.list[0]?.current
                ? '다른 사람이 이 항목을 먼저 삭제했습니다'
                : conflict.list[0].fields.length
                  ? `다른 사람이 같은 칸을 먼저 수정했습니다 — ${clashLabels(conflict.list[0])}`
                  : '다른 사람이 먼저 이 항목을 수정했습니다'
          }
          actions={
            <>
              <Btn variant="ghost" onClick={() => setConflict(null)}>
                취소
              </Btn>
              {conflict.list[0] && !(move && !conflict.list[0].current) ? (
                <Btn variant="secondary" onClick={() => loadLatest(conflict.list[0])}>
                  최신 내용 불러오기
                </Btn>
              ) : null}
              <Btn variant="danger" busy={saving !== null} onClick={() => void publish(conflict.ops, conflict.kind, true)}>
                내 내용으로 덮어쓰기
              </Btn>
            </>
          }
        >
          {move
            ? conflict.list[0]?.current
              ? '‘최신 내용 불러오기’를 누르면 바뀐 정보를 다시 옮겨 채우고 내가 고친 칸은 그대로 둡니다. ‘덮어쓰기’를 누르면 다른 사람의 수정은 빼고 지금 화면의 내용으로 옮깁니다.'
              : `‘덮어쓰기’를 누르면 지금 화면의 내용으로 ${josa(def.itemLabel, '을', '를')} 추가합니다.`
            : conflict.list[0]?.current
              ? '서로 다른 칸의 수정은 자동으로 합쳐지지만, 같은 칸은 하나를 골라야 합니다. ‘최신 내용 불러오기’를 누르면 내 수정은 사라지고, ‘덮어쓰기’를 누르면 그 칸의 다른 사람 수정이 내 내용으로 바뀝니다.'
              : '‘덮어쓰기’를 누르면 내 내용으로 이 항목을 다시 만듭니다.'}
        </Notice>
      ) : null}

      <div className={def.previewWide ? 'cms-editor__grid cms-editor__grid--stack' : 'cms-editor__grid'}>
        <form
          ref={formRef}
          id="cms-form"
          key={formKey}
          className="cms-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            openConfirm();
          }}
        >
          {groups.map((g, gi) => (
            <section key={gi} className="cms-panel" aria-labelledby={g.title ? `cms-sec-${gi}` : undefined}>
              {g.title ? (
                <h2 className="cms-h2" id={`cms-sec-${gi}`}>
                  {g.title}
                </h2>
              ) : null}
              <div className="cms-fields">
                {gi === 0 && autoKey ? (
                  <div className="cms-field">
                    <span className="cms-label">번호</span>
                    <p className="cms-static">{slug}</p>
                    <p className="cms-help">
                      {isNew
                        ? `게시할 때 자동으로 정해집니다 (${def.autoKey?.prefix} 번호 중 가장 큰 번호 + 1). 그사이 다른 사람이 먼저 추가하면 다음 번호가 붙습니다.`
                        : '번호는 바꿀 수 없습니다. 구성원 프로필 등 다른 곳에서 이 번호로 연결합니다.'}
                    </p>
                  </div>
                ) : null}
                {gi === 0 && !autoKey ? (
                  <div className={`cms-field${shownErrors.slug ? ' has-error' : ''}`}>
                    <label className="cms-label" htmlFor="cms-f-slug">
                      주소 (영문)
                      {isNew && !isMove ? <span className="cms-req">필수</span> : null}
                    </label>
                    {isNew && !isMove ? (
                      <input
                        id="cms-f-slug"
                        className="cms-input"
                        value={slug}
                        spellCheck={false}
                        autoCapitalize="off"
                        onChange={(e) => {
                          setSlugTouched(true);
                          setField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'));
                        }}
                        aria-invalid={shownErrors.slug ? true : undefined}
                        aria-describedby="cms-f-slug-help"
                      />
                    ) : (
                      <p className="cms-static">{slug}</p>
                    )}
                    <p className="cms-help" id="cms-f-slug-help">
                      {isMove && srcDef
                        ? `${srcDef.itemLabel}일 때의 주소를 그대로 씁니다. 상세 페이지 주소 ${def.publicPath(slug)} 가 바뀌지 않습니다.`
                        : isNew
                          ? `사이트 주소 ${def.publicPath(slug || '…')} 에 쓰입니다. 영문 소문자·숫자·하이픈(-)만 쓰며, 게시한 뒤에는 바꿀 수 없습니다.`
                          : '주소는 바꿀 수 없습니다. 바꿔야 하면 새로 추가한 뒤 이 항목을 삭제하세요.'}
                    </p>
                    {shownErrors.slug ? <p className="cms-error">{shownErrors.slug}</p> : null}
                  </div>
                ) : null}
                {g.fields.map((f) => (
                  <FieldControl key={f.name} field={f} value={draft[f.name]} onChange={(v) => setField(f.name, v)} errors={shownErrors} env={env} />
                ))}
              </div>
            </section>
          ))}
        </form>

        <aside className="cms-editor__side" aria-label="미리보기">
          <div className="cms-sticky">
            <h2 className="cms-h3">미리보기</h2>
            <ItemPreview collection={collection} item={previewItem} images={env.images} />
            <p className="cms-help">공개 사이트와 같은 모양으로 그린 미리보기입니다. 게시한 뒤 1~2분이 지나야 실제 사이트에 보입니다.</p>
          </div>
        </aside>
      </div>

      <div className="cms-actionbar">
        <div className="cms-actionbar__inner">
          <span className="cms-actionbar__hint">{showErrors && errorCount ? `확인할 칸 ${errorCount}개` : changed ? '게시하지 않은 수정이 있습니다' : ''}</span>
          <div className="cms-row">
            {!isNew ? (
              <Btn variant="danger" busy={saving === 'delete'} disabled={saving !== null} onClick={remove}>
                삭제
              </Btn>
            ) : null}
            <Btn variant="ghost" onClick={() => navigate(isMove ? sourcePath : collection)} disabled={saving !== null}>
              취소
            </Btn>
            <Btn variant="primary" type="submit" form="cms-form" busy={saving === 'save'} disabled={saving !== null || imageBusy !== null}>
              {isMove ? '확인하고 옮기기' : '확인하고 게시'}
            </Btn>
          </div>
        </div>
      </div>

      <Dialog
        open={confirming !== null}
        wide
        title={isMove ? `${josa(def.itemLabel, '으로', '로')} 옮길까요?` : isNew ? `새 ${josa(def.itemLabel, '을', '를')} 게시할까요?` : '바뀐 내용을 확인해 주세요'}
        onClose={() => saving === null && setConfirming(null)}
        actions={
          <>
            <Btn variant="ghost" onClick={() => setConfirming(null)} disabled={saving !== null}>
              돌아가서 고치기
            </Btn>
            <Btn variant="primary" busy={saving === 'save'} disabled={saving !== null || changeCount === 0} onClick={() => confirming && void publish(confirming.ops, 'save')}>
              {isMove ? '옮기기' : '게시하기'}
            </Btn>
          </>
        }
      >
        {confirming ? (
          <>
            <p className="cms-lead cms-dialog__lead">
              {move && srcDef && source
                ? `「${srcDef.title(source)}」 — ${srcDef.label} 목록에서 빠지고, 아래 내용으로 ${def.label} 목록에 들어갑니다. 1~2분 뒤 공개 사이트에 반영되고, 누가 옮겼는지 변경 기록에 남습니다.`
                : changeCount === 0
                  ? '바뀐 내용이 없어 게시할 것이 없습니다.'
                  : `${isNew ? '아래 내용으로' : `${changeCount}개 칸이 바뀝니다.`} 게시하면 1~2분 뒤 공개 사이트에 반영되고, 누가 게시했는지 변경 기록에 남습니다.`}
            </p>
            {dropped.length ? <p className="cms-help cms-dialog__lead">옮기지 않는 칸: {dropped.join(', ')}</p> : null}
            <div className={def.previewWide ? 'cms-confirm cms-confirm--stack' : 'cms-confirm'}>
              <ChangeTable def={def} before={base} after={confirming.item} projects={snapshot?.projects ?? []} images={confirming.images} />
              <div className="cms-confirm__preview">
                <ItemPreview collection={collection} item={confirming.item} images={confirming.images} />
              </div>
            </div>
          </>
        ) : null}
      </Dialog>
    </div>
  );
}
