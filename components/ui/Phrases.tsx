import { Fragment } from 'react';

/**
 * Phrases — 한글 제목 문구를 쉼표 단위 구절로 묶어, 줄이 바뀔 때 구절 사이에서 먼저 끊기게 합니다.
 * 예: "AI로 학습을 이해하고, 더 나은 학습경험을 설계합니다." → "…이해하고," / "더 나은 학습경험을 설계합니다."
 * ('더'만 윗줄 끝에 남는 식의 줄바꿈을 막습니다.) 구절 하나가 줄보다 길면 그 안에서는 평소처럼 줄이 바뀝니다.
 */
export function Phrases({ text }: { text: string }) {
  const parts = text.split(', ');
  if (parts.length < 2) return <>{text}</>;
  return (
    <>
      {parts.map((s, i) => (
        <Fragment key={i}>
          {i ? ' ' : null}
          <span className="lab-phrase">{i < parts.length - 1 ? `${s},` : s}</span>
        </Fragment>
      ))}
    </>
  );
}
