**Kinetic Editorial — 정지 상태에서는 학술지처럼, 움직이기 시작하면 실험실처럼.**
교육공학·학습과학 대학원 연구실 웹사이트를 위한 디자인 시스템입니다. 화이트 지면 위의 엄격한 12컬럼 그리드, 대형 영문 타이포그래피와 국문 설명의 이중 위계, 페이지당 두 번만 등장하는 Deep Navy, 그리고 모든 움직임에 원인(진입·스크롤·포인터·상태)이 있는 모션 체계로 구성됩니다.

> 연구실 공식 명칭·로고·인물·논문·연혁은 아직 확정되지 않았습니다. "Learning Lab"은 시스템의 작업명이며, 모든 샘플 데이터(`Lab.sample`)는 `[대괄호]` 표기 placeholder입니다. 실제 정보처럼 보이는 문구를 만들지 마세요.

## 디자인 원칙

1. **Structure first — 그리드가 보인다.** 콘텐츠는 12컬럼(태블릿 8, 모바일 4) 위에 정렬하고, 인덱스 번호 `(01)`과 hairline(`border-hairline`)으로 구조를 드러냅니다. 카드 상자로 감싸지 않습니다.
2. **Type carries the image.** 영문 제목(`display-*`, `h1`–`h6`, Inter)이 시각적 주인공이고, 국문(`title-ko*`, `lead`, Pretendard)이 의미를 설명합니다. 한 화면에 Display 스타일은 하나만 둡니다.
3. **Navy is a stage, not wallpaper.** `bg-brand`는 Full-bleed 섹션·Footer·전환 커튼에만, 페이지당 최대 2회 사용합니다. 기본 지면은 언제나 `bg-page`(White)입니다.
4. **Square holds content, round invites action.** 이미지·카드·모달·섹션은 `radius-0`. 버튼·칩·태그는 `radius-pill`, 아이콘 버튼은 `radius-circle`. 모양만 보고도 누를 수 있는지 알 수 있어야 합니다.
5. **Motion with a reason.** 모든 모션은 진입, 스크롤, 포인터, 상태 변화 중 하나에 반응하며, 같은 효과를 모든 요소에 반복하지 않습니다. 패턴과 용도는 1:1로 고정합니다(아래 표).
6. **Calm at rest.** 정지 화면에는 그림자·그라디언트·장식 아이콘이 없습니다. 깊이감은 움직임(시차, 마스크, 틸트)으로만 만듭니다.
7. **Accessible by default.** `prefers-reduced-motion`이면 모든 진입 애니메이션이 사라지고 콘텐츠는 처음부터 보입니다. Hover 전용 정보는 없으며, 터치에서는 같은 정보가 항상 노출됩니다.

## 색 사용 규칙

- 본문·제목은 `text-primary` on `bg-page`/`bg-subtle`. 리드·보조 문단은 `text-secondary`, 날짜·DOI·캡션은 `text-tertiary`.
- `text-decorative`(원본 Blue Gray #667D9D)는 **24px 이상** 숫자·인덱스·ScrollText 미점등 단어 전용입니다. 흰 배경 4.21:1이므로 본문 크기에 쓰지 않습니다.
- 네이비 위에서는 `text-on-brand` → `text-on-brand-muted` → `text-on-brand-subtle` 순으로 위계를 낮추고, 선은 `border-on-brand`, 포커스는 `focus-ring-on-brand`를 씁니다.
- 컨트롤 테두리는 `border-control`(3:1 이상). `border-hairline`(Silver Blue)은 의미 없는 구분선에만 씁니다.
- 오류는 `danger` + 경고 아이콘 + 문장, 세 가지를 함께. 팔레트 밖 색은 `danger` 하나뿐입니다.
- 키보드 포커스는 `focus-ring` 2px solid, offset 3px. 모든 지면에서 3:1 이상입니다.
- 컴포넌트는 Primitive(`navy-900`)를 직접 참조하지 않고 Semantic(`bg-brand`) 또는 Component(`btn-primary-bg`) 토큰을 씁니다.

## 타이포그래피 규칙

- 영문 제목은 Inter(`--font-display`), 국문과 본문은 Pretendard Variable(`--font-sans`). 세리프는 쓰지 않습니다.
- 영문 Display는 2–3줄로 **수동 줄바꿈**(`SplitText lines`)하고, 국문 제목은 `word-break: keep-all`로 어절 단위로 끊습니다.
- 섹션 머리는 `SectionHeader`: `(index)` + 영문 `label` + 영문 `h1` + 국문 `title-ko` 순서를 지킵니다.
- 크기는 `bundle.css`의 유동 스케일(`.lab-t-*`, `clamp(min, vw, max)`)로 적용합니다. tokens.json의 값은 데스크톱 최대값입니다.

## 레이아웃 규칙

- 컨테이너 `container-max` 1600px, 페이지 여백 48/32/20px, gutter 24/20/16px. Shift+G로 그리드 오버레이를 켭니다.
- 섹션 사이 구분은 선이 아니라 배경(`bg-subtle`·`bg-brand`), 여백(`clamp(96px, 11vw, 176px)`), 타입 크기 변화로 만듭니다. 섹션을 여는 hairline은 `SectionHeader` 하나만 그립니다.
- 같은 레이아웃을 연속 두 섹션에 반복하지 않습니다: Hero(비대칭) → Vision(에디토리얼) → Research(Full-bleed 리스트) → Projects(교차 비대칭) → People(그리드) → Publications(리스트) → News(대·소 혼합).

## 모션 패턴 ↔ 용도 (고정)

| 패턴 | 쓰는 곳 | 쓰지 않는 곳 |
| --- | --- | --- |
| Text mask reveal (`lines`) | 페이지·섹션 제목 | 본문 문단 |
| Image mask (`clip` / `expand`) | MediaFrame 최초 진입 | 썸네일 hover |
| Lattice lens | Home Hero 배경 1곳 | 그 외 모든 곳 |
| Magnetic + wipe | 뷰당 CTA 1개, 캐러셀 화살표 | 폼 내부 보조 버튼 |
| Text roll | 내비게이션·푸터 링크 | 본문 링크 |
| Underline redraw | 본문·독립 링크, 카드 제목 | 버튼 |
| Direction-aware panel | People 인물 카드 | 리스트 행 |
| Tilt (≤4°) | Project showcase | 인물·뉴스 |
| Cursor-follow image + spotlight | Home Research index | 일반 리스트 |
| Animated border | ResearchCard | 입력 필드 |
| Focus line + rolling year | Publications | 다른 리스트 |
| Sticky story | Research explorer | 모바일·reduced |
| Curtain | 페이지 전환 | 모달 |

## 이미지·아이콘

- 사진이 없을 때는 `MediaFrame`의 placeholder(사선 해치 + "IMAGE" + 용도 라벨 + 비율)를 그대로 둡니다. 임의 스톡 사진이나 생성 이미지를 실제 연구실 사진처럼 쓰지 않습니다.
- 인물 사진은 `tone="gray"`, 연구·행사 사진은 `tone="navy"` placeholder를 씁니다. 실제 사진은 4:5(인물), 16:10·3:2(활동), 21:9(About 전경)로 크롭합니다.
- 아이콘은 `Lab.Icon` 하나(24 grid, 1.5px stroke, square cap). 의미 없는 장식 아이콘은 넣지 않습니다. 로고는 아직 없으므로 `Brand`는 텍스트로만 표기합니다.

## 문서 구성

이 시스템의 결과물과 설계 근거는 다음 섹션에 있습니다: Design Direction · Foundations · Design Tokens · Motion System · Interaction Specifications · Component Library · Implementation Guide · Decision Log. 쇼케이스는 컴포넌트 목록의 **Showcase** 그룹(MotionShowcase, HomePrototype, HomePrototypeMobile)에서 직접 조작할 수 있습니다.
