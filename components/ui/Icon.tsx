import { cx } from '@/lib/motion/core';

/* 24px grid, 1.5px stroke, square caps — 디자인 시스템 전용 아이콘 세트 */
export const ICONS = {
  'arrow-right': 'M4 12h15M13 6l6 6-6 6',
  'arrow-left': 'M20 12H5M11 6l-6 6 6 6',
  'arrow-up': 'M12 20V5M6 11l6-6 6 6',
  'arrow-down': 'M12 4v15M6 13l6 6 6-6',
  'arrow-up-right': 'M7 17L17 7M8 7h9v9',
  plus: 'M12 4v16M4 12h16',
  minus: 'M4 12h16',
  close: 'M5.5 5.5l13 13M18.5 5.5l-13 13',
  menu: 'M3 8h18M3 16h18',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20',
  'chevron-down': 'M6 9l6 6 6-6',
  check: 'M4.5 12.5l4.5 4.5 10.5-10.5',
  alert: 'M12 3l9.5 17h-19zM12 10v4.5M12 17.2v.3',
  copy: 'M8 8h11v11H8zM5 16V5h11',
  doc: 'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7',
  mail: 'M3 6h18v12H3zM3 6l9 7 9-7',
  pin: 'M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  filter: 'M4 6h16M7 12h10M10 18h4',
  play: 'M8 5l11 7-11 7z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
} as const;
export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
  /** 있으면 role="img" + aria-label, 없으면 장식(aria-hidden) */
  label?: string;
}

export function Icon({ name, size = 20, stroke = 1.5, className, label }: IconProps) {
  return (
    <svg
      className={cx('lab-icon', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden={label ? undefined : 'true'}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
    >
      <path d={ICONS[name] || ICONS['arrow-right']} />
    </svg>
  );
}
