/**
 * 변경 작업(op) — "소식 X 수정", "구성원 Y 삭제", "사진 올림" 처럼 항목 단위로 적은 변경 목록입니다.
 *
 * 저장할 때 파일을 통째로 덮어쓰지 않고 이 목록을 **저장 직전의 최신 파일에 다시 적용**합니다.
 * 그래서 두 사람이 같은 파일의 서로 다른 항목(또는 같은 항목의 서로 다른 칸)을 고쳐도 둘 다 반영되고,
 * 같은 칸을 둘 다 고친 경우에만 충돌로 알려 줍니다.
 */
import { ASSET_PATH, collections, fileHooks, itemsOf, keyOf, nextKey, type CollectionDef, type CollectionId, type FieldDef, type Item } from './collections';
import { CmsError } from './types';

export type Op =
  | { kind: 'upsert'; collection: CollectionId; key: string; item: Item; before: Item | null }
  | { kind: 'delete'; collection: CollectionId; key: string; before: Item | null }
  | { kind: 'order'; collection: CollectionId; keys: string[] }
  | { kind: 'putFile'; path: string; base64?: string; blobSha?: string }
  | { kind: 'deleteFile'; path: string };

export type DataOp = Extract<Op, { collection: CollectionId }>;

export const isDataOp = (op: Op): op is DataOp => op.kind === 'upsert' || op.kind === 'delete' || op.kind === 'order';

export interface Conflict {
  collection: CollectionId;
  key: string;
  title: string;
  /** 지금 저장소에 있는 내용 (이미 지워졌으면 null) */
  current: Item | null;
  /** 편집을 시작할 때의 내용 (새 항목이면 null) */
  before: Item | null;
  /** 나와 다른 사람이 둘 다 바꾼 칸 이름 (항목이 지워졌거나 삭제 요청이면 빈 배열) */
  fields: string[];
}

/* ------------------------------------------------------------ 비교 */

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as object).sort()) {
      const x = (v as Record<string, unknown>)[k];
      if (x !== undefined) out[k] = sortKeys(x);
    }
    return out;
  }
  return v;
}

export function stableStringify(v: unknown): string {
  return JSON.stringify(sortKeys(v ?? null));
}

export function sameValue(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}

/* ------------------------------------------------------------ 병합 */

/**
 * 칸 단위 병합 — 편집을 시작한 뒤(before) 다른 사람이 같은 항목을 고쳤을 때(current),
 * 내가 바꾼 칸만 반영하고 다른 사람이 바꾼 칸은 그대로 둡니다. 같은 칸을 둘 다 바꿨으면 clashes 에 넣고 내 값을 씁니다.
 */
export function mergeItem(before: Item, current: Item, mine: Item): { merged: Item; clashes: string[] } {
  const merged: Item = {};
  const clashes: string[] = [];
  for (const k of Array.from(new Set([...Object.keys(mine), ...Object.keys(current), ...Object.keys(before)]))) {
    const b = before[k];
    const c = current[k];
    const m = mine[k];
    const mineChanged = !sameValue(b, m);
    const theirsChanged = !sameValue(b, c);
    if (mineChanged && theirsChanged && !sameValue(c, m)) clashes.push(k);
    const v = mineChanged ? m : c;
    if (v !== undefined) merged[k] = v;
  }
  return { merged, clashes };
}

/** 게시했을 때 실제로 들어갈 항목 (다른 사람의 수정과 병합한 결과) */
export function resultOfUpsert(op: Extract<Op, { kind: 'upsert' }>, current: Item | null): { item: Item; clashes: string[]; changedSince: boolean } {
  if (current && op.before && !sameValue(current, op.before)) {
    const { merged, clashes } = mergeItem(op.before, current, op.item);
    return { item: merged, clashes, changedSince: true };
  }
  return { item: op.item, clashes: [], changedSince: !!op.before && !current };
}

/* ------------------------------------------------------------ 적용 */

/**
 * files(경로 → 파싱한 JSON)에 ops 를 적용합니다(files 를 직접 바꿈). 사진 op 는 여기서 다루지 않습니다.
 * 다른 사람과 같은 칸을 고쳤거나, 고치던 항목이 그새 삭제됐으면 conflicts 로 돌려줍니다
 * (적용은 그대로 함 — 막을지는 호출하는 쪽이 정함). 서로 다른 칸을 고친 경우는 병합해서 충돌이 아닙니다.
 */
export function applyOps(files: Record<string, unknown>, ops: Op[]): { conflicts: Conflict[]; keys: Map<Op, string> } {
  const conflicts: Conflict[] = [];
  /** 실제로 쓴 키 — 자동 번호 항목은 그새 다른 사람이 같은 번호를 썼으면 다음 번호로 바뀜 */
  const keys = new Map<Op, string>();
  const touched = new Set<string>();
  for (const op of ops) {
    if (!isDataOp(op)) continue;
    const def = collections[op.collection];
    if (!def) throw new CmsError('validation', `알 수 없는 항목 종류: ${op.collection}`);
    const data = files[def.file] as Record<string, unknown> | undefined;
    if (!data || typeof data !== 'object') throw new CmsError('not-found', `${def.file} 파일을 찾을 수 없습니다.`);
    if (!Array.isArray(data[def.arrayKey])) data[def.arrayKey] = [];
    const arr = data[def.arrayKey] as Item[];
    touched.add(def.file);

    if (op.kind === 'order') {
      const pos = new Map(op.keys.map((k, i) => [k, i]));
      const ranked = arr.map((item, i) => ({ item, i, p: pos.get(keyOf(item)) ?? op.keys.length + i }));
      ranked.sort((a, b) => a.p - b.p || a.i - b.i);
      data[def.arrayKey] = ranked.map((r) => r.item);
      continue;
    }

    let key = op.key;
    let idx = arr.findIndex((x) => keyOf(x) === key);
    let current = idx >= 0 ? arr[idx] : null;
    if (op.kind === 'upsert') {
      let upsert = op;
      if (!op.before && current) {
        if (!def.autoKey) throw new CmsError('validation', `주소 "${op.key}" 는 이미 다른 ${def.itemLabel}이(가) 쓰고 있습니다. 다른 주소를 적어 주세요.`);
        // 자동 번호: 확인 창을 띄운 뒤 다른 사람이 같은 번호로 먼저 게시했으면 다음 번호를 씀
        key = nextKey(def, data);
        upsert = { ...op, key, item: { ...op.item, [def.keyField]: key } };
        idx = -1;
        current = null;
      }
      const { item, clashes, changedSince } = resultOfUpsert(upsert, current);
      if (clashes.length || (changedSince && !current)) {
        conflicts.push({ collection: op.collection, key, title: def.title(op.item), current, before: op.before, fields: clashes });
      }
      if (idx >= 0) arr[idx] = item;
      else arr.splice(insertIndex(def, arr), 0, item);
    } else {
      if (current && !sameValue(current, op.before)) conflicts.push({ collection: op.collection, key, title: def.title(current), current, before: op.before, fields: [] });
      if (idx >= 0) arr.splice(idx, 1);
    }
    keys.set(op, key);
  }
  for (const path of touched) fileHooks[path]?.(files[path] as Record<string, unknown>);
  return { conflicts, keys };
}

/** 새 항목을 넣을 자리 — 배열 앞·뒤, 또는 같은 종류 묶음의 맨 앞(없으면 뒤) */
function insertIndex(def: CollectionDef, arr: Item[]): number {
  if (def.newPosition === 'start') return 0;
  if (def.newPosition === 'group' && def.match) {
    const i = arr.findIndex(def.match);
    if (i >= 0) return i;
  }
  return arr.length;
}

export function assertAssetPath(path: string) {
  if (!ASSET_PATH.test(path)) throw new CmsError('validation', `CMS 가 다룰 수 없는 파일 경로입니다: ${path}`);
}

/* ------------------------------------------------------------- 설명 */

export function describeOp(op: Op): string {
  if (op.kind === 'putFile') return `사진 올림 — ${op.path.replace(/^public/, '')}`;
  if (op.kind === 'deleteFile') return `사진 지움 — ${op.path.replace(/^public/, '')}`;
  const def = collections[op.collection];
  if (op.kind === 'order') return `${def.label} 순서 변경`;
  if (op.kind === 'delete') return `${def.itemLabel} 삭제 — ${op.before ? def.title(op.before) : op.key}`;
  return `${def.itemLabel} ${op.before ? '수정' : '추가'} — ${def.title(op.item)}`;
}

/** 옮기기(한 메뉴에서 지우고 같은 주소로 다른 메뉴에 추가)인지 — 구성원 → 졸업생 */
export function moveOf(ops: Op[]): { from: Extract<Op, { kind: 'delete' }>; to: Extract<Op, { kind: 'upsert' }> } | null {
  const data = ops.filter(isDataOp);
  const [a, b] = data;
  if (data.length !== 2 || a.kind !== 'delete' || b.kind !== 'upsert') return null;
  if (b.before || a.key !== b.key || a.collection === b.collection) return null;
  return { from: a, to: b };
}

/** 커밋 제목 */
export function opsTitle(ops: Op[]): string {
  const data = ops.filter(isDataOp);
  const first = data[0] ?? ops[0];
  if (!first) return '[CMS] 변경';
  const moved = moveOf(ops);
  if (moved) return `[CMS] ${collections[moved.from.collection].itemLabel} → ${collections[moved.to.collection].itemLabel} 옮김: ${collections[moved.to.collection].title(moved.to.item)}`;
  const main = describeOp(first).replace(' — ', ': ');
  const rest = data.length - 1;
  const title = `[CMS] ${main}${rest > 0 ? ` 외 ${rest}건` : ''}`;
  return title.length > 90 ? `${title.slice(0, 89)}…` : title;
}

/* --------------------------------------------------------- 입력 정리 */

function cleanText(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v === null || v === undefined ? '' : String(v).trim();
}

function emptyValue(f: FieldDef): null | undefined {
  return f.empty === 'null' ? null : undefined;
}

function normalizeValue(f: FieldDef, v: unknown): unknown {
  switch (f.type) {
    case 'text':
    case 'textarea':
    case 'project': {
      const s = cleanText(v);
      return s ? s : emptyValue(f);
    }
    case 'select':
      return cleanText(v) || emptyValue(f);
    case 'year': {
      const s = cleanText(v);
      if (!s) return emptyValue(f);
      return /^\d{4}$/.test(s) ? Number(s) : s;
    }
    case 'paragraphs': {
      const arr = Array.isArray(v) ? v.map(cleanText).filter(Boolean) : [];
      return arr.length ? arr : undefined;
    }
    case 'tags':
    case 'areas':
      return Array.isArray(v) ? Array.from(new Set(v.map(cleanText).filter(Boolean))) : [];
    case 'image':
      return typeof v === 'string' && v ? v : emptyValue(f);
    case 'checkbox':
      return v === true ? true : undefined;
    case 'list': {
      const rows = (Array.isArray(v) ? v : [])
        .map((row) => {
          const r = (row ?? {}) as Item;
          const out: Item = {};
          for (const sub of f.fields ?? []) {
            const nv = normalizeValue(sub, r[sub.name]);
            if (nv !== undefined) out[sub.name] = nv;
          }
          // '사이트에 표시' 를 끈 줄만 hidden: true (표시하는 줄은 키를 두지 않음)
          if (f.hideable && r.hidden === true) out.hidden = true;
          return out;
        })
        .filter((r) => Object.entries(r).some(([k, x]) => k !== 'hidden' && x !== null && x !== undefined && x !== ''));
      return rows.length ? rows : undefined;
    }
    default:
      return v;
  }
}

/**
 * 폼에서 고친 값을 데이터 파일에 넣을 모양으로 정리합니다.
 * 원래 항목의 키 순서를 지키고(변경 기록이 읽기 쉽도록), 폼에 없는 키(type, source, relatedIds 등)는 그대로 둡니다.
 * 날짜에서 연도·정렬값을 계산하는 것처럼 자동으로 정해지는 칸(def.derive)도 여기서 채웁니다.
 */
export function normalizeItem(def: CollectionDef, draft: Item, original: Item | null): Item {
  const fieldByName = new Map(def.fields.map((f) => [f.name, f]));
  const order = [
    ...(original ? Object.keys(original) : []),
    def.keyField,
    ...Object.keys(def.defaults()),
    ...def.fields.map((f) => f.name),
    ...Object.keys(draft),
  ];
  const out: Item = {};
  for (const k of Array.from(new Set(order))) {
    if (k === def.keyField) {
      out[k] = cleanText(draft[k]);
      continue;
    }
    const f = fieldByName.get(k);
    const v = f ? normalizeValue(f, draft[k]) : k in draft ? draft[k] : original?.[k];
    if (v !== undefined) out[k] = v;
  }
  return def.derive ? def.derive(out) : out;
}

/** 목록에서 key 로 항목 찾기 */
export function findItem(data: unknown, def: CollectionDef, key: string): Item | null {
  return itemsOf(data, def.arrayKey).find((x) => keyOf(x) === key) ?? null;
}
