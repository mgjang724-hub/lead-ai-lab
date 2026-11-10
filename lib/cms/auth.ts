/**
 * 로그인 — "GitHub로 로그인" 은 로그인 중계 서버(cms-auth/worker.js)를 거쳐 GitHub 토큰을 받아 옵니다.
 *
 *   관리자 화면 → 중계 서버 /login → GitHub 로그인·허용 → 중계 서버 /callback → 관리자 화면#cms_token=…
 *
 * 토큰은 주소의 # 뒷부분(서버로 전송되지 않음)으로 돌아오며, 받자마자 주소에서 지우고 이 탭의 sessionStorage 에만 둡니다.
 * 탭을 닫으면 사라지므로 공용 PC 에서도 안전하게 쓸 수 있습니다. GitHub App 토큰은 8시간 뒤 만료됩니다.
 */
import { cmsConfig } from './config';

const TOKEN_KEY = 'lead-cms:token';

function session(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  return session()?.getItem(TOKEN_KEY) ?? null;
}

export function storeToken(token: string) {
  session()?.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  session()?.removeItem(TOKEN_KEY);
}

/** 로그인 후 돌아온 주소(#cms_token=… 또는 #cms_error=…)를 읽고 주소에서 지웁니다 */
export function takeAuthResult(): { token?: string; error?: string } {
  const hash = window.location.hash.replace(/^#/, '');
  if (!/(^|&)cms_(token|error)=/.test(hash)) return {};
  const params = new URLSearchParams(hash);
  const token = params.get('cms_token') ?? undefined;
  const error = params.get('cms_error') ?? undefined;
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  if (token) storeToken(token);
  return { token, error };
}

/** 지금 주소(관리자 화면)로 돌아오도록 한 중계 서버 로그인 주소. 중계 서버가 설정되지 않았으면 null */
export function loginUrl(): string | null {
  if (!cmsConfig.authUrl) return null;
  const back = `${window.location.origin}${window.location.pathname}`;
  return `${cmsConfig.authUrl}/login?return=${encodeURIComponent(back)}`;
}
