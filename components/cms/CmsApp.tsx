'use client';
/**
 * 관리자 화면(/admin) 진입점 — 로그인 확인 → 화면 틀 → 주소(#/…)에 맞는 화면.
 *
 *   #/                 처음 화면
 *   #/news             소식 목록        #/news/new · #/news/edit/<주소>
 *   #/members          구성원 목록      #/members/new · #/members/edit/<주소>
 *   #/alumni           졸업생 목록      #/alumni/move/<구성원 주소> (구성원 → 졸업생 옮기기)
 *   (논문·저역서·학술발표·연구 과제도 같은 모양: #/journals/new · #/journals/edit/<번호> …)
 *
 * 저장소 쓰기 권한이 있는 사람(편집자)은 모두 같은 권한으로, 바뀐 내용을 확인한 뒤 바로 게시합니다.
 */
import { useCallback, useEffect, useState } from 'react';
import { cmsConfig, repoParts } from '@/lib/cms/config';
import { clearToken, getStoredToken, takeAuthResult } from '@/lib/cms/auth';
import { GitHubBackend } from '@/lib/cms/github';
import { collections, isCollectionId } from '@/lib/cms/collections';
import { errorMessage, isCmsError, type CmsUser, type RepoBackend } from '@/lib/cms/types';
import { CmsProvider, useCms } from './context';
import { LoginScreen } from './LoginScreen';
import { Shell } from './Shell';
import { Dashboard } from './Dashboard';
import { CollectionList } from './CollectionList';
import { ItemEditor } from './ItemEditor';
import { Spinner } from './ui';

type AuthState = { status: 'checking' } | { status: 'signed-out'; error?: string } | { status: 'ready'; backend: RepoBackend; user: CmsUser };

const MOCK_FLAG = 'lead-cms:mock-on';

/**
 * 체험용 가짜 저장소 — `if (개발 서버)` 블록 안에서만 불러와야 배포 빌드가 이 코드를 아예 빼고 만듭니다
 * (process.env.NODE_ENV 가 빌드 때 상수로 바뀌어 블록째 지워짐).
 */
async function loadMock() {
  if (process.env.NODE_ENV === 'development') {
    return (await import('@/lib/cms/mock')).MockBackend;
  }
  return null;
}

function noAccessMessage(login: string) {
  return `GitHub 계정 ${login} 에는 이 저장소를 고칠 권한이 없습니다. 연구실 저장소 관리자에게 GitHub 아이디를 알려 협업자(Write)로 초대받은 뒤, 초대 메일의 수락 버튼을 누르고 다시 로그인해 주세요.`;
}

export function CmsApp() {
  const [auth, setAuth] = useState<AuthState>({ status: 'checking' });

  const startGitHub = useCallback(async (token: string) => {
    const parts = repoParts();
    if (!parts) {
      setAuth({ status: 'signed-out', error: 'CMS 저장소 설정(NEXT_PUBLIC_CMS_REPO)이 없습니다. 배포 설정을 확인해 주세요.' });
      return;
    }
    setAuth({ status: 'checking' });
    try {
      const backend = new GitHubBackend(token, parts.owner, parts.name, cmsConfig.branch);
      const user = await backend.getUser();
      if (user.role === 'none') {
        clearToken();
        setAuth({ status: 'signed-out', error: noAccessMessage(user.login) });
        return;
      }
      setAuth({ status: 'ready', backend, user });
    } catch (e) {
      clearToken();
      setAuth({ status: 'signed-out', error: isCmsError(e, 'unauthorized') ? '로그인이 만료되었거나 토큰이 올바르지 않습니다. 다시 로그인해 주세요.' : errorMessage(e) });
    }
  }, []);

  const startMock = useCallback(async () => {
    const MockBackend = await loadMock();
    if (!MockBackend) return;
    window.sessionStorage.setItem(MOCK_FLAG, '1');
    const backend = new MockBackend();
    setAuth({ status: 'ready', backend, user: await backend.getUser() });
  }, []);

  const resetMock = useCallback(async () => {
    (await loadMock())?.reset();
  }, []);

  useEffect(() => {
    const { token, error } = takeAuthResult();
    if (error) {
      setAuth({ status: 'signed-out', error: `GitHub 로그인이 완료되지 않았습니다: ${error}` });
      return;
    }
    if (process.env.NODE_ENV === 'development' && window.sessionStorage.getItem(MOCK_FLAG) === '1') {
      void startMock();
      return;
    }
    const t = token ?? getStoredToken();
    if (t) void startGitHub(t);
    else setAuth({ status: 'signed-out' });
  }, [startGitHub, startMock]);

  const signOut = useCallback((message?: string) => {
    clearToken();
    try {
      window.sessionStorage.removeItem(MOCK_FLAG);
    } catch {
      /* 무시 */
    }
    setAuth({ status: 'signed-out', error: message });
  }, []);

  if (auth.status === 'checking') {
    return (
      <div className="cms cms--center">
        <Spinner label="로그인 정보를 확인하는 중…" />
      </div>
    );
  }
  if (auth.status === 'signed-out') {
    return (
      <LoginScreen
        error={auth.error}
        onToken={(t) => {
          void startGitHub(t);
        }}
        onMock={cmsConfig.mockEnabled ? () => void startMock() : undefined}
      />
    );
  }
  return (
    <CmsProvider key={`${auth.backend.kind}:${auth.user.login}`} backend={auth.backend} user={auth.user} onExpired={(m) => signOut(m)}>
      <Shell
        onSignOut={() => signOut()}
        onResetMock={
          auth.backend.kind === 'mock'
            ? () => {
                void resetMock().then(() => startMock());
              }
            : undefined
        }
      >
        <Router />
      </Shell>
    </CmsProvider>
  );
}

function Router() {
  const { route } = useCms();
  const [first, second, third] = route;
  if (first && isCollectionId(first)) {
    if (second === 'new') return <ItemEditor collection={first} itemKey={null} key={`${first}:new`} />;
    if (second === 'edit' && third) return <ItemEditor collection={first} itemKey={third} key={`${first}:${third}`} />;
    if (second === 'move' && third && collections[first].moveFrom) return <ItemEditor collection={first} itemKey={null} moveFrom={third} key={`${first}:move:${third}`} />;
    return <CollectionList collection={first} key={first} />;
  }
  return <Dashboard />;
}
