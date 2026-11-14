'use client';
/**
 * Controls: Tabs, FilterChips, Accordion, SearchField, TextField, Checkbox — 디자인 시스템 50-controls 포팅
 */
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cx, dur, motion } from '@/lib/motion/core';
import { useIso } from '@/lib/motion/hooks';
import { Icon } from './Icon';

/* ---------------------------------------------------------------- Tabs */
export interface Tab {
  value: string;
  label: ReactNode;
  count?: number;
  content?: ReactNode;
  disabled?: boolean;
}
export function Tabs(p: { tabs: Tab[]; value?: string; defaultValue?: string; onChange?: (v: string) => void; label?: string; renderPanel?: boolean; className?: string }) {
  const tabs = p.tabs;
  const listRef = useRef<HTMLDivElement>(null);
  const ind = useRef<HTMLSpanElement>(null);
  const base = useId();
  const [inner, setInner] = useState(p.defaultValue || tabs[0]?.value);
  const val = p.value ?? inner;
  const set = (v: string) => {
    p.onChange?.(v);
    setInner(v);
  };
  const place = useCallback((instant?: boolean) => {
    const l = listRef.current;
    const el = l?.querySelector<HTMLElement>('[aria-selected="true"]');
    const b = ind.current;
    if (!el || !b) return;
    b.style.transition = instant || motion.reduced() ? 'none' : '';
    b.style.width = `${el.offsetWidth}px`;
    b.style.transform = `translate3d(${el.offsetLeft}px,0,0)`;
  }, []);
  const first = useRef(true);
  useIso(() => {
    place(first.current);
    first.current = false;
  }, [val, place]);
  useEffect(() => {
    const r = () => place(true);
    window.addEventListener('resize', r);
    document.fonts?.ready.then(r);
    return () => window.removeEventListener('resize', r);
  }, [place]);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!first.current && panel.current) motion.animate(panel.current, [{ opacity: 0, transform: 'translate3d(0,16px,0)' }, { opacity: 1, transform: 'none' }], { duration: 'dur-slow', easing: 'ease-out' });
  }, [val]);
  const key = (e: KeyboardEvent, i: number) => {
    const n = tabs.length;
    let j: number | null = null;
    if (e.key === 'ArrowRight') j = (i + 1) % n;
    else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = n - 1;
    if (j == null) return;
    e.preventDefault();
    set(tabs[j].value);
    listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[j]?.focus();
  };
  const cur = tabs.find((t) => t.value === val);
  const curIdx = Math.max(0, tabs.findIndex((t) => t.value === val));
  return (
    <div className={cx('lab-tabs', p.className)}>
      <div className="lab-tabs__list" role="tablist" aria-label={p.label} ref={listRef}>
        {tabs.map((t, i) => {
          const on = t.value === val;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              id={`${base}-t-${i}`}
              aria-selected={on}
              aria-controls={`${base}-p`}
              tabIndex={on ? 0 : -1}
              disabled={t.disabled}
              className={cx('lab-tab', on && 'is-on')}
              onClick={() => set(t.value)}
              onKeyDown={(e) => key(e, i)}
            >
              <span className="lab-tab__label">{t.label}</span>
              {t.count != null ? <span className="lab-tab__count">{t.count}</span> : null}
            </button>
          );
        })}
        <span ref={ind} className="lab-tabs__ind" aria-hidden="true" />
      </div>
      {p.renderPanel !== false ? (
        <div ref={panel} id={`${base}-p`} role="tabpanel" aria-labelledby={`${base}-t-${curIdx}`} className="lab-tabs__panel" tabIndex={0}>
          {cur?.content}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------- FilterChips */
export interface ChipOption {
  value: string;
  label: ReactNode;
  count?: number;
  disabled?: boolean;
}
export function FilterChips(p: {
  options: ChipOption[];
  value: string[] | string;
  onToggle?: (v: string) => void;
  onClear?: () => void;
  multiple?: boolean;
  showAll?: boolean;
  allLabel?: ReactNode;
  label?: string;
  className?: string;
}) {
  const multiple = p.multiple !== false;
  const val = p.value;
  const isOn = (v: string) => (Array.isArray(val) ? val.includes(v) : val === v);
  const none = Array.isArray(val) ? val.length === 0 : !val;
  return (
    <div className={cx('lab-chips', p.className)} role="group" aria-label={p.label}>
      {p.showAll !== false && multiple ? (
        <button type="button" className={cx('lab-chip', none && 'is-on')} aria-pressed={none} onClick={p.onClear}>
          <span className="lab-chip__bg" aria-hidden="true" />
          <span className="lab-chip__check" aria-hidden="true">
            <Icon name="check" size={14} stroke={2} />
          </span>
          <span className="lab-chip__label">{p.allLabel || 'All'}</span>
        </button>
      ) : null}
      {p.options.map((o) => {
        const on = isOn(o.value);
        return (
          <button key={o.value} type="button" className={cx('lab-chip', on && 'is-on')} aria-pressed={on} disabled={o.disabled || o.count === 0} onClick={() => p.onToggle?.(o.value)}>
            <span className="lab-chip__bg" aria-hidden="true" />
            <span className="lab-chip__check" aria-hidden="true">
              <Icon name="check" size={14} stroke={2} />
            </span>
            <span className="lab-chip__label">{o.label}</span>
            {o.count != null ? <span className="lab-chip__count">{o.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------ Accordion */
export function Accordion(p: { items: { title: ReactNode; content: ReactNode }[]; multiple?: boolean; defaultOpen?: number; onBrand?: boolean; className?: string }) {
  const base = useId();
  const [open, setOpen] = useState<number[]>(p.defaultOpen != null ? [p.defaultOpen] : []);
  const tog = (i: number) => {
    const on = open.includes(i);
    setOpen(on ? open.filter((x) => x !== i) : p.multiple ? [...open, i] : [i]);
  };
  return (
    <div className={cx('lab-acc', p.onBrand && 'lab-acc--on-brand', p.className)}>
      {p.items.map((it, i) => {
        const on = open.includes(i);
        return (
          <div key={i} className={cx('lab-acc__item', on && 'is-open')}>
            <h3 className="lab-acc__h">
              <button type="button" className="lab-acc__btn" aria-expanded={on} aria-controls={`${base}-${i}`} id={`${base}-b${i}`} onClick={() => tog(i)}>
                <span className="lab-acc__title lab-t-h5">{it.title}</span>
                <span className="lab-plus" aria-hidden="true" />
              </button>
            </h3>
            <div id={`${base}-${i}`} role="region" aria-labelledby={`${base}-b${i}`} className="lab-collapse" data-open={on ? 'true' : 'false'}>
              <div className="lab-collapse__in">
                <div className="lab-acc__body lab-t-body">{it.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------- SearchField */
export interface SearchResult {
  group: string;
  title: string;
}
export function highlight(text: string, q: string): ReactNode {
  const s = q.trim();
  if (!s) return text;
  const i = text.toLowerCase().indexOf(s.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="lab-mark">{text.slice(i, i + s.length)}</mark>
      {text.slice(i + s.length)}
    </>
  );
}
export function SearchField<R extends SearchResult = SearchResult>(p: {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  results?: (q: string) => R[];
  onSelect?: (r: R) => void;
  compact?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  const [inner, setInner] = useState(p.defaultValue || '');
  const val = p.value ?? inner;
  const [focus, setFocus] = useState(false);
  const [act, setAct] = useState(-1);
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const results = p.results ? p.results(val) : null;
  const show = !!results && focus && val.trim().length > 0;
  const change = (v: string) => {
    setInner(v);
    setAct(-1);
    p.onChange?.(v);
  };
  const n = results?.length ?? 0;
  useEffect(() => {
    if (!show || !listRef.current) return;
    listRef.current.querySelectorAll('.lab-sres__row').forEach((r, i) => {
      motion.animate(r, [{ opacity: 0, transform: 'translate3d(0,8px,0)' }, { opacity: 1, transform: 'none' }], { duration: 'dur-base', easing: 'ease-out', delay: i * dur('stagger-tight') });
    });
  }, [show, n]);
  useEffect(() => {
    if (p.autoFocus) setTimeout(() => inputRef.current?.focus(), 60);
  }, [p.autoFocus]);
  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!show || !results) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAct((act + 1) % Math.max(1, n));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAct((act - 1 + n) % Math.max(1, n));
    } else if (e.key === 'Enter' && act >= 0 && results[act]) {
      e.preventDefault();
      p.onSelect?.(results[act]);
      setFocus(false);
    } else if (e.key === 'Escape') setFocus(false);
  };
  return (
    <div
      className={cx('lab-search', focus && 'is-focus', val && 'has-value', p.compact && 'lab-search--compact', p.className)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocus(false);
      }}
    >
      <label htmlFor={id} className="lab-sr-only">
        {p.label || '검색'}
      </label>
      <span className="lab-search__icon" aria-hidden="true">
        <Icon name="search" size={p.compact ? 18 : 24} />
      </span>
      <input
        ref={inputRef}
        id={id}
        type="search"
        className="lab-search__input"
        placeholder={p.placeholder || 'Search'}
        value={val}
        autoComplete="off"
        role={results ? 'combobox' : undefined}
        aria-expanded={results ? show : undefined}
        aria-controls={results ? `${id}-list` : undefined}
        aria-autocomplete={results ? 'list' : undefined}
        aria-activedescendant={show && act >= 0 ? `${id}-o${act}` : undefined}
        onChange={(e) => change(e.target.value)}
        onFocus={() => setFocus(true)}
        onKeyDown={key}
      />
      {val ? (
        <button
          type="button"
          className="lab-search__clear"
          aria-label="검색어 지우기"
          onClick={() => {
            change('');
            inputRef.current?.focus();
          }}
        >
          <Icon name="close" size={16} />
        </button>
      ) : null}
      <span className="lab-search__line" aria-hidden="true" />
      {results ? (
        <div className={cx('lab-sres', show && 'is-open')} hidden={!show}>
          <p className="lab-sres__count lab-t-index" aria-live="polite">
            {show ? (n ? `${n} results` : 'No results') : ''}
          </p>
          <ul ref={listRef} id={`${id}-list`} role="listbox" className="lab-sres__list" aria-label="검색 결과">
            {results.map((r, i) => (
              <li
                key={i}
                id={`${id}-o${i}`}
                role="option"
                aria-selected={act === i}
                className={cx('lab-sres__row', act === i && 'is-act')}
                onMouseDown={(e) => {
                  e.preventDefault();
                  p.onSelect?.(r);
                  setFocus(false);
                }}
                onMouseEnter={() => setAct(i)}
              >
                <span className="lab-tag">{r.group}</span>
                <span className="lab-sres__title">{highlight(r.title, val)}</span>
                <span className="lab-sres__arrow" aria-hidden="true">
                  <Icon name="arrow-right" size={16} />
                </span>
              </li>
            ))}
          </ul>
          {show && !n ? <p className="lab-sres__empty lab-t-body-s">다른 키워드로 검색해 보세요. 예: Learning Analytics, 교수설계</p> : null}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ TextField */
export interface TextFieldProps {
  label: string;
  name?: string;
  type?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  onBlur?: () => void;
  required?: boolean;
  hint?: string;
  error?: string;
  valid?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  autoComplete?: string;
  className?: string;
}
export function TextField(p: TextFieldProps) {
  const id = useId();
  const [inner, setInner] = useState(p.defaultValue || '');
  const val = p.value ?? inner;
  const wrap = useRef<HTMLDivElement>(null);
  const prevErr = useRef(p.error);
  useEffect(() => {
    if (p.error && p.error !== prevErr.current && wrap.current && !motion.reduced())
      wrap.current.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(0)' }],
        { duration: 320, easing: 'ease-out' },
      );
    prevErr.current = p.error;
  }, [p.error]);
  const desc = [p.hint ? `${id}-h` : null, p.error ? `${id}-e` : null].filter(Boolean).join(' ') || undefined;
  const common = {
    id,
    name: p.name,
    className: 'lab-field__input',
    value: val,
    placeholder: ' ',
    required: p.required,
    disabled: p.disabled,
    autoComplete: p.autoComplete,
    'aria-invalid': p.error ? ('true' as const) : undefined,
    'aria-describedby': desc,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInner(e.target.value);
      p.onChange?.(e.target.value);
    },
    onBlur: p.onBlur,
  };
  return (
    <div ref={wrap} className={cx('lab-field', val && 'has-value', p.error && 'has-error', p.disabled && 'is-disabled', p.valid && 'is-valid', p.multiline && 'lab-field--multi', p.className)}>
      <div className="lab-field__box">
        {p.multiline ? <textarea {...common} rows={p.rows || 4} /> : <input {...common} type={p.type || 'text'} />}
        <label htmlFor={id} className="lab-field__label">
          {p.label}
          {p.required ? (
            <span className="lab-field__req" aria-hidden="true">
              {' *'}
            </span>
          ) : null}
          {p.required ? <span className="lab-sr-only"> (필수)</span> : null}
        </label>
        <span className="lab-field__line" aria-hidden="true" />
        {p.valid ? (
          <span className="lab-field__ok" aria-hidden="true">
            <Icon name="check" size={16} stroke={2} />
          </span>
        ) : null}
      </div>
      {p.hint && !p.error ? (
        <p id={`${id}-h`} className="lab-field__hint">
          {p.hint}
        </p>
      ) : null}
      {p.error ? (
        <p id={`${id}-e`} className="lab-field__error" role="alert">
          <Icon name="alert" size={14} stroke={1.75} />
          {p.error}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------- Checkbox */
export function Checkbox(p: { label: ReactNode; checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean; error?: string; className?: string }) {
  const id = useId();
  return (
    <div className={cx('lab-check', p.error && 'has-error', p.className)}>
      <input
        id={id}
        type="checkbox"
        className="lab-check__input"
        checked={!!p.checked}
        onChange={(e) => p.onChange?.(e.target.checked)}
        disabled={p.disabled}
        aria-invalid={p.error ? 'true' : undefined}
        aria-describedby={p.error ? `${id}-e` : undefined}
      />
      <label htmlFor={id} className="lab-check__label">
        <span className="lab-check__box" aria-hidden="true">
          <svg viewBox="0 0 16 16">
            <path d="M3 8.5l3.2 3L13 4.5" />
          </svg>
        </span>
        <span className="lab-t-body-s">{p.label}</span>
      </label>
      {p.error ? (
        <p id={`${id}-e`} className="lab-field__error" role="alert">
          <Icon name="alert" size={14} stroke={1.75} />
          {p.error}
        </p>
      ) : null}
    </div>
  );
}
