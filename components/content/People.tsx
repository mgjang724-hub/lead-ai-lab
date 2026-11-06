'use client';
/**
 * MemberProfile — 초상 + 캡션. fine pointer: 브랜드 패널이 포인터가 들어온 모서리에서 미끄러져 들어와 연구 관심사를 보임.
 * 터치: 관심사가 이름 아래 텍스트로. 클릭 → member.href 또는 /people/[slug] (지도교수 카드는 /about#professor)
 * isSample 구성원(연구실이 제공한 가상 인물)은 이름 옆에 "예시" 배지를 붙입니다.
 */
import { useRef } from 'react';
import { cx } from '@/lib/motion/core';
import { useDirectionalHover, useReveal } from '@/lib/motion/hooks';
import type { Member } from '@/content/types';
import { memberRoleLabels } from '@/lib/content';
import { Icon } from '@/components/ui/Icon';
import { MediaFrame } from '@/components/motion/MediaFrame';
import { TransitionLink } from '@/components/nav/TransitionLink';

export function MemberProfile({ member, className }: { member: Member; className?: string }) {
  const host = useRef<HTMLAnchorElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useDirectionalHover(host, panel);
  const role = member.roleLabel || memberRoleLabels[member.role];
  return (
    <article className={cx('lab-member', className)}>
      <TransitionLink ref={host} href={member.href ?? `/people/${member.slug}`} className="lab-member__hit" label={member.href ? undefined : 'People'}>
        <div className="lab-member__media">
          <MediaFrame ratio="4/5" tone="gray" label="Portrait" src={member.photo} alt={member.photo ? member.name + (member.isSample ? ' (예시 인물)' : '') : ''} reveal="none" />
          <div ref={panel} className="lab-member__panel" aria-hidden="true">
            <span className="lab-t-label">Research interests</span>
            <ul role="list">
              {member.interests.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <span className="lab-member__more">
              View profile
              <Icon name="arrow-right" size={16} />
            </span>
          </div>
        </div>
        <span className="lab-member__cap">
          <span className="lab-member__name lab-t-h5">
            {member.name}
            {member.isSample ? <span className="lab-badge lab-badge--sample lab-member__badge">예시</span> : null}
          </span>
          <span className="lab-member__role lab-t-body-s">{role}</span>
          <span className="lab-member__touch lab-t-caption">{member.interests.join(' · ')}</span>
        </span>
      </TransitionLink>
    </article>
  );
}

export function MemberGrid({ members, cols, className }: { members: Member[]; cols?: 3 | 4; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, { variant: 'stagger' });
  return (
    <div ref={ref} className={cx('lab-members', cols && `lab-members--${cols}`, className)} data-reveal="">
      {members.map((m) => (
        <MemberProfile key={m.slug} member={m} />
      ))}
    </div>
  );
}
