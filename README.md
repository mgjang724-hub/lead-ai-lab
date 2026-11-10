# LEAD AI Lab — Lab Website

상명대학교 교육학과(서울) 이현우 교수 연구실 홈페이지. Next.js(App Router) 정적 내보내기 사이트로, 백엔드 없이 정적 호스팅(Vercel/Netlify/GitHub Pages/학교 서버)에 배포할 수 있습니다.

브랜드: **LEAD AI Lab** — Learning Experience, Analytics & Design · 국문 "AI 학습경험·분석·설계 연구실" · 로고 표기 "LEAD AI LAB.". 홈페이지 제작을 위한 **브랜드 제안안**이며 대학의 공식 승인 여부는 확인되지 않았습니다(`content/data/brand.json` 의 `meta.status: "proposal"`). 공식 기관 명칭(상명대학교 교육학과)과 구분해 표기하고, 승인되면 `status` 를 `"approved"` 로 바꾸면 화면의 '브랜드 제안안' 안내가 사라집니다. 명칭·슬로건·소개문·비전 축 등 모든 브랜드 문구는 이 파일 한 곳에서 관리하며, 컴포넌트는 `content/brand.ts` 를 통해서만 읽습니다(하드코딩 없음).

디자인 시스템: **Learning Lab — Kinetic Editorial** (`design-system/`). 토큰 → `styles/tokens.css`(자동 생성), 컴포넌트 CSS → `styles/components.css`, 사이트 추가 스타일 → `styles/site.css`.

## 실행

> 예시(가상) 구성원·졸업생(`isSample: true`)은 2026-11-06 연구실 결정으로 공개 화면에 '예시' 배지와 함께 표시됩니다(상세 페이지는 noindex, sitemap 제외). 예시 소식(`news.json` 의 `isSample` — 연구실 세미나·회식 등 연구실 일상, 내용은 가상)도 2026-11-09 연구실 요청으로 '예시' 배지와 함께 표시되며, Home 'Latest from the lab' 에는 이 연구실 일상 소식만 나옵니다(`SHOW_SAMPLES` 환경변수는 더 이상 쓰지 않음). 2026-11-06 연구실 요청으로 방문자 화면의 개발용 안내 문구(임시 분류·출처·확인 후 게시·브랜드 제안안 등)는 모두 제거했고, 미확정 항목(이메일·도로명 주소·면담 시간·소개문)은 값이 없으면 해당 줄을 숨깁니다 — 내부 메모는 `content/DATA-NOTES.md` 와 각 JSON 의 `meta.note` 에만 둡니다.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # tokens 생성 + 정적 빌드 → out/
npm run start        # out/ 를 로컬에서 서빙
npm run typecheck    # tsc --noEmit
npm run check:data   # content/data/*.json 검증
```

배포 도메인은 `NEXT_PUBLIC_SITE_URL` 환경변수로 지정합니다(sitemap·OG·canonical 에 사용). 미지정 시 `https://lab.example.ac.kr` 자리표시 값이 들어갑니다.

> **Dropbox/OneDrive 폴더에서 작업할 때** — 클라우드 동기화 폴더 안의 파일에는 cloud-files reparse 태그가 붙어 Next 가 이전 `.next/` 캐시를 정리하다 `EINVAL readlink` 로 실패합니다. 그래서 `npm run build` 와 `npm run dev` 는 먼저 `scripts/clean.mjs` 로 `.next/`(빌드 시 `out/` 도) 를 지웁니다(`prebuild`/`predev`). 수동 정리는 `npm run clean`. Dropbox 가 새 파일을 잠깐 잠가 `EBUSY` 가 나면 몇 초 뒤 다시 실행하세요.

## 구조

```
app/                    라우트 (page.tsx = 서버 컴포넌트)
  page.tsx              Home
  about/                About — Professor(지도교수 소개, 유일한 프로필) › Overview › Vision › Join
  research/             Research(= Research Areas) — 다섯 분야 설명 + 분야별 최근 관련 연구 3건만(연구 과제·논문 미리보기 없음),
                        research/[slug] 분야 상세 = 분야 설명 + 관련 연구 아카이브(전체)
  projects/             Projects — 연구 과제 전체 목록(ProjectShowcase 행 목록, /projects#pXX 앵커); 메뉴 Research › Projects 로 진입
  people/               People — 구성원·졸업생만(지도교수는 about#professor), people/[slug] 구성원·졸업생 프로필(초상 우선 레이아웃, 이름 옆 영문 이름, 연구실적·참여 연구 프로젝트·수상경력·이력 섹션)
  publications/         Publications — 논문·학술발표만 (URL 쿼리 type/area/q/order), 메뉴에서는 Research › Publications/Presentations 로 진입
  books/                Books — 저역서 표지 카드 목록 (publications.json 의 book 항목, cover 가 있으면 이미지, purchaseUrl 이 있으면 표지가 구매 페이지 링크)
  news/                 News, news/[slug] 소식 상세
  contact/              Contact (폼은 미연결 — 전송 완료로 표시하지 않음)
  not-found.tsx, sitemap.ts, robots.ts, layout.tsx(SEO·OG 메타 — brand 에서 파생), icon.svg(파비콘 — 브랜드 마크, components/brand 의 Mark 와 동일 형태)
components/
  brand/                Logo: Wordmark(SVG "LEAD AI LAB." — tone auto/light/dark, compact "LEAD."), Mark(파비콘형 마크), WordmarkText(HTML 타이포 워드마크)
  nav/                  SiteHeader, MobileMenu, SiteSearch, SubNav, Breadcrumb, SiteFooter,
                        TransitionProvider(페이지 전환 커튼), TransitionLink, BackToTop
  content/              Headers(Hero/PageHero/SectionHeader), Research(ResearchGrid — Home 연구 분야 카드 그리드 포함),
                        ResearchFeed(Home 최근 논문·연구 과제를 Publications/Projects 칩으로 전환), Projects, People, Alumni,
                        Publications, PublicationsBrowser, Books(BookGrid — 저역서 표지 카드), News, Timeline
  motion/               Reveal/SplitText, MediaFrame, Kinetic(NumberRoll/ScrollText/Marquee/FullBleed),
                        FieldLattice, GridOverlay(개발용 Shift+G)
  ui/                   Button/IconButton/TextLink/Roll, Icon, Modal, Controls(Tabs/FilterChips/Accordion/SearchField/TextField)
  forms/                ContactForm
lib/
  content.ts            데이터 로더·정렬·파생(뉴스 자동 생성 등; getJourney/getLabHistory 는 About 연구 여정 섹션 제거 후 미사용)
  search.ts             사이트 검색 인덱스
  motion/core.ts        WAAPI 래퍼, Spring, FLIP, reveal 프리셋 (prefers-reduced-motion 반영)
  motion/hooks.ts       useReveal, useScrollLink, useMagnetic, useTilt, useFocusTrap …
content/
  brand.ts              브랜드 설정의 타입·파생값(brand, brandApproved, wordmarkParts) — 모든 브랜드 문구의 진입점
  site.ts               대학·연락처·내비게이션·FAQ (labName/labNameEn 은 brand 에서 파생)
                        메뉴 순서: Home · About · Research(Areas/Publications/Projects/Presentations) · People · Books · News · Contact
                        — 헤더·푸터·모바일 메뉴가 모두 이 nav 배열을 읽으며, 활성 메뉴는 SiteHeader.activeNavId 가 경로로 계산(/publications 는 Research)
                        — children(하위 메뉴)은 데스크톱 드롭다운과 모바일 메뉴의 하위 바로가기(.lab-mmenu__sub)에 함께 표시
  profile.ts            지도교수 프로필
  research-areas.ts     연구 분야 5개 (provisional: true)
  types.ts              데이터 타입
  data/brand.json       브랜드 설정(명칭·워드마크·슬로건·소개문·LEAD 네 축·승인 상태) — 단일 출처
  data/*.json           publications, projects, career, members, news, lab-history
  DATA-NOTES.md         데이터 변환 메모·누락 항목·검토 필요 사항
scripts/
  build-tokens.mjs      design-system/tokens.json → styles/tokens.css
  check-data.mjs        데이터 무결성 검사
  clean.mjs             .next/·out/ 정리 (prebuild/predev 에서 자동 실행)
```

## 관리자 화면 (CMS)

소식·구성원·졸업생과 논문·저역서·학술발표·연구 과제는 코드 없이 **관리자 화면 `/admin`** 에서 고칠 수 있습니다 (배포본: `https://smu-edtech-lab.github.io/lead-ai-lab/admin`). 번호(종류별 최대 + 1)·연도·정렬값·과제 기간·`counts` 는 관리자 화면이 아래 표의 규칙대로 자동으로 맞춥니다.
연구실 저장소에 초대받은 GitHub 계정(Write 이상)으로 로그인하며, 편집자는 고친 뒤 바뀐 칸을 확인 창에서 보고 바로 게시합니다(관리자 승인 단계 없음, 모든 게시는 커밋 기록에 남음).
저장한 내용은 이 저장소의 `content/data/*.json`·`public/images/` 에 커밋되고, 1~2분 뒤 자동 배포됩니다.
편집자용 안내(입력 항목·저장 위치·권한과 계정·담당자 인수인계)는 **[docs/CMS-사용-안내.md](docs/CMS-사용-안내.md)**, 처음 설정(로그인 중계 서버·GitHub App)과 편집자 추가 방법은 **[docs/CMS-설정-안내.md](docs/CMS-설정-안내.md)**, 새 항목 종류를 CMS 에 붙이는 방법은 `lib/cms/collections.ts` 주석을 보세요.
`npm run dev` 로 띄운 개발 서버의 `/admin` 에는 실제 저장소를 건드리지 않는 체험 모드가 있습니다.

## 데이터 수정 방법 (컴포넌트 수정 불필요)

아래 표는 파일을 직접 고칠 때의 안내입니다. 소식·구성원·졸업생·논문·저역서·학술발표·연구 과제는 관리자 화면에서도 같은 형식으로 저장됩니다(연구 분야 명칭, 브랜드·교수 소개 문구 등은 아직 파일로만).

| 할 일 | 파일 | 비고 |
| --- | --- | --- |
| 논문·저역서·학술발표 추가 | `content/data/publications.json` `items[]` | `id` 는 종류별(`j`·`b`·`c`) **가장 큰 번호 + 1**(번호는 오래된 순, 2026-11-09 재부여 — 기존 번호는 바꾸지 않음). `type`(journal/book/conference), `date`(YYYY 또는 YYYY.MM), `areas`, `scope`(professor/lab). 논문은 `authors`(제1저자부터 쉼표 구분)·`doi`(확인된 것만)·`url`(DOI 가 없을 때 KCI 등 논문 페이지)도 입력. `counts` 도 함께 갱신 → `npm run check:data` |
| 연구 과제 추가 | `content/data/projects.json` | `id` 는 `p` + 가장 큰 번호 + 1. `startYear/endYear`, `status`(ongoing/completed), `summary`·`media` 는 선택 |
| 구성원 추가 | `content/data/members.json` `members[]` | `role`(phd 박사과정 / master 석사과정 / undergrad 학부생연구원 / researcher 연구원 / other), `slug`, People 목록은 박사과정을 따로, 석사과정과 학부생연구원을 '석사과정 / 학부생연구원' 한 묶음(같은 행)으로 표시(`lib/content.ts` `MEMBER_GROUPS`), `interests[]`, `photo` 없으면 중립 대체 면으로 표시. `nameEn` 이 있으면 프로필 이름 옆에 영문 이름을 작게 표시. `research[]`·`awards[]`·`history[]`(각 항목 `{ period, title, detail? }`)는 값이 있을 때만 프로필에 연구실적·수상경력·이력 섹션으로 표시. 네 목록(`projects[]` 포함) 모두 줄에 `"hidden": true` 를 넣으면(관리자 화면의 '사이트에 표시' 해제) 그 줄은 표시하지 않고, 표시할 줄이 없으면 섹션도 숨김 — 저장소가 공개라 숨긴 줄도 저장소에는 남음. `projects[]`(참여 연구 프로젝트)는 연구실 과제면 `{ projectId: "p01", role? }` 만 적으면 과제명·기간·지원 기관을 projects.json 에서 가져오고 Projects 페이지의 해당 과제로 연결, 연구실 과제가 아니면 `{ period, title, role?, detail? }` 를 직접 입력. 프로필에는 Research interests 가 있어 `areas` 는 화면에 표시하지 않음(값은 유지). 예시 구성원 2명(`isSample: true`)은 '예시' 배지와 함께 표시, 실제 명단 입력 후 삭제 |
| 졸업생 추가 | `content/data/members.json` `alumni[]` | `degree`(phd/master), `graduatedYear`. `nameEn`·`research[]`·`projects[]`·`awards[]`·`history[]` 는 구성원과 같은 방식으로 표시. 졸업생 프로필 정보는 Thesis · Degree(영문 표기만: `Ph.D. in Education (Educational Technology)` / `M.A. in Education (Educational Technology)`, 문구는 `lib/content.ts` `alumnusDegreeLabelsEn`) · Graduated · Affiliation(현재 소속 `affiliation`, 값이 있을 때만) 을 표시하고, `areas` 는 프로필에 표시하지 않음(값은 유지, 졸업생 목록에서는 계속 표시). 예시 졸업생 1명(`isSample: true`)은 '예시' 배지와 함께 표시, 실제 명단 입력 후 삭제 |
| 소식 추가 | `content/data/news.json` `items[]` | `category`(notice/conference/publication/award/event/member), `date` ISO, `body[]`. 예시 항목(`isSample: true`) 4건(세미나·회식·환영 모임·워크숍)은 '예시' 배지와 함께 표시, 실제 소식 입력 후 삭제. 이 파일의 항목이 Home 'Latest from the lab' 에 나옴 |
| 연구실 연혁 | `content/data/lab-history.json` | 현재 화면에 표시하지 않음 (About 의 연구 여정 섹션을 뺐음). 로더만 남아 있어 다시 쓸 수 있음 |
| 저역서 표지 | `content/data/publications.json` book 항목의 `cover`(public/ 기준 경로)·`coverAlt` | 확인된 표지 파일만 입력. 없으면 /books 에서 중립 placeholder |
| 논문 초록 이미지 | 이미지 파일은 `public/images/abstracts/<논문 id>.jpg`, journal 항목에 `abstractImage`(예: `"/images/abstracts/j59.jpg"`) | 연구실이 준 초록 캡처만. 있으면 논문 목록에서 제목이나 'Abstract 초록 보기' 버튼을 누를 때 이미지 창이 열리고(원문·DOI 는 창 아래 버튼), + 버튼으로 펼친 상세 칸 맨 위에도 같은 이미지가 나옴(처음 펼칠 때 불러옴), 없으면 제목은 원래대로 DOI·논문 페이지 링크. `npm run check:data` 가 파일이 있는지 확인 |
| 저역서 구매 링크 | 같은 book 항목의 `purchaseUrl` | 연구실이 알려 준 서점 상품 페이지 주소만 입력. 있으면 /books 에서 표지를 누를 때 새 창으로 열림, 없으면 표지는 링크가 아님 |
| 연구 분야 명칭·설명 | `content/research-areas.ts` | 확정 후 `provisional: false` 로 바꾸면 ‘임시 분류’ 안내가 사라짐 |
| 브랜드 명칭·슬로건·소개문·비전 축 | `content/data/brand.json` | `name`/`wordmark`/`nameKo`/`meaning`/`tagline`/`sloganKo`/`intro[]`/`pillars[]`. 헤더·푸터·히어로·커튼·SEO·OG 가 모두 여기서 읽음. 승인되면 `meta.status` 를 `"approved"` 로 |
| 이메일·주소 | `content/site.ts` | `email`, `address.street` (연구실 명칭은 brand.json 에서 파생) |
| 교수 소개문·영문명·링크 | `content/profile.ts` | `bio`, `nameEn`, `links[]` |

뉴스 목록에는 `news.json` 의 수동 항목 외에, 최근 2년 논문·경력에서 자동 파생된 ‘실적 기반’ 항목이 함께 표시됩니다(`lib/content.ts` `derivedNews`). 원하지 않으면 해당 함수 호출을 제거하세요.

## 정직성 규칙 (구현에 반영됨)

- 확인되지 않은 정보는 `[대괄호]` placeholder 로 표시하고 임의로 채우지 않음 (연구실 명칭, 이메일, 도로명 주소, 면담 시간, 소개문).
- 실제 인물 사진이 없으면 중립 대체 면, 구성원 명단이 없으면 '준비하고 있습니다' 빈 상태(가상 인물 생성 금지). 연구실이 직접 제공한 가상 인물 사진으로 만든 예시 구성원·졸업생은 ‘예시’ 배지를 붙여 공개 화면에 표시하되 색인·sitemap 에서는 제외(2026-11-06 연구실 결정). 예시 소식(연구실 세미나·회식 등)도 ‘예시’ 배지와 함께 표시(2026-11-09 연구실 요청, 상세는 noindex·sitemap 제외).
- 방문자 화면에는 개발 과정 설명(임시 분류, 데이터 출처·기준일, 확인 후 게시, 브랜드 제안안, 자동 생성 안내)을 두지 않는다. 미확정 값(이메일·도로명 주소·면담 시간·지도교수 소개문)은 임의로 채우지 않고 해당 줄을 숨긴다. 문의 폼은 '온라인 접수 준비 중'으로 안내하고 전송 완료로 표시하지 않는다.
- 논문(journal)의 저자·DOI·URL 은 연구실 검증표 「이현우_교수_논문_저자.xlsx」(2026-11-06, 1차)에서 가져와 표시 — 61편 저자, 38편 DOI(2026-11-09 연구실 확인으로 j51 DOI 추가 — 현재 39편), DOI 가 없는 21편은 KCI·RISS 등 논문 페이지 링크, 미검증 1편(j27)은 비움. DOI 가 확인되지 않은 항목의 DOI 는 임의로 채우지 않음. 권·호·페이지와 학술발표의 저자·DOI 는 자료가 없어 표시하지 않음. 저역서는 확인된 `authors` 가 있을 때만 /books 카드에 한 줄 표시(현재 b03 『상명학습전략』을 뺀 8권).
- 교수 개인 실적(`scope: professor`)과 연구실 공동 실적(`scope: lab`)을 데이터에서 구분. 현재 데이터는 모두 교수 개인 실적. 논문 목록 + 상세 칸의 '귀속' 줄은 연구실 요청(2026-11-09)으로 화면에서 뺐음(데이터의 `scope` 는 유지).
- 뉴스의 예시 항목은 ‘예시’ 배지로 구분. 논문·저역서에서 자동 생성한 소식은 /news 에만 표시하고, 경력(보임) 소식은 만들지 않음.
- Contact 폼은 전송 서버가 연결되어 있지 않으며, 전송 완료로 표시하지 않음. 연결 방법: `ContactForm` 의 `onSubmit` prop 에 Formspree/서버리스 함수 등을 넘기면 로딩·완료·오류 상태가 작동합니다.

## 접근성·모션

- 모든 애니메이션은 `prefers-reduced-motion` 에서 즉시 완료 상태로 표시(`lib/motion/core.ts` `motion.animate`).
- 스크롤 reveal 은 JS 활성 시에만 숨김 처리되며(`html.lab-js`) 2.5초 후 강제 표시되는 안전장치가 있습니다.
- 스킵 링크, 포커스 트랩(모바일 메뉴·모달), `aria-current`, 키보드로 접근 가능한 필터·아코디언·탭.
