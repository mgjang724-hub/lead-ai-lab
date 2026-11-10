/**
 * 입력 검사 — scripts/check-data.mjs(배포 전 검사)와 같은 규칙을 저장 전에 미리 확인합니다.
 * 폼 화면은 칸별 오류를, 저장 엔진은 같은 함수로 마지막 확인을 합니다.
 */
import {
  ASSET_PATH,
  DATE_PATTERN,
  KEY_PATTERN,
  areaIds,
  toRepoPath,
  type CollectionDef,
  type FieldDef,
  type Item,
} from './collections';
import { josa } from './josa';

/** 칸 이름 → 오류 문장. 목록 칸은 "research.0.title" 처럼 */
export type FieldErrors = Record<string, string>;

export interface ValidationContext {
  /** 같은 파일에서 이미 쓰고 있는 주소(slug) — 이 항목 자신의 원래 주소는 빼고 */
  takenKeys: Set<string>;
  /** 참여 프로젝트 선택지 (projects.json 의 id). 모르면 null 이면 검사 생략 */
  projectIds: Set<string> | null;
  isNew: boolean;
}

const isEmpty = (v: unknown) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);

function checkField(f: FieldDef, value: unknown, path: string, errors: FieldErrors, ctx: ValidationContext) {
  if (f.required && isEmpty(value)) {
    errors[path] = `${josa(f.label, '을', '를')} 입력해 주세요.`;
    return;
  }
  if (isEmpty(value)) return;
  switch (f.type) {
    case 'text':
    case 'textarea':
      if (typeof value !== 'string') errors[path] = `${f.label} 형식이 올바르지 않습니다.`;
      else if (f.pattern && !f.pattern.test(value.trim())) errors[path] = f.patternHint ?? `${f.label} 형식이 올바르지 않습니다.`;
      break;
    case 'year': {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1950 || n > 2100) errors[path] = `${f.label}는 네 자리 연도로 적어 주세요.`;
      break;
    }
    case 'select':
      if (!f.options?.some((o) => o.value === value)) errors[path] = `${josa(f.label, '을', '를')} 목록에서 골라 주세요.`;
      break;
    case 'areas':
      if (!Array.isArray(value) || value.some((a) => !areaIds.includes(String(a)))) errors[path] = '알 수 없는 연구 분야가 있습니다.';
      break;
    case 'tags':
    case 'paragraphs':
      if (!Array.isArray(value) || value.some((x) => typeof x !== 'string')) errors[path] = `${f.label} 형식이 올바르지 않습니다.`;
      break;
    case 'image':
      if (typeof value !== 'string' || !value.startsWith('/images/')) errors[path] = '사진 경로가 올바르지 않습니다.';
      break;
    case 'project':
      if (ctx.projectIds && !ctx.projectIds.has(String(value))) errors[path] = '선택한 연구실 과제를 찾을 수 없습니다.';
      break;
    case 'list': {
      if (!Array.isArray(value)) {
        errors[path] = `${f.label} 형식이 올바르지 않습니다.`;
        break;
      }
      value.forEach((row, i) => {
        const r = (row ?? {}) as Item;
        for (const sub of f.fields ?? []) checkField(sub, r[sub.name], `${path}.${i}.${sub.name}`, errors, ctx);
        if (f.name === 'projects' && !r.projectId && (isEmpty(r.period) || isEmpty(r.title))) {
          errors[`${path}.${i}.title`] = '연구실 과제를 고르거나, 기간과 과제명을 적어 주세요.';
        }
      });
      break;
    }
    default:
      break;
  }
}

export function validateItem(def: CollectionDef, item: Item, ctx: ValidationContext): FieldErrors {
  const errors: FieldErrors = {};
  const k = def.keyField;
  const key = typeof item[k] === 'string' ? (item[k] as string) : '';
  if (def.autoKey) {
    // 자동 번호 — 게시할 때 정해지므로 형식만 확인 (겹치면 엔진이 다음 번호로 바꿈)
    if (key && !new RegExp(`^${def.autoKey.prefix}\\d+$`).test(key)) errors[k] = '번호 형식이 올바르지 않습니다.';
  } else if (!key) errors[k] = '주소(영문)를 입력해 주세요.';
  else if (!KEY_PATTERN.test(key)) errors[k] = '주소는 영문 소문자·숫자·하이픈(-)만 쓸 수 있습니다. 예: seoyeon-lee';
  else if (def.reservedPrefixes?.some((p) => key.startsWith(p))) errors[k] = `"${def.reservedPrefixes.join('", "')}" 로 시작하는 주소는 쓸 수 없습니다.`;
  else if (ctx.takenKeys.has(key)) errors[k] = '이미 쓰고 있는 주소입니다. 다른 주소를 적어 주세요.';

  for (const f of def.fields) checkField(f, item[f.name], f.name, errors, ctx);
  if (def.validate) Object.assign(errors, def.validate(item));

  if (def.id === 'news') {
    const title = typeof item.title === 'string' ? item.title : '';
    if (/\[예시/.test(title) && !item.isSample) errors.isSample = '제목에 [예시]가 있으면 예시 표시를 켜 주세요.';
    if (item.category === 'award' && item.isSample) errors.isSample = '수상 소식은 예시로 둘 수 없습니다.';
    if (typeof item.date === 'string' && !DATE_PATTERN.test(item.date)) errors.date = '2026-11-09 또는 2026-11 형식으로 적어 주세요.';
  }
  return errors;
}

/** 이미지 칸 값(화면 경로)이 CMS 가 관리하는 경로인지 */
export function isManagedImage(publicPath: unknown): publicPath is string {
  return typeof publicPath === 'string' && ASSET_PATH.test(toRepoPath(publicPath));
}

export function firstError(errors: FieldErrors): string | null {
  const k = Object.keys(errors)[0];
  return k ? errors[k] : null;
}
