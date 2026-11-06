# Learning Lab Design System

> 교육공학·학습과학 대학원 연구실 홈페이지 디자인 시스템 v1 · 작업명 "Learning Lab" (공식 명칭 미정)

## 파일 구성

| 파일 | 용도 | 여는 방법 |
| --- | --- | --- |
| `lab-template.html` | 7개 페이지(Home·About·Research·People·Publications·News·Contact) 사이트 템플릿. 페이지 전환·공유 요소 전환 포함. `#research`처럼 해시로 시작 페이지 지정 | 브라우저에서 바로 열기 |
| `lab-motion-library.html` | 모션 토큰과 패턴 카탈로그. 패턴마다 Trigger·Tokens·Used in·Reduced 명세 | 브라우저 |
| `lab-component-library.html` | 33개 컴포넌트 라이브 데모 + 사용 규칙 | 브라우저 |
| `lab-theme.css` | 디자인 토큰(Primitive/Semantic/Component, Light/Dark) + 컴포넌트 스타일 | 프로젝트에 import |
| `lab-design-system.md` | 이 문서 — 방향, 기반, 토큰, 모션, 인터랙션 명세, 컴포넌트, 구현 가이드, 결정 기록 | — |
| `design-qa-report.md` | 품질 점검 결과와 잔여 이슈 | — |

세 HTML은 단일 파일입니다(React 18.3.1, 컴포넌트·모션 엔진, 폰트 subset 내장). 인터넷 연결 없이도 동작하며, 연결되어 있으면 Pretendard 전체 글리프를 CDN에서 보충합니다. 왼쪽 아래 막대(모션·컴포넌트 라이브러리)로 다크 테마와 reduced motion을 전환할 수 있습니다.

## 개요

**Kinetic Editorial — 정지 상태에서는 학술지처럼, 움직이기 시작하면 실험실처럼.**
교육공학·학습과학 대학원 연구실 웹사이트를 위한 디자인 시스템입니다. 화이트 지면 위의 엄격한 12컬럼 그리드, 대형 영문 타이포그래피와 국문 설명의 이중 위계, 페이지당 두 번만 등장하는 Deep Navy, 그리고 모든 움직임에 원인(진입·스크롤·포인터·상태)이 있는 모션 체계로 구성됩니다.

> 연구실 공식 명칭·로고·인물·논문·연혁은 아직 확정되지 않았습니다. "Learning Lab"은 시스템의 작업명이며, 모든 샘플 데이터(`Lab.sample`)는 `[대괄호]` 표기 placeholder입니다. 실제 정보처럼 보이는 문구를 만들지 마세요.

### 디자인 원칙

1. **Structure first — 그리드가 보인다.** 콘텐츠는 12컬럼(태블릿 8, 모바일 4) 위에 정렬하고, 인덱스 번호 `(01)`과 hairline(`border-hairline`)으로 구조를 드러냅니다. 카드 상자로 감싸지 않습니다.
2. **Type carries the image.** 영문 제목(`display-*`, `h1`–`h6`, Inter)이 시각적 주인공이고, 국문(`title-ko*`, `lead`, Pretendard)이 의미를 설명합니다. 한 화면에 Display 스타일은 하나만 둡니다.
3. **Navy is a stage, not wallpaper.** `bg-brand`는 Full-bleed 섹션·Footer·전환 커튼에만, 페이지당 최대 2회 사용합니다. 기본 지면은 언제나 `bg-page`(White)입니다.
4. **Square holds content, round invites action.** 이미지·카드·모달·섹션은 `radius-0`. 버튼·칩·태그는 `radius-pill`, 아이콘 버튼은 `radius-circle`. 모양만 보고도 누를 수 있는지 알 수 있어야 합니다.
5. **Motion with a reason.** 모든 모션은 진입, 스크롤, 포인터, 상태 변화 중 하나에 반응하며, 같은 효과를 모든 요소에 반복하지 않습니다. 패턴과 용도는 1:1로 고정합니다(아래 표).
6. **Calm at rest.** 정지 화면에는 그림자·그라디언트·장식 아이콘이 없습니다. 깊이감은 움직임(시차, 마스크, 틸트)으로만 만듭니다.
7. **Accessible by default.** `prefers-reduced-motion`이면 모든 진입 애니메이션이 사라지고 콘텐츠는 처음부터 보입니다. Hover 전용 정보는 없으며, 터치에서는 같은 정보가 항상 노출됩니다.

### 색 사용 규칙

- 본문·제목은 `text-primary` on `bg-page`/`bg-subtle`. 리드·보조 문단은 `text-secondary`, 날짜·DOI·캡션은 `text-tertiary`.
- `text-decorative`(원본 Blue Gray #667D9D)는 **24px 이상** 숫자·인덱스·ScrollText 미점등 단어 전용입니다. 흰 배경 4.21:1이므로 본문 크기에 쓰지 않습니다.
- 네이비 위에서는 `text-on-brand` → `text-on-brand-muted` → `text-on-brand-subtle` 순으로 위계를 낮추고, 선은 `border-on-brand`, 포커스는 `focus-ring-on-brand`를 씁니다.
- 컨트롤 테두리는 `border-control`(3:1 이상). `border-hairline`(Silver Blue)은 의미 없는 구분선에만 씁니다.
- 오류는 `danger` + 경고 아이콘 + 문장, 세 가지를 함께. 팔레트 밖 색은 `danger` 하나뿐입니다.
- 키보드 포커스는 `focus-ring` 2px solid, offset 3px. 모든 지면에서 3:1 이상입니다.
- 컴포넌트는 Primitive(`navy-900`)를 직접 참조하지 않고 Semantic(`bg-brand`) 또는 Component(`btn-primary-bg`) 토큰을 씁니다.

### 타이포그래피 규칙

- 영문 제목은 Inter(`--font-display`), 국문과 본문은 Pretendard Variable(`--font-sans`). 세리프는 쓰지 않습니다.
- 영문 Display는 2–3줄로 **수동 줄바꿈**(`SplitText lines`)하고, 국문 제목은 `word-break: keep-all`로 어절 단위로 끊습니다.
- 섹션 머리는 `SectionHeader`: `(index)` + 영문 `label` + 영문 `h1` + 국문 `title-ko` 순서를 지킵니다.
- 크기는 `bundle.css`의 유동 스케일(`.lab-t-*`, `clamp(min, vw, max)`)로 적용합니다. tokens.json의 값은 데스크톱 최대값입니다.

### 레이아웃 규칙

- 컨테이너 `container-max` 1600px, 페이지 여백 48/32/20px, gutter 24/20/16px. Shift+G로 그리드 오버레이를 켭니다.
- 섹션 사이 구분은 선이 아니라 배경(`bg-subtle`·`bg-brand`), 여백(`clamp(96px, 11vw, 176px)`), 타입 크기 변화로 만듭니다. 섹션을 여는 hairline은 `SectionHeader` 하나만 그립니다.
- 같은 레이아웃을 연속 두 섹션에 반복하지 않습니다: Hero(비대칭) → Vision(에디토리얼) → Research(Full-bleed 리스트) → Projects(교차 비대칭) → People(그리드) → Publications(리스트) → News(대·소 혼합).

### 모션 패턴 ↔ 용도 (고정)

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

### 이미지·아이콘

- 사진이 없을 때는 `MediaFrame`의 placeholder(사선 해치 + "IMAGE" + 용도 라벨 + 비율)를 그대로 둡니다. 임의 스톡 사진이나 생성 이미지를 실제 연구실 사진처럼 쓰지 않습니다.
- 인물 사진은 `tone="gray"`, 연구·행사 사진은 `tone="navy"` placeholder를 씁니다. 실제 사진은 4:5(인물), 16:10·3:2(활동), 21:9(About 전경)로 크롭합니다.
- 아이콘은 `Lab.Icon` 하나(24 grid, 1.5px stroke, square cap). 의미 없는 장식 아이콘은 넣지 않습니다. 로고는 아직 없으므로 `Brand`는 텍스트로만 표기합니다.

### 문서 구성

이 시스템의 결과물과 설계 근거는 다음 섹션에 있습니다: Design Direction · Foundations · Design Tokens · Motion System · Interaction Specifications · Component Library · Implementation Guide · Decision Log. 쇼케이스는 컴포넌트 목록의 **Showcase** 그룹(MotionShowcase, HomePrototype, HomePrototypeMobile)에서 직접 조작할 수 있습니다.

## 1. Design Direction

### 결론

컨셉은 **Kinetic Editorial**입니다. 정지 화면은 학술 저널의 지면처럼 절제하고(화이트, 그리드, 대형 타이포), 사용자가 스크롤하고 포인터를 움직이는 순간에만 깊이와 리듬이 생깁니다. "학습은 탐색 속에서 구조가 형성되는 과정"이라는 교육공학·학습과학의 관점을 시각 언어로 옮긴 것입니다 — 구조(그리드·인덱스·hairline)는 늘 보이고, 움직임은 그 구조를 드러내거나 재배열할 때만 일어납니다.

### 레퍼런스에서 추출한 원칙

레퍼런스 이미지는 대화에 첨부되지 않아 브리프에 서술된 특징을 기준으로 정리했습니다. 이미지를 받으면 이 섹션을 갱신합니다.

| 레퍼런스 특징 | 추출한 원칙 | 시스템에서의 구현 |
| --- | --- | --- |
| 네이비–화이트 대비 | 대비는 "장면 전환"에 쓴다 | `bg-brand` Full-bleed 섹션이 컨테이너 폭에서 화면 전체로 열리며 등장 (`FullBleed`) |
| 명확한 섹션 구성 | 섹션마다 동일한 머리 구조 | `SectionHeader`: (index) · label · 영문 h1 · 국문 설명 |
| 이미지+텍스트 비대칭 | 이미지와 텍스트가 같은 컬럼을 공유하지 않는다 | Hero 1–9 / 10–12, Project A 1–7 / 9–12, Project B 7–11 / 2–5 |
| 전체 화면 대형 비주얼 | 큰 이미지는 "열리면서" 등장 | `MediaFrame reveal="expand"`(슬릿에서 확장), `clip`(하단에서 상승), About 21:9 parallax |
| 다양한 그리드 | 리스트·그리드·에디토리얼을 섞는다 | Research는 리스트, People은 4열 그리드, News는 대·소 혼합 |
| 넉넉한 여백·정보 위계 | 섹션 여백 96–176px, 한 화면 Display 1개 | `--lab-sec-y`, type scale |
| 대형 타이포그래피 | 제목이 이미지 역할 | `display-xl` 176px, 마스크 리빌 |
| 이미지–텍스트 교차 | 교차 리듬 | `ProjectShowcase` 좌우 교차 |
| 스크롤 흐름 | 스크롤이 콘텐츠를 "발견"하게 한다 | ScrollText, ResearchExplorer, Publications focus line, Timeline |

### 시각 컨셉의 세 장치

1. **Lattice (점 격자)** — Home Hero 배경. 그리드 간격의 점들이 포인터 주위에서 렌즈처럼 휘어지고(학습자의 탐색), 커서가 없으면 가상의 렌즈가 천천히 떠돕니다. 장식이 아니라 "구조 위의 탐색"이라는 컨셉의 상징이며, 사이트 전체에서 이곳에만 씁니다.
2. **Mask (마스크)** — 텍스트는 줄 단위로 마스크에서 올라오고, 이미지는 가장자리나 슬릿에서 열립니다. "가려진 지식이 드러나는" 은유이며, 모든 Fade-in을 대체합니다.
3. **Index (인덱스)** — `(01)`, `01 / 04`, 연도 롤링 숫자. 학술 문서의 번호 체계를 내비게이션과 진행 표시로 확장합니다.

### 피하는 것과 그 대신

| 피하는 것 | 대신 |
| --- | --- |
| 모든 요소를 둥근 카드에 담기 | radius 0, hairline 구분, 리스트·에디토리얼 레이아웃 |
| 반복 Bento grid | 섹션마다 다른 레이아웃 원형 |
| 파스텔 배경 반복 | White 기본 + `bg-subtle` 1회 + `bg-brand` ≤2회 |
| Glassmorphism·불필요한 그림자 | Sticky header 스크롤 상태의 blur 1곳, `shadow-float`은 떠 있는 레이어만 |
| 보라·핑크 그라디언트 | 팔레트 6색 + 확장 명도 단계만 |
| 모든 섹션 같은 Fade-in | 패턴–용도 고정표(README) |
| 의미 없는 아이콘 | 기능 아이콘 19종만 |
| 기능 없는 인터랙션 | 각 인터랙션이 정보(분야 미리보기, 관심사, 현재 연도, 진행률)를 전달 |

### 톤 & 카피

- 영문은 짧은 선언형("Designing how learning happens.", "Four questions we keep asking."), 국문은 설명형("배움이 일어나는 과정을 연구하고 설계합니다.").
- 영문 라벨은 대문자 + 자간(`label`), 국문에는 대문자 스타일을 쓰지 않습니다.
- 감탄사·과장 수식어·이모지를 쓰지 않습니다. 실적 수치("논문 100편")는 확인된 데이터가 있을 때만 씁니다.

## 2. Foundations

### 컬러

원본 팔레트 6색(Ink Black, Deep Navy, Blue Gray, Silver Blue, Light Gray, White)을 기준으로 같은 색상 축에서 명도만 조정한 확장 단계를 정의했습니다. 확장 이유는 하나입니다 — 원본 Blue Gray(#667D9D)는 흰 배경에서 4.21:1, Light Gray 위에서 3.57:1이라 본문 텍스트 기준(4.5:1)을 넘지 못하기 때문입니다.

| 단계 | 값 | 역할 |
| --- | --- | --- |
| ink-950 · 900 · 800 | #060817 · #0B1029 · #111836 | 텍스트, 다크 테마 지면 |
| navy-900 · 800 · 700 · 600 | #16254F · #1F3263 · #2B4279 · #3D5690 | 브랜드, hover 면, 버튼 wipe |
| bluegray-700 · 600 · 500 · 400 | #4B5F7E · #56698A · #667D9D · #8397B3 | 보조·메타 텍스트, 아이콘, 컨트롤 테두리 |
| silver-400 · 300 · 200 · 100 | #97A8B6 · #ACBBC6 · #C8D3DB · #E2E8ED | hairline, 네이비 위 텍스트·포커스, 선택 면 |
| gray-200 · 100 · 50, white | #DADBDD · #ECECEC · #F6F6F6 · #FFFFFF | 지면 |
| red-700 · 200 | #B3261E · #F2A7A1 | 폼 오류 전용 (팔레트 외 유일한 예외) |

#### 컬러가 전달하는 것

- **시선 유도**: 페이지에서 가장 어두운 면(`bg-brand`, `bg-deep`)이 가장 중요한 전환 지점입니다(Research 미리보기, Footer CTA).
- **중요도**: `text-primary` → `secondary` → `tertiary` → `decorative` 4단계. 같은 화면에서 단계를 건너뛰지 않습니다.
- **상태**: 선택 = `chip-selected-bg`(채움 반전), 현재 위치 = `accent`/`nav-indicator`, 포커스 = `focus-ring`, 오류 = `danger`+아이콘. 색만으로 상태를 구분하지 않고 모양(체크, 막대, 아이콘)을 함께 바꿉니다.

#### 접근성 대비 검증 (WCAG 2.2 AA)

모든 쌍을 두 테마에서 계산했습니다. 텍스트 4.5:1, 24px 이상 텍스트·컨트롤 테두리·포커스 링·아이콘 3:1.

| 쌍 | Light | Dark | 기준 | 결과 |
| --- | --- | --- | --- | --- |
| `text-primary` on `bg-page` | 19.91:1 | 16.85:1 | 4.5:1 | ✓ |
| `text-primary` on `bg-subtle` | 16.85:1 | 15.87:1 | 4.5:1 | ✓ |
| `text-primary` on `bg-muted` | 18.42:1 | 14.72:1 | 4.5:1 | ✓ |
| `text-secondary` on `bg-page` | 6.49:1 | 10.12:1 | 4.5:1 | ✓ |
| `text-secondary` on `bg-subtle` | 5.49:1 | 9.53:1 | 4.5:1 | ✓ |
| `text-tertiary` on `bg-page` | 5.55:1 | 6.68:1 | 4.5:1 | ✓ |
| `text-tertiary` on `bg-subtle` | 4.70:1 | 6.29:1 | 4.5:1 | ✓ |
| `text-decorative` on `bg-page` (24px+) | 4.21:1 | 4.73:1 | 3:1 | ✓ |
| `text-on-brand` on `bg-brand` | 14.88:1 | 14.88:1 | 4.5:1 | ✓ |
| `text-on-brand-muted` on `bg-brand` | 7.56:1 | 7.56:1 | 4.5:1 | ✓ |
| `text-on-brand-subtle` on `bg-brand` | 4.99:1 | 4.99:1 | 4.5:1 | ✓ |
| `text-on-brand` on `bg-deep` | 19.91:1 | 18.74:1 | 4.5:1 | ✓ |
| `accent` on `bg-page` | 14.88:1 | 13.08:1 | 4.5:1 | ✓ |
| `border-control` on `bg-page` | 4.21:1 | 4.73:1 | 3:1 | ✓ |
| `border-control` on `bg-subtle` | 3.57:1 | 4.45:1 | 3:1 | ✓ |
| `focus-ring` on `bg-page` | 14.88:1 | 13.08:1 | 3:1 | ✓ |
| `focus-ring-on-brand` on `bg-brand` | 9.77:1 | 9.77:1 | 3:1 | ✓ |
| `icon` on `bg-page` | 4.21:1 | 6.68:1 | 3:1 | ✓ |
| `danger` on `bg-page` | 6.54:1 | 10.26:1 | 4.5:1 | ✓ |
| `btn-primary-fg` on `btn-primary-bg` | 14.88:1 | 16.85:1 | 4.5:1 | ✓ |
| `btn-primary-fg` on `btn-primary-wipe` (hover) | 9.73:1 | 19.91:1 | 4.5:1 | ✓ |
| `btn-secondary-fg-hover` on `btn-secondary-wipe` | 19.91:1 | 16.85:1 | 4.5:1 | ✓ |
| `chip-selected-fg` on `chip-selected-bg` | 19.91:1 | 16.85:1 | 4.5:1 | ✓ |
| `text-primary` on `bg-selected` | 16.12:1 | 10.49:1 | 4.5:1 | ✓ |
| `text-on-brand-muted` on `media-placeholder-a` | 7.56:1 | 7.56:1 | 4.5:1 | ✓ |

주의: `border-hairline`(Silver Blue, 흰 배경 1.97:1)은 의미를 전달하지 않는 구분선 전용입니다. 입력 필드·체크박스 경계에는 쓰지 않습니다.

### 타이포그래피

| 역할 | 서체 | 이유 |
| --- | --- | --- |
| 영문 제목·UI (`--font-display`) | Inter (variable, opsz 14–32) | 큰 크기에서 opsz가 Display 컷으로 자동 전환, 숫자 tabular 지원 |
| 국문·본문 (`--font-sans`) | Pretendard Variable | 라틴 글리프가 Inter 기반이라 혼용 시 이질감 없음, 45–920 가변 |

#### 타입 스케일 (유동, 데스크톱 최대 = tokens.json)

| 스타일 | 최소 → 최대 | line-height | tracking | 용도 |
| --- | --- | --- | --- | --- |
| display-xl | 52 → 176px (`9.6vw`) | .86 | -0.055em | Home Hero 1회 |
| display-l | 48 → 128px | .90 | -0.05em | 페이지 Hero, 전환 커튼 |
| display-m | 40 → 88px | .94 | -0.04em | Footer CTA, Publications 연도 |
| h1 | 36 → 64px | 1.02 | -0.035em | 섹션 제목 |
| h2 | 30 → 48px | 1.06 | -0.03em | 연구 분야, 마키 |
| h3 | 26 → 36px | 1.12 | -0.025em | 프로젝트, 상세 제목 |
| h4 | 22 → 28px | 1.2 | -0.02em | 모달 제목, 연락처 |
| h5 | 19 → 22px | 1.3 | -0.015em | 논문·뉴스 제목, 인물명 |
| h6 | 18px | 1.4 | -0.01em | 소그룹 |
| title-ko-l | 26 → 40px | 1.32 | -0.03em | 국문 비전 문장 |
| title-ko | 20 → 26px | 1.42 | -0.025em | 국문 제목 |
| lead | 17 → 20px | 1.7 | -0.015em | 리드, 최대 36em |
| body-l / body / body-s | 18 / 16 / 14px | 1.75 / 1.7 / 1.6 | — | 본문 |
| caption | 13px | 1.5 | — | 캡션·메타 |
| label | 12px | 1.2 | +0.12em, 대문자 | 영문 아이브로우 |
| index | 13px | 1.2 | tabular | (01), 연도 |
| nav / nav-l | 15px / 36 → 64px | 1 / 1.05 | — | 헤더 / 모바일 메뉴 |

규칙: 영문 위계와 국문 위계는 크기보다 **서체·굵기·자간**으로 구분합니다. 영문 제목 바로 아래 국문은 `title-ko`(600, Pretendard)로, 한 단계 작게 둡니다. 국문은 `keep-all`로 어절이 끊기지 않게 하고, 제목은 `text-wrap: balance`를 적용합니다.

### 그리드 & 간격

| | Mobile <768 | Tablet 768–1023 | Desktop ≥1024 |
| --- | --- | --- | --- |
| 컬럼 | 4 | 8 | 12 |
| Gutter | 16px | 20px | 24px (`grid-gutter`) |
| 페이지 여백 | 20px | 32px | 48px (`page-margin`) |
| Header 높이 | 64px | 64px | 72px (`header-h`) |
| 섹션 여백 | 96px | ≈112px | 최대 176px (`clamp(96px, 11vw, 176px)`) |

컨테이너 최대폭 `container-max` 1600px, 장문 본문 `container-text` 720px. 간격 토큰은 4px 기반 8px 리듬(`space-1` 4px … `space-12` 256px). 컴포넌트 내부는 `space-5` 이하, 블록 간은 `space-7`–`space-8`, 섹션 간은 `space-9` 이상.

### 반응형 규칙

- **≥1024px**: 글로벌 내비게이션, 포인터 인터랙션(magnetic, tilt, cursor-follow, direction-aware), Research sticky story, Publications focus line을 켭니다.
- **768–1023px**: 8컬럼, 모바일 메뉴 유지, 2열 그리드.
- **<768px**: 4컬럼, 한 줄 한 정보, Hero 이미지를 제목 아래로, Research index는 썸네일 인라인.
- 포인터 인터랙션은 화면 폭이 아니라 `(hover: hover) and (pointer: fine)`로 판단합니다. 터치 노트북·태블릿에서도 hover 의존 정보가 사라지지 않게 하기 위해서입니다.

### Radius · Border · Elevation

- Radius: `radius-0`(모든 콘텐츠 면) · `radius-xs` 2px(체크박스) · `radius-pill`(버튼·칩·태그) · `radius-circle`(아이콘 버튼·Back to Top).
- Border: `border-hair` 1px(구조선), `border-strong-w` 2px(활성 탭, 포커스, 입력 포커스선).
- Elevation: `shadow-none`(기본) · `shadow-float`(드롭다운, 검색 결과, Back to Top) · `shadow-overlay`(모달). 카드에는 그림자를 쓰지 않습니다.
- Z-index: `z-sticky` 20 · `z-header` 40 · `z-overlay` 60 · `z-modal` 70 · `z-transition` 90 · `z-cursor` 100.

## 3. Design Tokens

### 구조: Primitive → Semantic → Component

```
Primitive   navy-900 = #16254f            값 자체. 컴포넌트에서 직접 참조 금지
   ↓ alias
Semantic    bg-brand = {navy-900}         의미(역할). 테마별로 값이 바뀌는 층
   ↓ alias
Component   btn-primary-bg = {navy-900}   컴포넌트 전용 결정. 한 곳만 바꾸면 되도록
            (dark: {gray-100})
```

- **Primitive** 21개: 원본 6색 + 명도 확장 + 오류색. 테마와 무관합니다.
- **Semantic** 27개: `bg-*`, `text-*`, `border-*`, `accent*`, `icon`, `focus-ring*`, `danger`, `scrim`, `spotlight`. Light/Dark 값을 가집니다.
- **Component** 19개: `btn-*`, `link-underline`, `nav-indicator`, `header-bg-scrolled`, `input-*`, `chip-*`, `pub-focus-bar`, `media-placeholder-*`, `lattice-*`.

규칙: 새 컴포넌트는 먼저 Semantic 토큰으로 만들고, 두 컴포넌트 이상에서 같은 예외가 필요해질 때 Component 토큰을 추가합니다.

### 이름 규칙

`{category}-{role}-{variant}-{state}` — 예: `btn-secondary-fg-hover`, `text-on-brand-muted`, `focus-ring-on-brand`. 숫자 단계는 Primitive에만(`navy-700`).

### 토큰 패밀리 (tokens.json)

| 패밀리 | 예 | CSS |
| --- | --- | --- |
| color (light/dark) | `bg-page`, `text-secondary`, `btn-primary-wipe` | `var(--bg-page)` |
| type | 21 styles in Display / Heading / Korean / Text / UI | 유동 클래스 `.lab-t-h1` (bundle.css) |
| spacing | `space-1` … `space-12` | `var(--space-6)` |
| radius | `radius-0`, `radius-xs`, `radius-pill`, `radius-circle` | `var(--radius-pill)` |
| shadow | `shadow-none`, `shadow-float`, `shadow-overlay` | `var(--shadow-float)` |
| borderWidth | `border-hair`, `border-strong-w` | |
| breakpoint | `bp-sm` 480 · `bp-md` 768 · `bp-lg` 1024 · `bp-xl` 1440 · `bp-2xl` 1920 | 미디어쿼리 문서값 |
| layout | `container-max`, `container-text`, `grid-gutter`, `page-margin`, `header-h` | |
| duration | `dur-instant` … `dur-cinematic`, `stagger-*`, `delay-hero` | `var(--dur-slow)` |
| easing | `ease-standard`, `ease-out`, `ease-in`, `ease-in-out`, `ease-linear` | `var(--ease-out)` |
| zIndex | `z-base` … `z-cursor` | |

모션 토큰도 tokens.json이 단일 원천입니다. JS 모션 엔진(`Lab.motion.dur('dur-slow')`, `Lab.motion.ease('ease-out')`)은 실행 시 CSS 커스텀 프로퍼티를 읽으므로, 디자인 시스템 페이지에서 값을 바꾸면 CSS 트랜지션과 JS 애니메이션이 함께 바뀝니다.

### 코드에서 쓰기

#### CSS

```css
.cta { background: var(--btn-primary-bg); color: var(--btn-primary-fg);
  transition: scale var(--dur-instant) var(--ease-standard); }
.cta:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 3px; }
```

#### Tailwind (v3 `theme.extend`)

```js
// tailwind.config.js — 값은 모두 CSS 변수로 연결, 토큰은 tokens.css 한 곳에서만 정의
module.exports = { theme: { extend: {
  colors: { page: 'var(--bg-page)', subtle: 'var(--bg-subtle)', brand: 'var(--bg-brand)', deep: 'var(--bg-deep)',
    ink: { DEFAULT: 'var(--text-primary)', 2: 'var(--text-secondary)', 3: 'var(--text-tertiary)' }, accent: 'var(--accent)',
    hair: 'var(--border-hairline)', control: 'var(--border-control)' },
  fontFamily: { display: 'var(--font-display)', sans: 'var(--font-sans)' },
  borderRadius: { none: '0', pill: 'var(--radius-pill)' },
  transitionDuration: { instant: 'var(--dur-instant)', fast: 'var(--dur-fast)', base: 'var(--dur-base)', slow: 'var(--dur-slow)' },
  transitionTimingFunction: { standard: 'var(--ease-standard)', out: 'var(--ease-out)', inout: 'var(--ease-in-out)' },
  screens: { md: '768px', lg: '1024px', xl: '1440px' } } } };
```

#### TypeScript (Motion for React)

```ts
// lib/motion-tokens.ts — 실행 시 CSS 변수에서 읽고, SSR에서는 기본값
export const dur = (n: 'dur-instant'|'dur-fast'|'dur-base'|'dur-slow'|'dur-slower'|'dur-cinematic') =>
  typeof window === 'undefined' ? FALLBACK[n] : parseFloat(getComputedStyle(document.documentElement).getPropertyValue(`--${n}`)) / 1000;
export const ease = { standard: [0.2, 0, 0, 1], out: [0.16, 1, 0.3, 1], in: [0.5, 0, 0.75, 0], inOut: [0.76, 0, 0.24, 1] } as const;
export const spring = { snappy: { stiffness: 420, damping: 34 }, gentle: { stiffness: 170, damping: 26 },
  magnetic: { stiffness: 260, damping: 16, mass: 0.8 }, tilt: { stiffness: 200, damping: 22 } } as const;
```

### 테마

- `data-theme="light"`(기본) / `data-theme="dark"`. 다크에서도 `bg-brand`는 Navy를 유지해 브랜드 장면이 사라지지 않게 했고, 기본 지면은 Ink(#060817)로 바뀝니다.
- 다크 테마에서 Primary 버튼은 `gray-100` 채움 + Ink 라벨로 반전됩니다(Navy는 Ink 위 대비 1.34:1로 버튼 면이 되지 못함).
- 테마는 시스템 설정을 따르고(`prefers-color-scheme`), 사용자가 바꾼 값은 `localStorage`에 저장해 `<html data-theme>`에 적용합니다(구현은 Implementation Guide).

## 4. Motion System

### 세 개의 층

| 층 | 목적 | Duration | Easing | 예 |
| --- | --- | --- | --- | --- |
| **Micro** (즉각) | 입력에 대한 확인 | `dur-instant` 100 · `dur-fast` 180 | `ease-standard` | press .97, 색 변화, 체크 |
| **Transition** (전환) | 상태·콘텐츠 변화 설명 | `dur-base` 320 · `dur-slow` 560 | `ease-out` 진입 / `ease-in` 퇴장 | 탭 인디케이터, 아코디언, 텍스트 리빌, 필터 FLIP |
| **Cinematic** (연출) | 장면 전환·첫인상 | `dur-slower` 900 · `dur-cinematic` 1400 | `ease-in-out` | 이미지 마스크, 커튼, 공유 요소, Hero |

규칙: 들어오는 것은 감속(`ease-out`), 나가는 것은 가속(`ease-in`, 더 짧게), 화면을 가로지르는 면(커튼·마스크·wipe)은 `ease-in-out`. 스크롤에 직접 연결된 값은 easing 없이 선형으로(`ease-linear`) 위치에 비례합니다.

### 토큰

| 토큰 | 값 | 쓰임 |
| --- | --- | --- |
| `dur-instant` | 100ms | press, 체크 |
| `dur-fast` | 180ms | hover 색, 아이콘 이동, 포커스 |
| `dur-base` | 320ms | 탭·드롭다운·아코디언·칩·텍스트 roll |
| `dur-slow` | 560ms | 텍스트 마스크, 리스트, 메뉴 항목, wipe |
| `dur-slower` | 900ms | 이미지 마스크, 섹션·공유 요소 전환 |
| `dur-cinematic` | 1400ms | Hero 시퀀스, 페이지 전환 총 길이 |
| `stagger-tight` / `base` / `loose` | 40 / 70 / 120ms | 단어 / 줄·행 / 카드·블록 |
| `delay-hero` | 200ms | Hero 시작(폰트 안정 후) |
| `ease-standard` | cubic-bezier(0.2, 0, 0, 1) | UI 상태 |
| `ease-out` | cubic-bezier(0.16, 1, 0.3, 1) | 진입·리빌 |
| `ease-in` | cubic-bezier(0.5, 0, 0.75, 0) | 퇴장 |
| `ease-in-out` | cubic-bezier(0.76, 0, 0.24, 1) | 마스크·커튼·FLIP |

#### Spring (포인터 전용)

| 이름 | stiffness / damping / mass | 쓰임 |
| --- | --- | --- |
| `snappy` | 420 / 34 / 1 | 인디케이터 추종, press 복귀 |
| `gentle` | 170 / 26 / 1 | 커서 추적 이미지, lattice 렌즈 |
| `magnetic` | 260 / 16 / 0.8 | 자석 버튼(약한 오버슈트) |
| `tilt` | 200 / 22 / 1 | 카드 틸트 |

시간 기반 트윈은 "언제 끝나는지"가 중요한 곳(리빌, 전환)에, 스프링은 "손을 따라오는 느낌"이 중요한 곳(포인터 추종)에만 씁니다. 같은 요소에 두 방식을 섞지 않습니다.

#### 거리

| 거리 | 값 | 쓰임 |
| --- | --- | --- |
| 미세 | 3–8px | 화살표 이동, 드롭다운 항목, 검색 결과 |
| 중간 | 16–40px | 블록 rise, 패널 rise, 메뉴 항목 48px |
| 마스크 | 120% | 텍스트 줄 (자기 높이 기준) |
| 면 | 100% | 커튼, 방향 패널, 이미지 clip |

### Enter / Exit

| 대상 | Enter | Exit |
| --- | --- | --- |
| 제목 | 줄 마스크 상승, `dur-slow`·`ease-out`·`stagger-base` | 없음(페이지 전환 시 커튼이 덮음) |
| 이미지 | `clip`(하단→) 또는 `expand`(슬릿→), 내부 scale 1.18→1 | 없음 |
| 블록·카드 | 40px rise + opacity, `dur-slower`, `stagger-loose` | 없음 |
| 드롭다운 | clip 위→아래 `dur-base`, 항목 12px rise `stagger-tight` | 즉시 |
| 모바일 메뉴 | 버튼 중심 원형 확장 `dur-slower`, 항목 48px rise | 원형 축소 `dur-slow`·`ease-in` |
| 모달 | scrim fade `dur-base` + 패널 48px rise `dur-slow` / 공유 요소 FLIP `dur-slower` | 패널 24px 하강 + fade `dur-base`·`ease-in` |
| 페이지 | 커튼 상승(616ms) → 교체 → 커튼 상승 퇴장(616ms) + 새 페이지 96px rise | 이전 페이지 64px 상승 + 0.3 opacity |

진입은 한 번만 재생합니다(`once`). 스크롤을 되돌려도 다시 숨기지 않습니다.

### Hover / Press

- Press: 모든 버튼·칩 `scale .97`(`.94` 아이콘 버튼), `dur-instant`. `scale` 개별 속성을 써서 magnetic `transform`과 충돌하지 않습니다.
- Hover 진입은 `dur-slow` wipe / `dur-base` roll, 이탈은 같은 속도로 역방향(방향 인식 패널은 나간 방향으로).
- Hover 규칙은 모두 `@media (hover: hover) and (pointer: fine)` 안에 있습니다.

### Scroll-linked

| 효과 | 입력 | 출력 |
| --- | --- | --- |
| Hero parallax | 스크롤 거리 y | 제목 +0.22y, 이미지 −0.1y·scale +6%, lattice +0.45y |
| FullBleed | 섹션 진입률 0.05→0.55 | clip inset 48px→0 |
| ScrollText | 요소 중심 위치 0.9→0.3 | 단어 점등 비율 |
| ResearchExplorer | sticky 통과율 | 활성 분야, 진행 막대 scaleX |
| Publications | 뷰포트 45% 지점에 가장 가까운 행 | focus 행, 연도 롤링 |
| Timeline | 뷰포트 60% 지점 | 선 scaleY, 마일스톤 점등 |
| Marquee | 스크롤 속도·방향 | 이동 속도·방향 |
| Header | 방향·거리 | 숨김/표시, 배경, 진행 hairline |

구현 원칙: 스크롤 이벤트는 passive + rAF 1회 합치기, `transform`/`opacity`/`clip-path`만 변경, 레이아웃 속성 변경 금지. 스크롤 자체를 가로채거나 스냅·관성을 강제하지 않습니다(스크롤재킹 없음).

### Reduced Motion

`prefers-reduced-motion: reduce` 또는 `<html data-motion="reduced">`일 때:

- 진입 애니메이션이 준비되지 않습니다 — 콘텐츠는 처음부터 최종 상태로 보입니다.
- `motion.animate()`는 opacity만 남기고 150ms 이하로 줄이거나 즉시 최종 상태로 갑니다.
- Lattice는 정적 렌더 1회, Marquee는 줄바꿈된 정적 목록, ResearchExplorer는 쌓인 목록, 커튼은 150ms 크로스페이드, 스무스 스크롤은 즉시 이동.
- Magnetic·tilt·cursor-follow·direction-aware는 비활성화됩니다(정보는 포커스·터치 대체 경로로 동일하게 제공).
- CSS 트랜지션·애니메이션은 1ms로 단축, 반복 애니메이션(펄스, 스크롤 큐) 정지.

### 성능 예산

- 동시 실행 rAF 루프: Lattice 1개(화면 밖·탭 비활성 시 정지), Marquee 1개.
- Lattice: DPR 최대 2, 점 간격 28px(모바일 22px) → 1440×900 기준 약 1,700점.
- `will-change`는 실제로 움직이는 레이어(Hero 제목·이미지, magnetic, tilt)에만.
- 저사양/모바일: 포인터 효과는 터치에서 아예 붙지 않고, Research sticky는 1024px 미만에서 쌓인 목록으로 대체됩니다.

## 5. Interaction Specifications

형식: **트리거 → 반응 → 종료 상태**. 터치·키보드 대체 경로를 함께 적습니다. 수치는 Motion System 토큰을 따릅니다.

### A. Hero (Home)

| 단계 | 시점 | 반응 |
| --- | --- | --- |
| 진입 0 | 0ms | Lattice 점이 좌하단에서 우상단으로 파동처럼 나타남(≈2s) |
| 진입 1 | `delay-hero` 200ms | 제목 3줄이 마스크에서 상승, 줄 간격 `stagger-loose` 120ms, 각 `dur-slower` |
| 진입 2 | 450ms | 이미지가 중앙 1% 슬릿에서 좌우로 열림(`dur-cinematic`), 내부 scale 1.4→1 |
| 진입 3 | 1100ms | 국문 문장·리드·CTA가 24px 상승, `stagger-base` |
| 포인터 이동 | 상시 | 렌즈(반경 170px)가 spring `gentle`로 따라오며 점을 밀어내고 진하게(`lattice-dot-active`) |
| 포인터 없음 | 상시 | 가상 렌즈가 리사주 경로로 천천히 이동(터치 기기에서도 살아 있는 화면) |
| 스크롤 | 0 → Hero 높이 | 제목은 느리게 내려가며 fade(0.25h–0.8h 구간), 이미지는 반대로 올라가며 6% 확대, lattice는 가장 느리게 — 세 층이 갈라지며 깊이 |
| Reduced | — | 모든 요소 즉시 표시, lattice 정적 1회 렌더, parallax 없음 |

선택 근거: 브리프의 7개 후보 중 **텍스트 마스크 + 이미지 마스크 확장 + 포인터 반응 배경 + 층별 parallax**만 조합했습니다. 배경 그래픽 이동은 lattice의 미세 호흡으로 대체해 요소 수를 줄였습니다.

### B. Scroll Interaction

- **Section transition (Research 미리보기)**: 네이비 면이 좌우 48px·상단 64px 안쪽에서 시작해 섹션이 화면 55%까지 들어오는 동안 Full-bleed로 열립니다. 흰 지면 → 네이비 장면 전환을 선이 아닌 면의 확장으로 표현합니다.
- **Research — 구조가 바뀌는 스크롤 (ResearchExplorer)**: 섹션 높이 = 분야 수 × 90vh. sticky 영역 안에서 (1) 좌측 인덱스의 현재 항목이 진해지고 진행 막대가 채워짐, (2) 큰 숫자가 odometer처럼 회전(01→02), (3) 이미지가 아래에서 위로 와이프되며 이전 이미지는 위로 빠짐, (4) 우측 요약 패널이 교체되고 제목이 마스크에서 상승. 인덱스 버튼 클릭 시 해당 구간으로 부드럽게 이동(강제 스냅 없음). `aria-live="polite"`로 현재 분야를 알림.
- **Publications — 핵심 정보 강조**: 뷰포트 45% 높이에 가장 가까운 행이 focus 행이 되어 제목이 `text-primary`, 좌측 2px 막대가 위에서 아래로 그려지고, 나머지 행 제목은 `text-secondary`로 물러납니다. 좌측 레일의 연도가 focus 행의 연도로 롤링됩니다. 1024px 미만·reduced에서는 강조 없이 모든 행이 동일.
- **ScrollText (Vision)**: 단어가 읽는 속도로 점등. 미점등 상태도 `text-decorative`(대형 3:1 이상)라 언제나 읽을 수 있습니다.
- **Timeline (About)**: 세로선이 뷰포트 60% 지점까지 채워지고, 지나간 마일스톤의 점이 45° 회전·채움, 연도가 `text-primary`로.
- **Header**: 160px 이후 아래로 스크롤하면 숨김(`dur-slow`), 위로 4px 이상 스크롤하면 표시. 24px 이후 반투명 배경 + hairline. 하단 2px 진행 막대. 헤더 안에 포커스가 있으면 숨기지 않습니다.
- **Marquee**: 기본 40px/s, 스크롤 속도에 비례해 가속, 스크롤 방향에 따라 반전, 포인터를 올리면 정지.

### C. Hover & Pointer — 기능별 패턴

| 요소 | 포인터 반응 | 키보드 | 터치 |
| --- | --- | --- | --- |
| Primary CTA | 반경 +14px부터 자석처럼 이동(최대 0.28×거리), 라벨은 0.45배 더 이동, 진입점에서 원형 wipe(`btn-primary-wipe`), 화살표 교대 | focus ring, wipe 없음 | press scale만 |
| Secondary 버튼 | wipe로 Ink 채움, 라벨 White 반전 | focus ring | press |
| Text link (본문) | 밑줄이 오른쪽으로 빠졌다 왼쪽에서 다시 그려짐 | 밑줄 유지 + ring | 밑줄 유지 |
| Text link (독립) | 밑줄이 왼쪽에서 그려짐, 화살표 4px | focus 시 밑줄 표시 | — |
| 내비게이션 | 라벨 text roll, 인디케이터가 hover 항목으로 이동 후 이탈 시 현재 페이지로 복귀 | focus 항목으로 인디케이터 이동 | 모바일 메뉴 |
| Dropdown | 90ms 의도 지연 후 열림, 160ms 유예 후 닫힘 | 셰브론 버튼 Enter/Space/↓, Esc로 닫고 버튼으로 복귀 | 셰브론 탭 |
| Research index | 커서 오른쪽 32px에 이미지가 spring으로 따라옴, 행마다 clip 와이프로 교체, 이동 속도에 따라 ±6° 기울기, 다른 행은 `text-on-brand-subtle`로 물러남, 스포트라이트 | focus 행이 같은 상태 | 행마다 인라인 썸네일 |
| ResearchCard | 테두리가 시계방향으로 그려짐(4변 60ms 간격), 키워드 상승, 화살표 ↗ | focus-visible 동일 | 키워드 항상 표시 |
| Project | 3D tilt ≤4°, 내부 이미지 반대 방향 이동·4% 확대, 제목 밑줄 | focus ring | 정지 |
| Member | 들어온 가장자리에서 네이비 패널이 밀려 들어오고 나간 가장자리로 빠짐, 사진 1.04 | focus 시 패널 표시 | 관심 분야를 이름 아래 텍스트로 표시, 탭하면 프로필 |
| Publication 행 | 위/아래 진입 방향에서 `bg-selected` 면이 채워짐 | — | — |
| News | 이미지 1.05 천천히 확대(`dur-slower`), 제목 밑줄 | 제목 밑줄 | — |
| Gallery | 마우스 드래그 스크롤, 자석 화살표 | ← → | 네이티브 스와이프 + snap |

### D. Page Transition

1. 메뉴 클릭 → 인디케이터가 새 항목으로 이동 시작.
2. 네이비 커튼이 아래에서 올라와 화면을 덮음(616ms, `ease-in-out`). 동시에 현재 페이지가 64px 위로 밀리며 흐려짐. 커튼 위에 다음 페이지 제목(display-l)이 마스크에서 상승.
3. 덮인 상태에서 페이지 교체, 스크롤 0, 168ms 정지.
4. 커튼이 위로 빠져나감(616ms) — 새 페이지가 96px 아래에서 올라오고, PageHero 제목이 마스크에서 상승.
5. 스크린리더에 "Research 페이지" 알림, 포커스는 본문 바로가기 대상(`#lab-main`).
- **Shared element**: News 카드·인물 카드 → 상세 다이얼로그. 클릭한 이미지의 위치·크기에서 다이얼로그의 대표 이미지로 FLIP(`dur-slower`, `ease-in-out`), 나머지 내용은 380ms 후 순차 상승.
- 연속 클릭은 전환 중 무시, reduced는 150ms 크로스페이드.

### E. Micro Interaction

| 요소 | 상태 변화 |
| --- | --- |
| 버튼 | default → hover(wipe) → active(.97) → focus-visible(ring) → loading(라벨 + 회전 링, `aria-busy`) → disabled(.38, wipe 없음) |
| 메뉴 활성 | `aria-current="page"`, 인디케이터 2px, 번호 `accent` |
| 아코디언 | grid rows 0fr→1fr `dur-base`, + 의 세로획이 90° 회전해 −로, 번호 `accent` |
| 필터 칩 | 채움이 중심에서 50%→100%, 체크가 폭 0→14px로 밀려 들어옴, 개수 표시, 0건은 disabled |
| 탭 | 인디케이터가 폭·위치 동시 이동, 패널 16px 상승, ←/→/Home/End |
| 검색 결과 | 포커스 시 밑줄 그리기, 결과 행 8px 상승 `stagger-tight`, 일치 구간 `<mark>`, 결과 수 live 알림, 빈 결과 안내 |
| 이미지 로딩 | 실제 이미지가 로드되기 전 shimmer, 로드 후 opacity 0→1 |
| 폼 입력 | 라벨이 0.74배로 떠오름, 포커스선 좌→우, 유효 시 체크 pop, 오류 시 3px 흔들림 + 아이콘 + 문장(`role="alert"`), 제출 시 첫 오류로 포커스 |
| 폼 제출 완료 | 원이 그려지고 체크가 그려짐, 완료 영역으로 포커스 |
| 링크 복사 | "Copy DOI" → 체크 + "Copied"(1.8s), `aria-live` |
| Back to Top | 진행률 40% 이후 등장, 링이 진행률 표시, 클릭 시 맨 위 + 본문 포커스 |

### 키보드 & 스크린리더 공통

- 모든 인터랙티브 요소는 네이티브 `a`/`button`/`input`. 커스텀 role은 tablist, combobox/listbox, dialog만.
- 본문 바로가기 링크, 오버레이 포커스 트랩, Esc 닫기, 닫은 뒤 원래 요소로 포커스 복귀.
- 애니메이션용 복제 텍스트(마스크 줄, text roll 복제본, 마키)는 `aria-hidden`, 원문은 `sr-only`로 한 번만 읽힘.
- 터치 타깃 최소 40×40px(아이콘 버튼 s), 기본 44–48px.

## 6. Component Library

33개 컴포넌트가 `components/bundle.js`의 `window.Lab`으로 제공되며, 각각 라이브 프리뷰와 가이드(README)가 있습니다. 아래 표는 상태와 모션 규칙의 요약입니다. Props는 `components/index.d.ts`.

### Navigation

| 컴포넌트 | 상태 | 모션 규칙 |
| --- | --- | --- |
| SiteHeader | default · scrolled · hidden · on-brand · item hover/focus/current · dropdown open | 인디케이터 slide `dur-base`/`ease-out`, 숨김 `dur-slow`/`ease-in-out`, 진행 hairline 선형 |
| MobileMenu | closed · opening · open · closing · item current | 원형 clip 확장 `dur-slower`, 항목 48px rise `stagger-base` |
| TransitionProvider | idle · covering · swapping · revealing | 커튼 616+168+616ms |
| SiteFooter | default · link hover/focus | text roll, magnetic CTA 1개 |
| BackToTop | hidden · shown · hover · focus | 등장 `dur-slow`, 링 선형 |

### Content

| 컴포넌트 | 상태 | 모션 규칙 |
| --- | --- | --- |
| Hero | entering · idle · scrolled · reduced | 시퀀스(Interaction A), parallax 3층 |
| PageHero | entering · idle | 제목 lines, rule draw, body stagger |
| SectionHeader | default · on-brand | rule draw `dur-slower`, 제목 lines, 보조 stagger |
| MediaFrame | loading · revealing · idle · hover(zoom by parent) · placeholder | clip / expand / none, parallax 옵션 |
| ScrollText | per-word off/on | 색 전환 `dur-base` |
| Marquee | drifting · scrubbing · paused · static(reduced) | 속도 연동 |
| FullBleed | inset → full | 스크롤 연동 clip |

### Research · People · Publications · News

| 컴포넌트 | 상태 | 모션 규칙 |
| --- | --- | --- |
| ResearchIndex | idle · row current · others receded · touch | cursor-follow spring `gentle`, 이미지 clip `dur-slow`, spotlight |
| ResearchCard | default · hover · focus-visible | 테두리 draw 4×`dur-base`, 키워드 rise |
| ResearchExplorer | sticky(area n) · stacked(mobile/reduced) | 진행 막대, odometer, 와이프 `dur-slower`, 패널 교체 |
| ProjectShowcase | default · hover(tilt) · focus | tilt spring, 제목 밑줄 |
| MemberProfile / MemberGrid | default · hover(panel from edge) · focus(panel) · touch(text) | direction-aware `dur-slow`×0.8 |
| PublicationList / PublicationItem | filtered · empty · row hover · row focus-line · abstract open · DOI copied | FLIP `dur-slow`, 연도 roll, 막대 draw |
| NewsCard | l · m · s · hover · focus | zoom `dur-slower`, underline |
| Gallery | idle · dragging · lightbox | snap, FLIP lightbox |
| Timeline | item off/on | 선 scaleY, 점 회전 |

### Controls

| 컴포넌트 | 상태 | 모션 규칙 |
| --- | --- | --- |
| Button | primary · secondary · ghost · on-brand × s/m/l × default/hover/active/focus/loading/disabled · magnetic | wipe `dur-slow`, 화살표 교대 `dur-base`, press `dur-instant` |
| IconButton | outline · solid · ghost · on-brand × s/m/l | wipe, magnetic 옵션 |
| TextLink | inline · standalone · external · on-brand | redraw / draw-in |
| Tabs | tab default/hover/selected/focus/disabled | 인디케이터 slide, 패널 rise |
| FilterChips | off · on · hover · press · disabled(0건) | 채움 scale, 체크 width |
| Accordion | closed · open · hover · focus | grid rows, plus→minus |
| SearchField | empty · focus · typing · results · no results · result active | 밑줄 draw, 결과 stagger |
| TextField / Checkbox | empty · focus · filled · valid · error · disabled | 라벨 float, 포커스선 draw, shake, 체크 draw |
| ContactForm | idle · invalid · submitting · done · error | 버튼 loading, 완료 체크 draw |
| Modal | dialog · profile · article · media × entering/open/leaving | rise 또는 공유 요소 FLIP |

### Foundations · Showcase

- **GridOverlay** — 4/8/12 컬럼 오버레이(Shift+G). **MotionCurves** — 모션 토큰 실행 비교.
- **MotionShowcase** — 패턴을 용도 옆에 배치한 데모 페이지. **HomePrototype / HomePrototypeMobile** — 7개 페이지 전체를 이 시스템으로 조립한 프로토타입.

### 의도적으로 추가한 것

| 추가 | 이유 |
| --- | --- |
| ScrollText, Marquee, FullBleed, NumberRoll | 브리프의 Typography Motion·Section Transition·Animated Progress 요구를 별도 재사용 단위로 분리 |
| DemoBar | 프리뷰에서 reduced motion·다크 테마를 즉시 확인하기 위한 도구. 실제 페이지에는 쓰지 않음 |
| ScrollViewport | 고정 높이 프레임(프리뷰·문서) 안에서 스크롤 연동 효과를 재현. 실제 사이트에서는 생략(window 스크롤) |

## 7. Implementation Guide

### 기술 스택 결정

| 영역 | 선택 | 이유 |
| --- | --- | --- |
| 프레임워크 | Next.js (App Router) + React + TypeScript | 정적 생성으로 연구실 사이트 규모에 적합, 이미지 최적화 |
| 스타일 | CSS Custom Properties(tokens.css) + Tailwind | 토큰 원천 1곳, Tailwind는 변수만 참조 |
| UI 모션 | **Motion for React** | 진입·퇴장(AnimatePresence), layout/FLIP(`layoutId`), spring, 제스처 |
| 스크롤 연출 | **GSAP + ScrollTrigger — ResearchExplorer와 Publications focus line에만** | pin·scrub·구간 계산이 필요한 2곳. 나머지 스크롤 효과는 Motion `useScroll`로 충분 |
| 캔버스 | 의존성 없이 직접(FieldLattice) | 1,700점 2D 캔버스는 라이브러리가 필요 없음 |

한 효과에 두 엔진을 섞지 않습니다: 포인터·상태·전환은 Motion, pin/scrub은 GSAP. 이 시스템의 `bundle.js`는 프리뷰용 무의존 레퍼런스 구현이며, 각 훅이 아래 대응표처럼 옮겨집니다.

| bundle.js | Next.js 구현 |
| --- | --- |
| `useReveal(variant)` / `SplitText` | `motion.span` + `whileInView`, `viewport={{ once: true, margin: '0px 0px -12% 0px' }}`, variants에 `ease.out`, `staggerChildren` |
| `MediaFrame reveal` | `motion.figure` clipPath 애니메이션 + `next/image` (`placeholder="blur"`) |
| `useMagnetic` / `useTilt` | `useMotionValue` + `useSpring(springs.magnetic)` |
| `useDirectionalHover` | `onPointerEnter/Leave`에서 edge 계산 → `animate(x/y)` |
| `useScrollLink` | `useScroll({ target, offset })` + `useTransform` |
| `ResearchExplorer` | GSAP `ScrollTrigger.create({ pin: true, scrub: true, snap: false })`, `matchMedia`로 ≥1024 & motion 허용에서만 |
| `PublicationList` focus line | ScrollTrigger `onUpdate`에서 중심 행 계산, FLIP은 Motion `layout` |
| `TransitionProvider` | `app/template.tsx` + `AnimatePresence mode="wait"`; 지원 브라우저에서는 View Transitions API로 점진 향상 |
| `Modal originRect` | `layoutId`로 카드 이미지와 다이얼로그 이미지를 연결 |
| `motion.reduced()` | `useReducedMotion()` + `MotionConfig reducedMotion="user"` |

### 폴더 구조

```
app/
  layout.tsx            # 폰트(next/font/local: Pretendard Variable, Inter), tokens.css, <SiteHeader/>, <SiteFooter/>
  template.tsx          # 페이지 전환 커튼 (AnimatePresence)
  page.tsx              # Home
  about/page.tsx  research/page.tsx  people/page.tsx  people/[slug]/page.tsx
  publications/page.tsx  news/page.tsx  news/[slug]/page.tsx  contact/page.tsx
components/
  motion/               # SplitText, Reveal, MediaFrame, FieldLattice, ScrollText, Marquee, FullBleed, tokens.ts
  nav/                  # SiteHeader, MobileMenu, ScrollProgress, BackToTop
  content/              # Hero, PageHero, SectionHeader, ResearchIndex, ResearchCard, ResearchExplorer,
                        # ProjectShowcase, MemberProfile, PublicationList, NewsCard, Gallery, Timeline
  ui/                   # Button, IconButton, TextLink, Tabs, FilterChips, Accordion, SearchField, TextField, Checkbox, Modal
content/                # MDX 또는 JSON: research.json, people.json, publications.bib → json, news/*.mdx
styles/tokens.css       # tokens.json에서 생성 (Style Dictionary 또는 이 시스템 페이지의 tokens.css 내보내기)
styles/components.css   # bundle.css 이식
```

콘텐츠를 코드와 분리해 두면 연구실 구성원이 PR 없이 JSON/MDX만 고칠 수 있습니다. 논문은 BibTeX → JSON 변환 스크립트로 관리하는 것을 권장합니다(DOI·연도·유형 필드가 그대로 필터가 됨).

### 7개 페이지 적용 청사진

각 페이지는 서로 다른 지배적 경험 하나를 가집니다. 네이비 면은 페이지당 2회 이하.

#### 1. Home — 시네마틱 첫인상 → 요약 탐색
`Hero`(lattice) → Vision `ScrollText` + 국문 비전 → `Marquee`(연구 키워드) → **Navy** `FullBleed` + `SectionHeader onBrand` + `ResearchIndex`(cursor-follow) → Selected Work `ProjectShowcase`(2) → People `MemberGrid`(4, `bg-subtle`) → Recent `PublicationList compact`(4) → News 대·소 그리드 → **Deep** `SiteFooter`.

#### 2. About — 타이포그래피·이미지 스크롤 스토리텔링
`PageHero` → 21:9 Full-bleed `MediaFrame parallax` → Philosophy: 좌측 sticky 제목 + 우측 `ScrollText` 문장들 + 원칙 `Accordion` → History `Timeline`(`bg-subtle`) → (선택) 연구실 사진 `Gallery`.

#### 3. Research — 분야별 스크롤 연출
`PageHero` → `ResearchExplorer`(sticky story, 모바일은 stacked) → Projects `ProjectShowcase`(전체, 교차) → 프로젝트 상세는 `/research/[slug]` 또는 Modal(article). 분야 카드가 필요한 곳(예: 학과 소개 임베드)은 `ResearchCard` 그리드.

#### 4. People — 인물 이미지 그리드
`PageHero` → 지도교수 split(4:5 초상 + 소개 + 연락처 + CV 링크) → `Tabs`(Current Members / Alumni) + `MemberGrid` → 클릭 시 프로필 Modal(공유 요소) 또는 `/people/[slug]`. Hover 정보(연구 분야)는 터치에서 이름 아래 텍스트로.

#### 5. Publications — 목록 중심 정교한 인터랙션
`PageHero` → `PublicationList`(연도 롤링 레일, 유형 필터 Journal/Conference/Book, 검색, focus line, DOI 링크·복사, 초록 펼침). URL 쿼리(`?type=journal&q=`)와 필터 상태를 동기화해 공유 가능하게.

#### 6. News — 콘텐츠 탐색과 전환
`PageHero` → 분류 `FilterChips` → 비대칭 뉴스 그리드(첫 카드 l) → 카드 클릭 시 이미지가 상세 대표 이미지로 이어지는 공유 요소 전환 → `Gallery`(`bg-subtle`, 라이트박스).

#### 7. Contact — 인터랙티브 폼
`PageHero` → split: 연락처 dl + 지도 placeholder / `ContactForm` → 연구실 참여 안내 `Accordion`(`bg-subtle`). 폼 전송은 서버 액션 또는 폼 서비스로 연결하고, 스팸 방지(honeypot)와 개인정보 동의 문구를 연구실 확정본으로 교체.

### 접근성 체크리스트 (WCAG 2.2 AA)

- [ ] 대비: Foundations 표의 쌍 외 새 조합은 추가 전 계산
- [ ] 포커스 표시 2px `focus-ring`, sticky header가 포커스 요소를 가리지 않음(2.4.11 — `scroll-padding-top: var(--lab-header-h)`)
- [ ] 드래그 대체: Gallery는 버튼·키보드로 이동 가능(2.5.7)
- [ ] 타깃 크기 ≥24px(2.5.8), 기본 40–48px
- [ ] `prefers-reduced-motion` 존중 + 사이트 내 모션 토글(선택)
- [ ] 자동 재생: Marquee는 hover 정지, reduced에서 정적. 5초 이상 움직이는 요소는 정지 수단 제공(2.2.2) — 실제 사이트에서는 Marquee 옆 일시정지 버튼 추가 권장
- [ ] 페이지 전환 후 문서 제목 갱신, 포커스 `#lab-main`, live 알림
- [ ] 이미지 대체 텍스트: 연구 이미지는 내용 설명, 장식은 `alt=""`

### 성능

- 폰트: Pretendard는 dynamic subset(woff2-dynamic-subset)으로 교체해 첫 로드 ~2MB → 필요 subset만. Inter는 latin opsz 73KB.
- 이미지: `next/image` + AVIF, Hero 이미지만 `priority`.
- Lattice: `IntersectionObserver`로 화면 밖 정지, `visibilitychange` 정지, DPR ≤2. 저사양 감지(`navigator.hardwareConcurrency <= 4`) 시 점 간격 36px.
- GSAP는 Research·Publications 라우트에서만 동적 import.
- 모든 스크롤 연동은 transform/opacity/clip-path만 사용.

### 이 시스템을 프로젝트로 가져오기

1. `tokens.json` → `styles/tokens.css` 생성(이 시스템 페이지가 만드는 tokens.css를 그대로 써도 됨).
2. `components/bundle.css`를 `styles/components.css`로 이식(클래스 접두사 `lab-` 유지).
3. `components/src/*.js`를 위 대응표에 따라 TSX 컴포넌트로 옮기며 Motion/GSAP로 교체. props 계약은 `index.d.ts` 그대로.
4. `Lab.sample` 구조를 `content/*.json` 스키마로 사용하고 placeholder를 확정 정보로 교체.

## 8. Decision Log

설계 근거와 단계별 산출물 기록입니다. 각 단계는 이전 단계의 결과(토큰 → 컴포넌트 → 쇼케이스 → 프로토타입)를 재사용합니다.

### Phase 기록

| Phase | 산출물 | 위치 |
| --- | --- | --- |
| 1. Design Direction | 컨셉, 원칙, 레퍼런스 원칙 추출, 금지 목록 | README, Design Direction |
| 2. Foundations & Tokens | 67 컬러(21 primitive · 27 semantic · 19 component) × 2 테마, 21 타입 스타일, 간격·반경·그림자·레이아웃·브레이크포인트·모션·z-index, 대비 검증 | tokens.json, Foundations, Design Tokens |
| 3. Component Library | 33 컴포넌트, 무의존 모션 엔진(spring, reveal, scroll-link, FLIP, focus trap) | components/bundle.js·css, index.d.ts, 각 README·preview |
| 4. Motion & Interaction Showcase | MotionShowcase, MotionCurves, 컴포넌트별 라이브 데모 | Showcase 그룹 |
| 5. Home Page Prototype | 7개 페이지 프로토타입(1440·390) | HomePrototype, HomePrototypeMobile |

### 주요 결정

| 결정 | 대안 | 근거 |
| --- | --- | --- |
| Blue Gray 텍스트용 명도 단계(bluegray-600/700) 추가 | 원본 #667D9D를 본문에 사용 | 흰 배경 4.21:1로 AA 미달. 원본은 24px+·아이콘·컨트롤 테두리로 역할 한정 |
| 다크 테마에서도 `bg-brand` = Navy 유지 | 다크에서 Navy 섹션을 밝게 반전 | 네이비 장면이 브랜드 식별의 핵심. 지면만 Ink로 |
| 버튼 pill / 콘텐츠 radius 0 | 전체 4–8px radius | "둥근 카드" 탈피 + 행동 가능성의 형태 신호 |
| Hero 모션 4종만 조합 | 브리프 7종 전부 | 중복 연출은 초점을 분산. 배경 이동은 lattice 호흡으로 흡수 |
| Lattice를 사이트에서 1곳만 사용 | 섹션마다 배경 그래픽 | 서명 요소는 희소해야 기억됨 |
| Research sticky는 ≥1024px + full motion에서만 | 모든 화면에서 sticky | 모바일 sticky 스토리는 탐색 방해·성능 부담. 동일 정보를 쌓인 목록으로 |
| 스크롤 스냅·스크롤재킹 없음 | 섹션 단위 스냅 | 브리프의 "탐색 방해 금지", 접근성 |
| 모션 토큰을 tokens.json 원천 + JS가 런타임에 읽음 | JS 상수와 CSS 변수 이중 관리 | 단일 원천 |
| 유동 타입은 bundle.css의 clamp() | tokens.json에 clamp 저장 | 토큰 포맷이 길이 값만 허용. tokens.json = 최대값, 최소값은 Foundations 표에 명시 |
| 인터랙티브 정보의 터치 대체를 `(hover:none)` 미디어로 | 화면 폭으로 판단 | 터치 노트북·태블릿 가로 모드 대응 |
| 로고 없음 → 텍스트 Brand | 임시 심볼 제작 | 연구실 정체성을 임의로 만들지 않음 |

### 열린 항목 (확정 필요)

- 레퍼런스 이미지 3장이 대화에 첨부되지 않았습니다 — 받으면 Design Direction의 추출 원칙을 이미지 기준으로 검증합니다.
- 연구실 공식 명칭(국/영), 로고 유무, 지도교수·구성원·논문·연혁·연락처 실제 데이터.
- 실제 사진 확보 시 아트디렉션: 듀오톤(네이비) 처리 여부, 인물 촬영 배경 통일 여부.
- Pretendard 배포 방식(dynamic subset), 폼 전송 백엔드, 개인정보 동의 문구.
- 다국어(국/영 전환) 필요 여부 — 필요하면 `lang` 라우팅과 영문 본문 스타일(`body` 영문 line-height 1.6) 추가.

## 부록 — 컴포넌트 레퍼런스

Props 타입 전체는 디자인 시스템 artifact의 `components/index.d.ts`에 있습니다.

### Button

Pill-shaped action with a circular fill that grows from the pointer's entry point and an arrow that hands off to its copy.

**Provide**: `children` (verb-first label, 1–3 words), `variant` `primary | secondary | ghost | on-brand`, `size` `s | m | l`, `icon` (Icon name, `null` for none; default `arrow-right`), `href` (renders `<a>`), `onClick`, `type`, `magnetic`, `loading`, `disabled`, `external`.

**Use**: `primary` once per view for the thing the page is for ("Explore Research", "문의 보내기"). `secondary` beside it. `ghost` in dense UI. `on-brand` on `bg-brand`/`bg-deep`.

**Motion**: hover wipe `dur-slow`/`ease-out` from `--wx/--wy`; arrow out/in `dur-base`/`ease-in-out`; press `scale .97` `dur-instant`. `magnetic` adds a spring (`magnetic`) pull within +14px — one CTA per view only.

**States**: default · hover · active · focus-visible (2px `focus-ring`, offset 3) · loading (`aria-busy`, spinner) · disabled (.38, no wipe).

**Don't**: magnetic on form-internal buttons; more than one primary per view; icon-only content (use IconButton).

### IconButton

Circular icon action (48px; s 40, l 64) sharing Button's wipe, with optional magnetism for carousel arrows.

**Provide**: `label` (required — becomes `aria-label`), `icon`, `variant` `outline | solid | ghost | on-brand`, `size`, `onClick`/`href`, `magnetic`, `expanded`/`controls`/`pressed` for toggles.

**Use**: gallery arrows, close buttons, header search. Never for primary page actions.

**Motion**: same wipe as Button; press `.94`.

**A11y**: always a text `label`; icon is `aria-hidden`.

### TextLink

Link with an underline that redraws on hover (inline) or draws in (standalone); external links get a travelling ↗ and a "(새 창)" note.

**Provide**: `href`, `children`, `variant` `inline | standalone`, `external`, `onBrand`, `current`.

**Use**: `inline` inside body copy — it keeps its underline at rest so links are never colour-only. `standalone` for "All publications →" style section exits.

**Motion**: inline: line exits right then redraws from left (`dur-slower`, `ease-in-out`); standalone: draws in `dur-slow`, arrow +4px.

### BackToTop

Floating circle that appears after 40% of the page and shows scroll progress as a ring.

**Provide**: optional `threshold` (0–1), `focusId` (element focused after jumping; default `lab-main`).

**Motion**: enters `dur-slow` rise+scale; ring is linear to progress; jump is smooth (instant under reduced motion).

**A11y**: `aria-label="맨 위로"`; removed from tab order while hidden; moves focus to main content after the jump.

### SiteHeader

Sticky global header: brand text, seven-item navigation with a sliding indicator, dropdowns, scroll progress hairline and the mobile menu trigger.

**Provide**: `items` `[{id, label, href, children?: [{label, ko, href}]}]` (order: Home, About, Research, People, Publications, News, Contact), `active` (id), `onNavigate(id, child, event)`, `brandName`, `brandSub`, `actions` (extra nodes, e.g. search), `tone` (`on-brand` over a dark hero), `hideOnScroll`, `progress`.

**Behaviour**: hides after 160px when scrolling down, returns on scroll up; background + hairline after 24px. Indicator follows hover/focus and returns to the current page. Dropdown opens after 90ms hover intent, closes 160ms after leaving; keyboard opens it with the chevron button (Enter/Space/↓), Esc closes and returns focus.

**Motion**: indicator `dur-base` `ease-out`; hide `dur-slow` `ease-in-out`; labels text-roll `dur-base`; dropdown clip + items `stagger-tight`.

**A11y**: skip link first; `aria-current="page"`; chevron is a separate `button` with `aria-expanded`/`aria-controls`.

### MobileMenu

Full-screen brand overlay below 1024px; opens as a circle growing from the menu button and lists the seven pages large.

**Provide**: rendered by SiteHeader. Stand-alone: `open`, `onClose`, `items`, `active`, `anchor` (ref of the trigger), `onNavigate`, `footer`.

**Motion**: `clip-path: circle()` `dur-slower` `ease-in-out`; rows rise 48px `stagger-base`; closes `dur-slow` `ease-in`.

**A11y**: `role="dialog"` `aria-modal`, focus trapped, Esc closes and returns focus to the trigger, page scroll locked.

### TransitionProvider

Page-transition curtain: the brand panel rises with the next page title, the page swaps while covered, then the panel leaves upward.

**Provide**: wrap the app; pass `mainRef` (the `<main>` element). Call `usePageTransition().go(title, swap)` from navigation, where `swap()` changes the route/state.

**Timing**: cover 616ms + hold 168ms + reveal 616ms (= `dur-cinematic` 1400). Outgoing page lifts 64px; incoming rises 96px.

**Reduced**: 150ms cross-fade. Repeat clicks during a transition are ignored. The new page title is announced via `aria-live`.

### SiteFooter

Deep footer with the one closing CTA ("Join the Lab"), page links with text roll and contact placeholders.

**Provide**: `items` (nav), `onNavigate`. Replace bracketed contact placeholders with confirmed data.

**Rule**: the footer is the page's second dark scene; don't put another navy section directly above it.

### Hero

Cinematic home opening: display-xl English lines rise from masks, an image opens from a slit, the dot lattice bends around the pointer, and three layers part on scroll.

**Provide**: `lines` (2–3 manual lines), `ko` (Korean statement), `lead`, `actions` (Buttons: one magnetic primary + one secondary), `media` `{label | src, alt}`, `meta` `[left, right]`, `replay` (number, demo only).

**Use**: Home only, once. Sub-pages use PageHero.

**Motion**: see Interaction Specifications A. Parallax: title +0.22y with fade, image −0.1y and +6% scale, lattice +0.45y.

**Don't**: add a background video or gradient behind it; overlap the title on the image.

### PageHero

Opening for sub-pages: index and label, display-l title rising from its mask, a hairline drawing across, Korean title and lead.

**Provide**: `index` "(03)", `eyebrow`, `lines` or `title`, `ko`, `lead`, `tone` (`brand` for a navy opening — counts toward the two-navy limit).

### SectionHeader

Section opening: hairline drawing left→right, (index) and English label, English title in mask lines, Korean title/description and an optional exit link.

**Provide**: `index`, `eyebrow`, `lines` or `title`, `ko`, `description`, `action` (TextLink standalone), `onBrand`, `size` `l`, `as`.

**Layout**: desktop meta 1–2 · title 3–8 · side 9–12. This is the only hairline a section draws.

### MediaFrame

Image container with honest placeholders and two reveals — `clip` (rises from the bottom edge) and `expand` (opens from a centre slit) — plus optional parallax.

**Provide**: `ratio` ("4/5", "16/10", "21/9"…), `src`+`alt` or `label` (placeholder purpose), `tone` `navy | gray`, `reveal` `clip | expand | none`, `trigger` `view | mount`, `delay`, `parallax` (0–1), `caption`.

**Use**: portraits 4:5 `gray`; research/news 3:2·16:10 `navy`; About panorama 21:9 with `parallax`.

**Motion**: clip `dur-slower` `ease-in-out` with inner scale 1.18→1; expand `dur-cinematic`, inner 1.4→1. Parents may scale `.lab-media__img` on hover (news, members).

**Don't**: round its corners, add shadows, or swap placeholders for stock photos presented as the lab's own.

### ScrollText

Statement whose words ink in as it crosses the viewport — from `text-decorative` to `text-primary`.

**Provide**: `text`, `className` (a type class ≥24px: `lab-t-h1`…`lab-t-h3`), `as`.

**Rule**: only at 24px+ (unlit words are 3:1+, legible at every step). One per page section.

### Marquee

Keyword band that drifts, speeds up and reverses with scroll velocity and pauses under the pointer.

**Provide**: `items` (strings), `speed` (px/s, default 40), `onBrand`.

**A11y**: the moving copy is `aria-hidden`; a visually hidden list carries the words. Static wrapped list under reduced motion. For production, pair with a pause control (WCAG 2.2.2).

### FullBleed

Brand (or deep) section whose ground opens from the content width to the full viewport as it scrolls in.

**Provide**: `tone` `brand | deep`, `children`, `className` (usually `lab-sec`).

**Rule**: at most two brand/deep scenes per page, never adjacent.

### ResearchIndex

Home research preview on a brand ground: large rows with a media preview that follows the cursor and swaps per row, a spotlight, and receding siblings.

**Provide**: `areas` `[{title, ko, keywords[], media, href, onClick}]` (3–6).

**Touch**: each row shows its own thumbnail; nothing depends on hover.

**Motion**: follow spring `gentle`, image swap clip `dur-slow`, tilt by velocity ±6°, title shifts 20px.

### ResearchCard

Square research block whose frame draws itself clockwise on hover or focus while keywords rise.

**Provide**: `index`, `title`, `ko`, `summary`, `keywords[]`, `href`/`onClick`.

**Use**: grids of research areas outside Home (embeds, Research overview). Keywords are always visible on touch.

### ResearchExplorer

Research-page scroll story: a sticky stage where the index fills, the numeral rolls, the image wipes and the summary swaps as each area passes.

**Provide**: `areas` (same shape as ResearchIndex, with `summary`), `label`.

**Behaviour**: height = areas × 90vh; index buttons jump to an area (smooth, no snapping). Below 1024px or under reduced motion it renders a stacked list with the same content.

**A11y**: current area announced politely; inactive panels are `aria-hidden`.

### ProjectShowcase

Asymmetric alternating project rows whose media tilts toward the pointer while an inner layer counter-shifts.

**Provide**: `items` `[{title, ko, status: 'ongoing'|'completed', facts: [[label, value]], media, href}]`.

**Motion**: tilt ≤4° spring `tilt`; title underline draws. No tilt on touch or reduced motion.

### MemberProfile

Portrait card whose brand panel slides in from the edge the pointer entered (and leaves through the edge it exits), listing research interests.

**Provide**: `member` `{name, role, interests[], media, email}`, `onOpen(member, mediaEl)` for the profile dialog (pass the element so the image can grow into the dialog). `MemberGrid` takes `members`, `onOpen`.

**Touch**: interests appear as text under the name. **Keyboard**: focus shows the panel; Enter opens the profile.

### PublicationList

Publication archive: sticky rail with a rolling year, result count, type filters and search; year-grouped rows with DOI link/copy and abstract disclosure; a focus line that inks the row at the viewport centre.

**Provide**: `items` `[{year, type, typeLabel, title, authors, venue, doi, url, abstract}]` sorted by year desc, `types` `[{value, label}]`, `compact` (no rail; Home), `search`, `focusLine`.

**Motion**: filter/search changes re-flow rows with FLIP `dur-slow`; new rows rise `stagger-tight`; row hover fill enters from the top or bottom edge; focus bar draws `dur-slow`.

**Empty**: message + "필터 초기화" button.

### NewsCard

News item in three sizes (l, m, s); the image scales slowly inside its mask and the title underline draws on hover.

**Provide**: `item` `{date, dateTime, category, title, excerpt, media, href}`, `size`, `onOpen(item, mediaEl)` to open a detail dialog with a shared-element transition.

**Layout**: Home uses l + s + s; the News page uses l spanning two rows then m.

### Gallery

Horizontal photo strip with native scroll-snap, mouse drag, magnetic arrows, ← → keys, a progress line and a lightbox that grows from the clicked image.

**Provide**: `items` `[{label|src, caption, ratio}]`, `label`.

**A11y**: the track is focusable with a usage hint; dragging has button/keyboard alternatives.

### Timeline

Vertical history whose line fills with scroll; each milestone lights (dot turns, year inks) as the line reaches it.

**Provide**: `items` `[{year, title, text}]`.

### Tabs

Tablist with a sliding indicator and a panel that rises in; roving tabindex with ← → Home End.

**Provide**: `tabs` `[{value, label, count, content, disabled}]`, `value`/`onChange` (controlled) or `defaultValue`, `label`.

### FilterChips

Toggle chips (aria-pressed) whose fill grows from the centre and whose check slides in; zero-count options disable.

**Provide**: `options` `[{value, label, count}]`, `value` (array when `multiple`, string otherwise), `onToggle(value)`, `onClear`, `multiple`, `showAll`, `allLabel`, `label`.

### Accordion

Disclosure list: header buttons with aria-expanded, height easing open and a plus that turns into a minus.

**Provide**: `items` `[{title, content}]`, `multiple`, `defaultOpen`.

### SearchField

Search input whose underline draws on focus, with an optional combobox of results that rise in with matches highlighted.

**Provide**: `label`, `placeholder`, `value`/`onChange` or `defaultValue`, `results(query) → [{group, title, …}]`, `onSelect(result)`, `compact`.

**Keyboard**: ↑ ↓ to move, Enter to select, Esc to close; result count announced.

### TextField

Underlined input with a floating label, a focus line that draws left→right, and hint/error text linked by aria-describedby. `Checkbox` draws its tick.

**Provide**: `label`, `name`, `type`, `value`/`onChange` or `defaultValue`, `onBlur`, `required`, `hint`, `error` (string), `valid`, `disabled`, `multiline`, `rows`.

**Error**: `danger` line + icon + sentence (`role="alert"`) + a 3px shake (none under reduced motion). Write errors as what to do: "이메일 형식을 확인해 주세요. 예: name@example.com".

### ContactForm

Inquiry form: purpose chips, name, email, affiliation, message, consent; validates on blur and submit, shows loading, then folds into a confirmation.

**Provide**: `purposes` `[{value, label}]`, `onSubmit(data) → Promise` (wire to your backend).

**Replace before launch**: the consent text placeholder.

### Modal

Dialog in a portal with focus trap, Esc, scroll lock and focus return; with `originRect` its hero image grows from the clicked source (shared element).

**Provide**: `open`, `onClose`, `title`, `variant` `dialog | profile | article | media`, `hero` (a MediaFrame with `className="lab-modal__hero"`), `originRect` (DOMRect of the source image), `children`.

**Motion**: scrim `dur-base`; panel rise 48px `dur-slow`, or FLIP `dur-slower` with content rising after 380ms; exit 24px `dur-base` `ease-in`.

### GridOverlay

Developer overlay of the 4 / 8 / 12-column grid; toggle with Shift+G on any page.

**Provide**: `visible`, `inline` (absolute instead of fixed).

### MotionCurves

The motion tokens made visible: each duration × easing pair runs a mark along its track; Replay to compare.

**Provide**: optional `rows` `[[name, durationToken, easingToken]]`.
