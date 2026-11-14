'use client';
/**
 * ContactForm — 문의 유형 칩, 이름, 이메일, 소속, 내용, 동의. blur·submit 시 검증.
 * 메일로 보내기(2026-11-15 연구실 요청): content/site.ts 의 email 이 있으면 보내기 버튼이 방문자의 메일 앱을 열고
 *   받는 주소·제목·본문을 채워 줍니다. 실제 발송은 방문자가 메일 앱에서 보내기를 눌러야 이루어지므로, 이 화면은 '전송 완료'라고 말하지 않습니다.
 *   메일 앱이 열리지 않는 환경을 위해 정리된 내용과 복사 버튼, 받는 주소를 함께 보여 줍니다. 예시(가상) 주소에는 '예시' 배지가 붙습니다.
 * email 이 없으면 검증을 통과한 내용을 정리해 보여 주기만 합니다(복사용).
 * 메일 앱 없이 사이트에서 바로 발송하려면 전송 서버가 필요합니다 — onSubmit(data) → Promise 를 넘기면 그때부터 실제 전송 상태(보내는 중·완료·오류)를 표시합니다.
 */
import { useEffect, useRef, useState } from 'react';
import { cx, motion } from '@/lib/motion/core';
import { site } from '@/content/site';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Checkbox, FilterChips, TextField } from '@/components/ui/Controls';

export interface ContactData {
  purpose: string;
  name: string;
  email: string;
  org: string;
  message: string;
  agree: boolean;
}
const PURPOSES = [
  { value: 'admission', label: '대학원 진학 문의' },
  { value: 'collab', label: '공동연구 제안' },
  { value: 'etc', label: '기타 문의' },
];
const empty = (): ContactData => ({ purpose: PURPOSES[0].value, name: '', email: '', org: '', message: '', agree: false });

/* 받는 주소 표시 — 예시(가상) 주소면 '예시' 배지를 붙입니다 */
function LabAddress() {
  return (
    <span className="lab-form__addr">
      {site.email}
      {site.emailIsSample ? <span className="lab-badge lab-badge--sample">예시</span> : null}
    </span>
  );
}

type Errors = Partial<Record<keyof ContactData, string>>;
function rules(x: ContactData): Errors {
  const r: Errors = {};
  if (!x.name.trim()) r.name = '이름을 입력해 주세요.';
  if (!x.email.trim()) r.email = '이메일을 입력해 주세요.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email)) r.email = '이메일 형식을 확인해 주세요. 예: name@example.com';
  if (x.message.trim().length < 10) r.message = '문의 내용을 10자 이상 입력해 주세요.';
  if (!x.agree) r.agree = '개인정보 수집·이용에 동의해 주세요.';
  return r;
}

export function ContactForm({ onSubmit, className }: { onSubmit?: (d: ContactData) => Promise<unknown>; className?: string }) {
  const [d, setD] = useState<ContactData>(empty);
  const [err, setErr] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ContactData, boolean>>>({});
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error' | 'ready'>('idle');
  const [copied, setCopied] = useState(false);
  const done = useRef<HTMLDivElement>(null);
  const upd = <K extends keyof ContactData>(k: K, v: ContactData[K]) => {
    const n = { ...d, [k]: v };
    setD(n);
    if (touched[k]) setErr(rules(n));
  };
  const blur = (k: keyof ContactData) => {
    setTouched({ ...touched, [k]: true });
    setErr(rules(d));
  };
  const composed = () =>
    [
      `[문의 유형] ${PURPOSES.find((p) => p.value === d.purpose)?.label ?? d.purpose}`,
      `[이름] ${d.name.trim()}`,
      `[이메일] ${d.email.trim()}`,
      d.org.trim() ? `[소속] ${d.org.trim()}` : null,
      '',
      d.message.trim(),
    ]
      .filter((l) => l !== null)
      .join('\n');
  const purposeLabel = () => PURPOSES.find((p) => p.value === d.purpose)?.label ?? d.purpose;
  /* 연구실 메일 주소가 있을 때의 mailto 주소(받는 주소·제목·본문 채움). 없으면 null */
  const mailHref = () => (site.email ? `mailto:${site.email}?subject=${encodeURIComponent(`[연구실 문의] ${purposeLabel()} — ${d.name.trim()}`)}&body=${encodeURIComponent(composed())}` : null);
  const submit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const r = rules(d);
    setErr(r);
    setTouched({ name: true, email: true, message: true, agree: true });
    if (Object.keys(r).length) {
      ev.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    if (!onSubmit) {
      /* 전송 서버 미연결: 연구실 메일 주소가 있으면 방문자의 메일 앱을 열어 내용을 채워 주고(보내기는 메일 앱에서), 이어서 정리된 내용을 보여 줌 */
      const href = mailHref();
      if (href) window.open(href, '_self');
      setState('ready');
      return;
    }
    setState('loading');
    onSubmit(d).then(
      () => setState('done'),
      () => setState('error'),
    );
  };
  useEffect(() => {
    if ((state === 'done' || state === 'ready') && done.current) {
      done.current.focus();
      motion.animate(done.current, [{ opacity: 0, transform: 'translate3d(0,24px,0)' }, { opacity: 1, transform: 'none' }], { duration: 'dur-slower', easing: 'ease-out' });
    }
  }, [state]);
  const reset = () => {
    setD(empty());
    setTouched({});
    setErr({});
    setState('idle');
  };
  const copy = () => {
    const ok = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    try {
      navigator.clipboard.writeText(composed()).then(ok, ok);
    } catch {
      ok();
    }
  };

  if (state === 'done')
    return (
      <div ref={done} className="lab-form__done" tabIndex={-1} role="status">
        <span className="lab-form__donecheck" aria-hidden="true">
          <svg viewBox="0 0 48 48">
            <circle cx={24} cy={24} r={22} />
            <path d="M14 24.5l6.5 6.5L34 17.5" />
          </svg>
        </span>
        <h3 className="lab-t-h3">Thank you.</h3>
        <p className="lab-t-body-l">문의가 접수되었습니다. 담당자가 확인 후 입력하신 이메일로 회신드립니다.</p>
        <Button variant="secondary" icon={null} onClick={reset}>
          새 문의 작성
        </Button>
      </div>
    );

  if (state === 'ready') {
    const text = composed();
    const href = mailHref();
    return (
      <div ref={done} className="lab-form__done" tabIndex={-1} role="status">
        <h3 className="lab-t-h3">{href ? '메일 앱으로 문의 내용을 넘겼습니다.' : '문의 내용이 정리되었습니다.'}</h3>
        <div className="lab-form__status">
          <Icon name={href ? 'mail' : 'alert'} size={18} />
          {href ? (
            <p>
              <b>메일 앱에서 보내기를 눌러야 문의가 전송됩니다.</b> 메일 앱이 열리지 않았다면 아래 내용을 복사해 <LabAddress /> 주소로 보내 주시거나, 연구실 전화(
              <a href={site.phoneHref}>{site.phone}</a>)로 문의해 주세요.
            </p>
          ) : (
            <p>
              <b>온라인 접수는 준비 중입니다.</b> 아래 내용을 복사해 연구실로 보내 주시거나, 연구실 전화(
              <a href={site.phoneHref}>{site.phone}</a>)로 문의해 주세요.
            </p>
          )}
        </div>
        <div className="lab-form__preview">
          <span className="lab-t-label">Message preview</span>
          <pre>{text}</pre>
        </div>
        <div className="lab-form__actions">
          {href ? (
            <Button variant="primary" icon="mail" href={href}>
              메일 앱 다시 열기
            </Button>
          ) : null}
          <Button variant={href ? 'secondary' : 'primary'} icon={copied ? 'check' : 'copy'} onClick={copy}>
            {copied ? '복사됨' : '내용 복사'}
          </Button>
          <Button variant="ghost" icon={null} onClick={() => setState('idle')}>
            수정하기
          </Button>
          <Button variant="ghost" icon={null} onClick={reset}>
            새로 작성
          </Button>
        </div>
      </div>
    );
  }

  const show = (k: keyof ContactData) => (touched[k] ? err[k] : undefined);
  return (
    <form className={cx('lab-form', className)} noValidate onSubmit={submit} aria-busy={state === 'loading'}>
      <fieldset className="lab-form__set">
        <legend className="lab-t-label lab-form__legend">문의 유형</legend>
        <FilterChips label="문의 유형" options={PURPOSES} value={d.purpose} multiple={false} showAll={false} onToggle={(v) => upd('purpose', v)} />
      </fieldset>
      <div className="lab-form__grid">
        <TextField label="이름" name="name" required value={d.name} onChange={(v) => upd('name', v)} onBlur={() => blur('name')} error={show('name')} valid={!!touched.name && !err.name} autoComplete="name" />
        <TextField label="이메일" name="email" type="email" required value={d.email} onChange={(v) => upd('email', v)} onBlur={() => blur('email')} error={show('email')} valid={!!touched.email && !err.email} autoComplete="email" />
        <TextField label="소속 (선택)" name="org" value={d.org} onChange={(v) => upd('org', v)} hint="학교·기관명" className="lab-form__full" autoComplete="organization" />
        <TextField
          label="문의 내용"
          name="message"
          required
          multiline
          rows={5}
          value={d.message}
          onChange={(v) => upd('message', v)}
          onBlur={() => blur('message')}
          error={show('message')}
          hint="관심 연구 분야나 희망 입학 시기를 함께 적어 주시면 빠르게 안내드릴 수 있습니다."
          className="lab-form__full"
        />
      </div>
      <Checkbox
        label="문의 처리를 위한 개인정보(이름·이메일·문의 내용) 수집·이용에 동의합니다."
        checked={d.agree}
        onChange={(v) => {
          upd('agree', v);
          setTouched({ ...touched, agree: true });
        }}
        error={show('agree')}
      />
      {!onSubmit ? (
        <p className="lab-form__status">
          <Icon name={site.email ? 'mail' : 'alert'} size={18} />
          {site.email ? (
            <span>
              보내기를 누르면 메일 앱이 열리고 입력한 내용이 채워집니다. 메일 앱에서 한 번 더 보내기를 눌러야 전송됩니다. 받는 주소: <LabAddress />
            </span>
          ) : (
            <span>온라인 접수는 준비 중입니다. 확인 버튼을 누르면 입력 내용을 정리해 보여 드리며, 복사해 연구실로 보내 주실 수 있습니다.</span>
          )}
        </p>
      ) : null}
      {state === 'error' ? (
        <p className="lab-field__error" role="alert">
          <Icon name="alert" size={14} />
          전송에 실패했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}
      <div className="lab-form__submit">
        <Button type="submit" variant="primary" size="l" magnetic loading={state === 'loading'}>
          {state === 'loading' ? '보내는 중' : onSubmit ? '문의 보내기' : site.email ? '메일로 보내기' : '입력 내용 확인'}
        </Button>
      </div>
    </form>
  );
}
