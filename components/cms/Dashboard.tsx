'use client';
import { collectionGroups, collectionItems } from '@/lib/cms/collections';
import { useCms } from './context';
import { Btn } from './ui';

export function Dashboard() {
  const { user, snapshot, navigate } = useCms();
  return (
    <div className="cms-page">
      <header className="cms-page__head">
        <h1 className="cms-h1">{user.name}님, 안녕하세요</h1>
        <p className="cms-lead">고칠 항목을 고르세요. 게시하기 전에 바뀌는 칸을 한 번 더 보여 드리고, 게시하면 1~2분 뒤 공개 사이트에 반영됩니다.</p>
      </header>

      {collectionGroups.map((g) => (
        <section key={g.title} className="cms-section" aria-label={g.title}>
          <h2 className="cms-grouptitle">{g.title}</h2>
          <ul className="cms-cards" role="list">
            {g.items.map((c) => {
              const n = snapshot ? collectionItems(snapshot.files[c.file], c).length : 0;
              return (
                <li key={c.id} className="cms-card">
                  <div className="cms-card__head">
                    <h3 className="cms-h2">{c.label}</h3>
                    <span className="cms-card__count">{n}개</span>
                  </div>
                  <p className="cms-help">{c.description}</p>
                  <div className="cms-row">
                    <Btn variant="secondary" onClick={() => navigate(c.id)}>
                      목록 보기
                    </Btn>
                    <Btn variant="ghost" onClick={() => navigate(`${c.id}/new`)}>
                      + {c.itemLabel} 추가
                    </Btn>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className="cms-panel cms-guide" aria-labelledby="cms-guide-title">
        <h2 id="cms-guide-title" className="cms-h2">
          올리기 전에 꼭 확인하세요
        </h2>
        <ul>
          <li>
            이 사이트의 저장소는 <strong>공개</strong>입니다. 올린 글과 사진은 사이트에 보이지 않는 부분까지 누구나 볼 수 있습니다.
          </li>
          <li>
            지운 글·사진도 <strong>변경 기록에는 남습니다</strong>. 본인이 게시에 동의한 사진과 정보만 올려 주세요.
          </li>
          <li>연락처·학번·원본 자료·내부 메모처럼 공개하면 안 되는 내용은 올리지 않습니다.</li>
          <li>논문·저역서·학술발표는 원문 표기 그대로 적고, 확인되지 않은 DOI·저자는 채우지 않습니다.</li>
          <li>모든 게시는 누가 언제 했는지 기록으로 남고, 이전 상태로 되돌릴 수 있습니다. 실수했다면 다시 고쳐 게시하면 됩니다.</li>
        </ul>
      </section>
    </div>
  );
}
