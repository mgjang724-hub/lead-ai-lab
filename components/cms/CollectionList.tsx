'use client';
/** 항목 목록 — 추가·편집으로 가고, 구성원은 순서를 바꿔 저장합니다 */
import { useMemo, useState } from 'react';
import { collectionItems, collections, keyOf, type CollectionId, type Item } from '@/lib/cms/collections';
import { publishDirect } from '@/lib/cms/engine';
import { isCmsError } from '@/lib/cms/types';
import type { Op } from '@/lib/cms/ops';
import { useCms } from './context';
import { Thumb } from './Thumb';
import { Badge, Btn, Notice } from './ui';

export function CollectionList({ collection }: { collection: CollectionId }) {
  const def = collections[collection];
  const { snapshot, navigate, user, backend, notify, fail, reload, watchDeploy, setDirty } = useCms();
  const items = useMemo(() => {
    const list = collectionItems(snapshot?.files[def.file], def);
    return def.orderable || !def.sort ? list : list.slice().sort(def.sort);
  }, [snapshot, def]);
  const [order, setOrder] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');

  /* 항목이 많은 목록(논문 등)은 제목·저자·게재지로 찾기 — 순서를 바꾸는 중에는 찾기를 쓰지 않음 */
  const searchable = items.length > 12 && !def.orderable;
  const needle = q.trim().toLowerCase();
  const filtered = searchable && needle ? items.filter((it) => [def.title(it), def.meta(it), it.authors, keyOf(it)].join(' ').toLowerCase().includes(needle)) : items;
  const shown: Item[] = order ? order.map((k) => items.find((x) => keyOf(x) === k)).filter((x): x is Item => !!x) : filtered;

  const move = (i: number, d: -1 | 1) => {
    const keys = (order ?? items.map(keyOf)).slice();
    const j = i + d;
    if (j < 0 || j >= keys.length) return;
    [keys[i], keys[j]] = [keys[j], keys[i]];
    setOrder(keys);
    setDirty(true);
  };

  const saveOrder = async (force = false) => {
    if (!order) return;
    setSaving(true);
    const ops: Op[] = [{ kind: 'order', collection, keys: order }];
    try {
      await publishDirect(backend, user, ops, { force });
      notify('순서를 게시했습니다. 1~2분 뒤 사이트에 반영됩니다.');
      watchDeploy();
      setDirty(false);
      setOrder(null);
      await reload();
    } catch (e) {
      if (isCmsError(e, 'conflict')) notify('저장 중 다른 변경과 겹쳤습니다. 다시 시도해 주세요.', 'error');
      else fail(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cms-page">
      <header className="cms-page__head cms-page__head--row">
        <div>
          <h1 className="cms-h1">{def.label}</h1>
          <p className="cms-lead">{def.description}</p>
        </div>
        <Btn variant="primary" onClick={() => navigate(`${collection}/new`)}>
          + {def.itemLabel} 추가
        </Btn>
      </header>

      {order ? (
        <Notice
          tone="warn"
          title="순서를 바꿨습니다"
          actions={
            <>
              <Btn
                variant="ghost"
                onClick={() => {
                  setOrder(null);
                  setDirty(false);
                }}
              >
                되돌리기
              </Btn>
              <Btn variant="primary" busy={saving} onClick={() => void saveOrder()}>
                이 순서로 게시
              </Btn>
            </>
          }
        >
          같은 과정(박사·석사 등) 안에서 이 순서대로 People 페이지에 나옵니다.
        </Notice>
      ) : null}

      {searchable ? (
        <div className="cms-search">
          <label className="cms-visually-hidden" htmlFor="cms-list-q">
            {def.label} 찾기
          </label>
          <input id="cms-list-q" className="cms-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${def.label} ${items.length}건에서 제목·저자·게재지·번호로 찾기`} />
          {needle ? <span className="cms-search__count">{filtered.length}건</span> : null}
        </div>
      ) : null}

      {shown.length === 0 && needle ? (
        <p className="cms-empty">‘{q.trim()}’ 와(과) 맞는 {def.itemLabel}이(가) 없습니다.</p>
      ) : shown.length === 0 ? (
        <div className="cms-empty">
          <p>아직 {def.itemLabel}이(가) 없습니다.</p>
          <Btn variant="secondary" onClick={() => navigate(`${collection}/new`)}>
            첫 {def.itemLabel} 추가하기
          </Btn>
        </div>
      ) : (
        <ul className="cms-list" role="list">
          {shown.map((item, i) => {
            const key = keyOf(item);
            return (
              <li key={key || i} className="cms-list__row">
                <a
                  className="cms-list__main"
                  href={`#/${collection}/edit/${encodeURIComponent(key)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`${collection}/edit/${encodeURIComponent(key)}`);
                  }}
                >
                  {def.listThumb === 'none' ? (
                    <span className="cms-list__key">{key}</span>
                  ) : (
                    <Thumb src={def.thumb(item)} label={def.title(item)} ratio={def.listThumb ?? 'portrait'} />
                  )}
                  <span className="cms-list__text">
                    <span className="cms-list__title">
                      {def.title(item)}
                      {item.isSample ? <Badge tone="sample">예시</Badge> : null}
                    </span>
                    <span className="cms-list__meta">{def.meta(item)}</span>
                  </span>
                  <span className="cms-list__go" aria-hidden="true">
                    편집 →
                  </span>
                </a>
                {def.orderable ? (
                  <span className="cms-list__order">
                    <button type="button" className="cms-iconbtn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`${def.title(item)} 위로`}>
                      ↑
                    </button>
                    <button type="button" className="cms-iconbtn" onClick={() => move(i, 1)} disabled={i === shown.length - 1} aria-label={`${def.title(item)} 아래로`}>
                      ↓
                    </button>
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
