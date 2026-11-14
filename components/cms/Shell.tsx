'use client';
/** 관리자 화면 틀 — 위쪽 막대(사이트 반영 상태·사용자) + 왼쪽 메뉴 + 본문 */
import { useEffect, useState, type ReactNode } from 'react';
import { withBasePath } from '@/lib/base-path';
import { collectionGroups } from '@/lib/cms/collections';
import { guideUrl } from '@/lib/cms/config';
import type { DeployInfo } from '@/lib/cms/types';
import { useCms } from './context';
import { Avatar, Notice, Spinner, cx, timeAgo } from './ui';

function DeployStatus() {
  const { backend, deployWatch, fail } = useCms();
  const [info, setInfo] = useState<DeployInfo | null>(null);
  const [since, setSince] = useState<number>(0);

  useEffect(() => {
    if (deployWatch > 0) setSince(Date.now());
  }, [deployWatch]);

  useEffect(() => {
    let alive = true;
    let timer = 0;
    const tick = async () => {
      try {
        const d = await backend.latestDeploy();
        if (!alive) return;
        setInfo(d);
        const watching = since > 0 && Date.now() - since < 8 * 60 * 1000;
        const running = d && d.status !== 'completed';
        const stale = watching && (!d || new Date(d.createdAt).getTime() < since - 30 * 1000);
        timer = window.setTimeout(tick, running || stale ? 8000 : 60000);
      } catch (e) {
        if (alive) fail(e);
      }
    };
    void tick();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [backend, since, fail]);

  if (!info) return null;
  const running = info.status !== 'completed';
  const waiting = since > 0 && new Date(info.createdAt).getTime() < since - 30 * 1000 && Date.now() - since < 3 * 60 * 1000;
  let text: string;
  let tone: 'ok' | 'busy' | 'bad';
  if (running || waiting) {
    text = '사이트에 반영하는 중…';
    tone = 'busy';
  } else if (info.conclusion === 'success') {
    text = `사이트 최신 상태 · ${timeAgo(info.updatedAt)}`;
    tone = 'ok';
  } else {
    text = '사이트 반영 실패 — 확인 필요';
    tone = 'bad';
  }
  const inner = (
    <>
      <span className={cx('cms-deploy__dot', `is-${tone}`)} aria-hidden="true" />
      {text}
    </>
  );
  return info.url ? (
    <a className="cms-deploy" href={info.url} target="_blank" rel="noreferrer noopener" title="GitHub 에서 배포 기록 보기">
      {inner}
    </a>
  ) : (
    <span className="cms-deploy">{inner}</span>
  );
}

export function Shell({ children, onSignOut, onResetMock }: { children: ReactNode; onSignOut: () => void; onResetMock?: () => void }) {
  const { user, backend, route, navigate } = useCms();
  const current = route[0] ?? '';
  const guide = guideUrl();
  const navLink = (id: string, label: string) => (
    <li key={id || 'home'}>
      <a
        href={`#/${id}`}
        className={cx('cms-nav__item', current === id && 'is-current')}
        aria-current={current === id ? 'page' : undefined}
        onClick={(e) => {
          e.preventDefault();
          navigate(id);
        }}
      >
        <span>{label}</span>
      </a>
    </li>
  );

  return (
    <div className="cms">
      <header className="cms-top">
        <a className="cms-top__brand" href="#/" onClick={(e) => (e.preventDefault(), navigate(''))}>
          LEAD AI LAB<span aria-hidden="true">.</span> <span className="cms-top__sub">관리</span>
        </a>
        <div className="cms-top__right">
          <DeployStatus />
          <a className="cms-top__link" href={withBasePath('/')} target="_blank" rel="noreferrer noopener">
            사이트 보기 ↗
          </a>
          {guide ? (
            <a className="cms-top__link" href={guide} target="_blank" rel="noreferrer noopener">
              사용 안내 ↗
            </a>
          ) : null}
          <span className="cms-top__user">
            <Avatar src={user.avatarUrl} name={user.name} />
            <span className="cms-top__name">{user.name}</span>
          </span>
          <button type="button" className="cms-top__link" onClick={onSignOut}>
            로그아웃
          </button>
        </div>
      </header>

      {backend.kind === 'mock' ? (
        <div className="cms-mockbar" role="note">
          <span>
            <strong>체험 모드</strong> — 이 탭 안의 가짜 저장소입니다. 실제 저장소·사이트는 바뀌지 않습니다.
          </span>
          <button type="button" className="cms-top__link" onClick={onResetMock}>
            체험 데이터 초기화
          </button>
        </div>
      ) : null}

      <div className="cms-body">
        <nav className="cms-nav" aria-label="관리 메뉴">
          <ul role="list">{navLink('', '처음 화면')}</ul>
          {collectionGroups.map((g) => (
            <div key={g.title} className="cms-nav__group">
              <p className="cms-nav__label" aria-hidden="true">
                {g.title}
              </p>
              <ul role="list" aria-label={g.title}>
                {g.items.map((c) => navLink(c.id, c.label))}
              </ul>
            </div>
          ))}
          <p className="cms-nav__repo">
            저장소{' '}
            {backend.webUrl ? (
              <a href={backend.webUrl} target="_blank" rel="noreferrer noopener">
                {backend.repoLabel}
              </a>
            ) : (
              backend.repoLabel
            )}
          </p>
        </nav>
        <main className="cms-main" id="cms-main">
          <LoadGate>{children}</LoadGate>
        </main>
      </div>
    </div>
  );
}

function LoadGate({ children }: { children: ReactNode }) {
  const { snapshot, loading, loadError, reload } = useCms();
  if (loadError && !snapshot) {
    return (
      <Notice
        tone="danger"
        title="저장소를 읽지 못했습니다"
        actions={
          <button type="button" className="cms-btn cms-btn--secondary" onClick={() => void reload()}>
            <span>다시 시도</span>
          </button>
        }
      >
        {loadError}
      </Notice>
    );
  }
  if (!snapshot && loading) return <Spinner label="저장소에서 내용을 불러오는 중…" />;
  return <>{children}</>;
}
