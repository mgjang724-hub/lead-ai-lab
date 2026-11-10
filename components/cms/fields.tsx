'use client';
/** 입력 칸 — 컬렉션 정의(lib/cms/collections.ts)의 칸 종류별로 그립니다 */
import { useState, type ReactNode } from 'react';
import type { FieldDef, Item } from '@/lib/cms/collections';
import { areaOptions } from '@/lib/cms/collections';
import type { ProjectRef } from '@/lib/cms/engine';
import type { FieldErrors } from '@/lib/cms/validate';
import { Thumb } from './Thumb';
import { Btn, cx } from './ui';

export interface FieldEnv {
  projects: ProjectRef[];
  /** 새로 고른 사진 "pending:<id>" → 미리보기 data URL */
  images: Record<string, string>;
  pickImage: (field: FieldDef, file: File) => Promise<void>;
  imageBusy: string | null;
}

const str = (v: unknown) => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v));
const idOf = (path: string) => `cms-f-${path.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

function Wrap({ field, path, error, children, group }: { field: FieldDef; path: string; error?: string; children: ReactNode; group?: boolean }) {
  const id = idOf(path);
  const label = (
    <>
      {field.label}
      {field.required ? <span className="cms-req">필수</span> : null}
    </>
  );
  const help = field.help ? (
    <p className="cms-help" id={`${id}-help`}>
      {field.help}
    </p>
  ) : null;
  const err = error ? (
    <p className="cms-error" id={`${id}-err`}>
      {error}
    </p>
  ) : null;
  const cls = cx('cms-field', field.half && 'cms-field--half', error && 'has-error');
  if (group) {
    return (
      <fieldset className={cls}>
        <legend className="cms-label">{label}</legend>
        {help}
        {children}
        {err}
      </fieldset>
    );
  }
  return (
    <div className={cls}>
      <label className="cms-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {help}
      {err}
    </div>
  );
}

function describedBy(path: string, field: FieldDef, error?: string) {
  const id = idOf(path);
  return [field.help ? `${id}-help` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined;
}

/** 줄글을 빈 줄 기준으로 문단 배열로 */
function ParagraphsInput({ id, value, rows, onChange, aria }: { id: string; value: unknown; rows?: number; onChange: (v: string[]) => void; aria: Record<string, unknown> }) {
  const [text, setText] = useState(() => (Array.isArray(value) ? value.map(str).join('\n\n') : str(value)));
  return (
    <textarea
      id={id}
      className="cms-input cms-textarea"
      rows={rows ?? 6}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(
          e.target.value
            .split(/\n\s*\n/)
            .map((s) => s.trim())
            .filter(Boolean),
        );
      }}
      {...aria}
    />
  );
}

/** 쉼표로 구분한 낱말 목록 */
function TagsInput({ id, value, placeholder, onChange, aria }: { id: string; value: unknown; placeholder?: string; onChange: (v: string[]) => void; aria: Record<string, unknown> }) {
  const [text, setText] = useState(() => (Array.isArray(value) ? value.map(str).join(', ') : ''));
  const tags = Array.isArray(value) ? value.map(str) : [];
  return (
    <>
      <input
        id={id}
        className="cms-input"
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          onChange(
            e.target.value
              .split(/[,，\n]/)
              .map((s) => s.trim())
              .filter(Boolean),
          );
        }}
        {...aria}
      />
      {tags.length ? (
        <ul className="cms-tags" role="list" aria-label="입력된 항목">
          {tags.map((t, i) => (
            <li key={`${t}-${i}`} className="cms-tag">
              {t}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function ImageInput({ field, value, onChange, env, id }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void; env: FieldEnv; id: string }) {
  const v = str(value);
  const src = v.startsWith('pending:') ? env.images[v] : v || null;
  const busy = env.imageBusy === field.name;
  const portrait = field.image?.mode === 'crop';
  return (
    <div className="cms-image">
      <Thumb src={src} label={field.label} ratio={portrait ? 'portrait' : 'landscape'} />
      <div className="cms-image__side">
        <div className="cms-row">
          <label className={cx('cms-btn', 'cms-btn--secondary', busy && 'is-busy')} htmlFor={id}>
            {busy ? <span className="cms-spinner" aria-hidden="true" /> : null}
            <span>{v ? '다른 사진으로 바꾸기' : '사진 고르기'}</span>
          </label>
          <input
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="cms-visually-hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void env.pickImage(field, file);
            }}
          />
          {v ? (
            <Btn variant="ghost" onClick={() => onChange(null)}>
              사진 빼기
            </Btn>
          ) : null}
        </div>
        <p className="cms-help">
          {portrait ? '세로 4:5 비율, 900×1125 크기로 맞춰 저장합니다.' : '긴 변 1600px 이하로 줄여 저장합니다.'}
          {v.startsWith('pending:') ? ' 새 사진은 저장할 때 올라갑니다.' : ''}
        </p>
      </div>
    </div>
  );
}

function ListInput({ field, value, path, onChange, errors, env }: { field: FieldDef; value: unknown; path: string; onChange: (v: unknown) => void; errors: FieldErrors; env: FieldEnv }) {
  const rows = (Array.isArray(value) ? value : []) as Item[];
  const update = (i: number, name: string, v: unknown) => {
    const next = rows.map((r, j) => (j === i ? { ...r, [name]: v } : r));
    onChange(next);
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = rows.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="cms-listfield">
      {rows.length === 0 ? <p className="cms-help cms-listfield__empty">아직 없습니다.</p> : null}
      {rows.map((row, i) => (
        <div className={cx('cms-listfield__row', field.hideable && row.hidden === true && 'is-hidden')} key={i}>
          <div className="cms-listfield__cells">
            {field.hideable ? (
              <label className="cms-rowshow">
                <input type="checkbox" checked={row.hidden !== true} onChange={(e) => update(i, 'hidden', e.target.checked ? undefined : true)} />
                <span>
                  <span className="cms-visually-hidden">
                    {field.label} {i + 1}번째 줄{' '}
                  </span>
                  사이트에 표시
                </span>
                {row.hidden === true ? <span className="cms-rowshow__off">상세 페이지에 나오지 않음</span> : null}
              </label>
            ) : null}
            {(field.fields ?? []).map((sub) => {
              const p = `${path}.${i}.${sub.name}`;
              const id = idOf(p);
              const err = errors[p];
              return (
                <div key={sub.name} className={cx('cms-listfield__cell', `cms-listfield__cell--${sub.name}`, err && 'has-error')}>
                  <label className="cms-label cms-label--s" htmlFor={id}>
                    {sub.label}
                  </label>
                  {sub.type === 'project' ? (
                    <select id={id} className="cms-select" value={str(row[sub.name])} onChange={(e) => update(i, sub.name, e.target.value || undefined)}>
                      <option value="">연구실 과제 아님 (직접 입력)</option>
                      {env.projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title.length > 40 ? `${p.title.slice(0, 39)}…` : p.title} ({p.period})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={id}
                      className="cms-input"
                      value={str(row[sub.name])}
                      placeholder={sub.name !== 'title' && row.projectId && (sub.name === 'period' || sub.name === 'detail') ? '과제 정보에서 가져옴' : sub.placeholder}
                      onChange={(e) => update(i, sub.name, e.target.value)}
                      aria-invalid={err ? true : undefined}
                    />
                  )}
                  {err ? <p className="cms-error">{err}</p> : null}
                </div>
              );
            })}
          </div>
          <div className="cms-listfield__tools">
            <button type="button" className="cms-iconbtn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`${field.label} ${i + 1}번째 위로`}>
              ↑
            </button>
            <button type="button" className="cms-iconbtn" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`${field.label} ${i + 1}번째 아래로`}>
              ↓
            </button>
            <button type="button" className="cms-iconbtn cms-iconbtn--danger" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label={`${field.label} ${i + 1}번째 지우기`}>
              ×
            </button>
          </div>
        </div>
      ))}
      <div className="cms-row">
        <Btn variant="ghost" size="s" onClick={() => onChange([...rows, {}])}>
          + {field.addLabel ?? '추가'}
        </Btn>
        {field.hideable && rows.length > 1 ? (
          <>
            <Btn variant="ghost" size="s" disabled={rows.every((r) => r.hidden !== true)} onClick={() => onChange(rows.map((r) => ({ ...r, hidden: undefined })))}>
              모두 표시
            </Btn>
            <Btn variant="ghost" size="s" disabled={rows.every((r) => r.hidden === true)} onClick={() => onChange(rows.map((r) => ({ ...r, hidden: true })))}>
              모두 숨김
            </Btn>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function FieldControl({ field, value, onChange, errors, env }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void; errors: FieldErrors; env: FieldEnv }) {
  const path = field.name;
  const id = idOf(path);
  const error = errors[path];
  const aria = { 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy(path, field, error), 'aria-required': field.required || undefined };

  switch (field.type) {
    case 'text':
      return (
        <Wrap field={field} path={path} error={error}>
          <input id={id} className="cms-input" value={str(value)} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} {...aria} />
        </Wrap>
      );
    case 'year':
      return (
        <Wrap field={field} path={path} error={error}>
          <input id={id} className="cms-input" inputMode="numeric" maxLength={4} value={str(value)} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} {...aria} />
        </Wrap>
      );
    case 'textarea':
      return (
        <Wrap field={field} path={path} error={error}>
          <textarea id={id} className="cms-input cms-textarea" rows={field.rows ?? 3} value={str(value)} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} {...aria} />
        </Wrap>
      );
    case 'paragraphs':
      return (
        <Wrap field={field} path={path} error={error}>
          <ParagraphsInput id={id} value={value} rows={field.rows} onChange={onChange} aria={aria} />
        </Wrap>
      );
    case 'tags':
      return (
        <Wrap field={field} path={path} error={error}>
          <TagsInput id={id} value={value} placeholder={field.placeholder} onChange={onChange} aria={aria} />
        </Wrap>
      );
    case 'select':
      return (
        <Wrap field={field} path={path} error={error}>
          <select id={id} className="cms-select" value={str(value)} onChange={(e) => onChange(e.target.value)} {...aria}>
            {!field.required ? <option value="">선택 안 함</option> : null}
            {(field.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Wrap>
      );
    case 'areas': {
      const selected = new Set(Array.isArray(value) ? value.map(str) : []);
      return (
        <Wrap field={field} path={path} error={error} group>
          <div className="cms-checks">
            {areaOptions.map((o) => (
              <label key={o.value} className={cx('cms-check', selected.has(o.value) && 'is-on')}>
                <input
                  type="checkbox"
                  checked={selected.has(o.value)}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) next.add(o.value);
                    else next.delete(o.value);
                    onChange(areaOptions.map((x) => x.value).filter((x) => next.has(x)));
                  }}
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        </Wrap>
      );
    }
    case 'checkbox':
      return (
        <Wrap field={field} path={path} error={error} group>
          <label className="cms-check cms-check--solo">
            <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
            <span>{field.checkboxLabel ?? field.label}</span>
          </label>
        </Wrap>
      );
    case 'image':
      return (
        <Wrap field={field} path={path} error={error} group>
          <ImageInput field={field} value={value} onChange={onChange} env={env} id={id} />
        </Wrap>
      );
    case 'list':
      return (
        <Wrap field={field} path={path} error={error} group>
          <ListInput field={field} value={value} path={path} onChange={onChange} errors={errors} env={env} />
        </Wrap>
      );
    default:
      return null;
  }
}
