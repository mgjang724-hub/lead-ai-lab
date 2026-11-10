'use client';
/**
 * 관리자 화면 상태 — 로그인한 사람, 저장소 백엔드, 저장소에서 읽은 데이터, 화면 이동, 알림.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { loadSnapshot, type RepoSnapshot } from '@/lib/cms/engine';
import { errorMessage, isCmsError, type CmsUser, type RepoBackend } from '@/lib/cms/types';
import { Toasts, type Toast } from './ui';

export interface CmsContextValue {
  backend: RepoBackend;
  user: CmsUser;
  snapshot: RepoSnapshot | null;
  loading: boolean;
  loadError: string | null;
  reload: () => Promise<void>;
  notify: (text: string, tone?: Toast['tone']) => void;
  /** 오류 처리 — 로그인 만료면 로그인 화면으로, 아니면 알림 */
  fail: (e: unknown) => void;
  route: string[];
  navigate: (path: string) => void;
  setDirty: (dirty: boolean) => void;
  /** 저장 후 배포 상태를 자주 확인하도록 */
  deployWatch: number;
  watchDeploy: () => void;
}

const Ctx = createContext<CmsContextValue | null>(null);

export function useCms(): CmsContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCms 는 CmsProvider 안에서만 씁니다');
  return v;
}

function parseHash(): string[] {
  return window.location.hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((s) => decodeURIComponent(s));
}

const LEAVE_MESSAGE = '저장하지 않은 수정 내용이 있습니다. 이 화면을 떠날까요?';

export function CmsProvider({ backend, user, onExpired, children }: { backend: RepoBackend; user: CmsUser; onExpired: (message: string) => void; children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<RepoSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [route, setRoute] = useState<string[]>([]);
  const [deployWatch, setDeployWatch] = useState(0);
  const dirty = useRef(false);
  const lastHash = useRef('');
  const toastId = useRef(0);

  const notify = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-3), { id, text, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 9000 : 5000);
  }, []);

  const fail = useCallback(
    (e: unknown) => {
      if (isCmsError(e, 'unauthorized')) {
        onExpired(errorMessage(e));
        return;
      }
      notify(errorMessage(e), 'error');
    },
    [notify, onExpired],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setSnapshot(await loadSnapshot(backend));
      setLoadError(null);
    } catch (e) {
      if (isCmsError(e, 'unauthorized')) onExpired(errorMessage(e));
      else setLoadError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [backend, onExpired]);

  useEffect(() => {
    void reload();
  }, [reload]);

  /* 화면 이동 — 주소의 # 뒷부분(#/news/edit/…)으로 */
  useEffect(() => {
    lastHash.current = window.location.hash;
    setRoute(parseHash());
    const onHash = () => {
      if (dirty.current && !window.confirm(LEAVE_MESSAGE)) {
        window.history.replaceState(null, '', lastHash.current || window.location.pathname);
        return;
      }
      dirty.current = false;
      lastHash.current = window.location.hash;
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      e.preventDefault();
      e.returnValue = LEAVE_MESSAGE;
    };
    window.addEventListener('hashchange', onHash);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, []);

  const navigate = useCallback((path: string) => {
    const next = `#/${path.replace(/^\/+/, '')}`;
    if (next === window.location.hash) return;
    if (dirty.current && !window.confirm(LEAVE_MESSAGE)) return;
    dirty.current = false;
    window.location.hash = next;
  }, []);

  const setDirty = useCallback((d: boolean) => {
    dirty.current = d;
  }, []);

  const watchDeploy = useCallback(() => setDeployWatch((n) => n + 1), []);

  const value: CmsContextValue = {
    backend,
    user,
    snapshot,
    loading,
    loadError,
    reload,
    notify,
    fail,
    route,
    navigate,
    setDirty,
    deployWatch,
    watchDeploy,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <Toasts items={toasts} onClose={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </Ctx.Provider>
  );
}
