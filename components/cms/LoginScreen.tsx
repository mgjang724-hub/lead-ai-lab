'use client';
import { useState } from 'react';
import { loginUrl } from '@/lib/cms/auth';
import { cmsConfig } from '@/lib/cms/config';
import { Btn, Notice } from './ui';

export function LoginScreen({ error, onToken, onMock }: { error?: string; onToken: (token: string) => void; onMock?: () => void }) {
  const [token, setToken] = useState('');
  const url = typeof window !== 'undefined' ? loginUrl() : null;
  return (
    <div className="cms cms--center">
      <main className="cms-login" aria-labelledby="cms-login-title">
        <p className="cms-login__brand">
          LEAD AI LAB<span aria-hidden="true">.</span>
        </p>
        <h1 id="cms-login-title" className="cms-login__title">
          홈페이지 관리
        </h1>
        <p className="cms-login__lead">소식·구성원·졸업생을 고치고, 바뀐 내용을 확인한 뒤 사이트에 게시합니다. 연구실 저장소에 초대받은 GitHub 계정으로 로그인하세요.</p>

        {error ? <Notice tone="danger">{error}</Notice> : null}

        {url ? (
          <a className="cms-btn cms-btn--primary cms-login__main" href={url}>
            <span>GitHub 계정으로 로그인</span>
          </a>
        ) : (
          <Notice tone="warn" title="GitHub 로그인이 아직 설정되지 않았습니다">
            로그인 중계 서버 주소(CMS_AUTH_URL)가 없습니다. 저장소의 <code>docs/CMS-설정-안내.md</code> 를 따라 설정하면 &lsquo;GitHub 계정으로 로그인&rsquo; 버튼이 생깁니다. 그 전에는 아래 토큰 로그인을 쓸 수 있습니다.
          </Notice>
        )}

        <details className="cms-login__more" open={!url && !onMock}>
          <summary>토큰으로 로그인 (설정 전·비상용)</summary>
          <form
            className="cms-login__token"
            onSubmit={(e) => {
              e.preventDefault();
              if (token.trim()) onToken(token.trim());
            }}
          >
            <label className="cms-label" htmlFor="cms-token">
              GitHub 개인 접근 토큰
            </label>
            <input
              id="cms-token"
              className="cms-input"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_…"
            />
            <p className="cms-help">
              GitHub › Settings › Developer settings › Fine-grained tokens 에서 <strong>{cmsConfig.repo || '이 저장소'}</strong> 하나만 고르고 Contents·Pull requests 를 Read and write 로 준 토큰을 만듭니다. 토큰은 이 탭에만 보관되고 탭을 닫으면 지워집니다.
            </p>
            <Btn type="submit" variant="secondary" disabled={!token.trim()}>
              토큰으로 로그인
            </Btn>
          </form>
        </details>

        {onMock ? (
          <section className="cms-login__mock" aria-labelledby="cms-mock-title">
            <h2 id="cms-mock-title" className="cms-login__subtitle">
              체험 모드 (개발 서버 전용)
            </h2>
            <p className="cms-help">실제 저장소를 건드리지 않고 이 탭 안의 가짜 저장소로 편집·확인·게시 흐름을 시험합니다.</p>
            <div className="cms-row">
              <Btn variant="secondary" onClick={onMock}>
                체험 모드로 들어가기
              </Btn>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
