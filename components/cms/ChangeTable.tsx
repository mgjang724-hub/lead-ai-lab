'use client';
/** 바뀐 칸 표 — 게시 전 확인 창에서 "지금 사이트" 와 "게시할 내용" 을 나란히 보여 줍니다 */
import type { ReactNode } from 'react';
import { areaOptions, type CollectionDef, type FieldDef, type Item } from '@/lib/cms/collections';
import type { ProjectRef } from '@/lib/cms/engine';
import { sameValue } from '@/lib/cms/ops';
import { Thumb } from './Thumb';

function formatValue(f: FieldDef, v: unknown, projects: ProjectRef[], images: Record<string, string>): ReactNode {
  if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) return <span className="cms-muted">없음</span>;
  switch (f.type) {
    case 'select':
      return f.options?.find((o) => o.value === v)?.label ?? String(v);
    case 'areas':
      return (v as string[]).map((a) => areaOptions.find((o) => o.value === a)?.label ?? a).join(', ');
    case 'tags':
      return (v as string[]).join(', ');
    case 'paragraphs':
      return <span className="cms-pre">{(v as string[]).join('\n\n')}</span>;
    case 'checkbox':
      return v === true ? '예' : '아니오';
    case 'image':
      return <Thumb src={images[v as string] ?? (v as string)} label="사진" ratio={f.image?.mode === 'crop' ? 'portrait' : 'landscape'} />;
    case 'list':
      return (
        <span className="cms-pre">
          {(v as Item[])
            .map((r) => {
              const p = r.projectId ? projects.find((x) => x.id === r.projectId) : null;
              const head = p ? `[연구실 과제] ${p.title} (${p.period})` : [r.period, r.title].filter(Boolean).join(' · ');
              const line = [head, r.role, r.detail].filter(Boolean).join(' · ');
              return r.hidden === true ? `${line}  — 사이트에 표시 안 함` : line;
            })
            .join('\n')}
        </span>
      );
    default:
      return <span className="cms-pre">{String(v)}</span>;
  }
}

/** 바뀐 칸 수 (0 이면 게시할 것이 없음) */
export function countChanges(def: CollectionDef, before: Item | null, after: Item): number {
  return ['slug', ...def.fields.map((f) => f.name)].filter((n) => !sameValue(before?.[n] ?? null, after[n] ?? null)).length;
}

export function ChangeTable({
  def,
  before,
  after,
  projects,
  images,
}: {
  def: CollectionDef;
  before: Item | null;
  after: Item;
  projects: ProjectRef[];
  images: Record<string, string>;
}) {
  const rows = [{ name: 'slug', label: '주소', type: 'text' } as FieldDef, ...def.fields]
    .map((f) => ({ f, old: before?.[f.name], now: after[f.name] }))
    .filter((r) => !sameValue(r.old ?? null, r.now ?? null));
  if (!rows.length) return <p className="cms-muted">바뀐 내용이 없습니다.</p>;
  return (
    <table className="cms-diff">
      <thead>
        <tr>
          <th scope="col">칸</th>
          {before ? <th scope="col">지금 사이트</th> : null}
          <th scope="col">{before ? '게시할 내용' : '새로 올릴 내용'}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ f, old, now }) => (
          <tr key={f.name}>
            <th scope="row">{f.label}</th>
            {before ? <td className="cms-diff__old">{formatValue(f, old, projects, images)}</td> : null}
            <td className="cms-diff__new">{formatValue(f, now, projects, images)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
