/**
 * LEAD AI Lab 관리자 화면 — GitHub 로그인 중계 서버 (Cloudflare Workers)
 *
 * GitHub Pages 에는 서버가 없어서, "GitHub로 로그인" 의 마지막 단계(로그인 코드 → 토큰 교환)에 필요한
 * 비밀값(client secret)을 둘 곳이 없습니다. 이 작은 서버가 그 교환 한 가지만 대신 합니다.
 * 데이터베이스·저장 공간이 없고, 받은 토큰을 저장하지도 않습니다.
 *
 *   관리자 화면 → /login?return=<관리자 화면 주소> → GitHub 로그인·허용 → /callback → 관리자 화면#cms_token=…
 *
 * 환경 변수 (Cloudflare 대시보드 › Workers › 이 Worker › Settings › Variables and Secrets)
 *   GITHUB_CLIENT_ID       GitHub App 의 Client ID
 *   GITHUB_CLIENT_SECRET   GitHub App 의 Client secret  ← 반드시 "Secret" 형식으로
 *   ALLOWED_RETURN_URLS    토큰을 돌려보내도 되는 관리자 화면 주소(쉼표로 구분)
 *                          예: https://smu-edtech-lab.github.io/lead-ai-lab/admin,http://localhost:3000/admin
 *
 * 설정 방법 전체: docs/CMS-설정-안내.md
 */

const COOKIE = 'lead_cms_auth';

function normalize(u) {
  return u.replace(/\/+$/, '').replace(/\.html$/, '');
}

/** 허용 목록에 있는 관리자 화면 주소면 그 주소(# 없이)를, 아니면 null */
function allowedReturn(env, value) {
  const allowed = String(env.ALLOWED_RETURN_URLS || '')
    .split(',')
    .map((s) => normalize(s.trim()))
    .filter(Boolean);
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' && u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') return null;
    const target = normalize(`${u.origin}${u.pathname}`);
    return allowed.includes(target) ? `${u.origin}${u.pathname}` : null;
  } catch {
    return null;
  }
}

function randomHex(bytes) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

const baseHeaders = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' };

function text(body, status = 200) {
  return new Response(body, { status, headers: { ...baseHeaders, 'Content-Type': 'text/plain; charset=utf-8' } });
}

function redirect(location, cookie) {
  const headers = new Headers({ ...baseHeaders, Location: location });
  if (cookie) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 302, headers });
}

const clearCookie = `${COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/login') {
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return text('GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET 환경 변수가 설정되지 않았습니다.', 500);
      const back = allowedReturn(env, url.searchParams.get('return') || '');
      if (!back) return text('허용되지 않은 관리자 화면 주소입니다. Worker 의 ALLOWED_RETURN_URLS 설정을 확인해 주세요.', 400);
      const state = randomHex(16);
      const auth = new URL('https://github.com/login/oauth/authorize');
      auth.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      auth.searchParams.set('redirect_uri', `${url.origin}/callback`);
      auth.searchParams.set('state', state);
      const value = encodeURIComponent(`${state}|${back}`);
      return redirect(auth.toString(), `${COOKIE}=${value}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`);
    }

    if (url.pathname === '/callback') {
      const saved = readCookie(request, COOKIE) || '';
      const cut = saved.indexOf('|');
      const state = cut > 0 ? saved.slice(0, cut) : '';
      const back = cut > 0 ? allowedReturn(env, saved.slice(cut + 1)) : null;
      if (!state || !back || url.searchParams.get('state') !== state) {
        return text('로그인 요청이 만료되었거나 올바르지 않습니다. 관리자 화면에서 다시 로그인해 주세요.', 400);
      }
      const ghError = url.searchParams.get('error');
      if (ghError) return redirect(`${back}#cms_error=${encodeURIComponent(url.searchParams.get('error_description') || ghError)}`, clearCookie);

      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'lead-ai-lab-cms-auth' },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code: url.searchParams.get('code') || '',
          redirect_uri: `${url.origin}/callback`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.access_token) {
        return redirect(`${back}#cms_error=${encodeURIComponent(data.error_description || data.error || '토큰을 받지 못했습니다')}`, clearCookie);
      }
      const extra = data.expires_in ? `&cms_expires=${encodeURIComponent(String(data.expires_in))}` : '';
      return redirect(`${back}#cms_token=${encodeURIComponent(data.access_token)}${extra}`, clearCookie);
    }

    return text('LEAD AI Lab 관리자 화면의 GitHub 로그인 중계 서버입니다.');
  },
};
