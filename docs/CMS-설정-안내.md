# 관리자 화면(CMS) 설정 안내

연구실 홈페이지의 관리자 화면(`/admin`)을 처음 켜거나, 저장소 관리를 다른 사람에게 넘길 때 보는 문서입니다.
한 번 설정해 두면 이후에는 아래 **8. 편집자 추가·제거** 만 하면 됩니다.

- 관리자 화면 주소: `https://smu-edtech-lab.github.io/lead-ai-lab/admin` (저장소를 옮기면 주소가 바뀝니다)
- 저장소: `https://github.com/smu-edtech-lab/lead-ai-lab` — 연구실 GitHub 조직 `smu-edtech-lab` 소유 (2026-11-10 개인 계정에서 옮김)
- 지금 편집할 수 있는 것: **소식·구성원·졸업생**, **논문·저역서·학술발표·연구 과제** (사이트 문구·디자인·레이아웃은 다음 단계)
- 편집자가 보는 안내(메뉴별 입력 칸·사진 규격·저장 위치·권한과 계정·인수인계 체크리스트): **[CMS-사용-안내.md](CMS-사용-안내.md)**

### 지금 설정된 값 (2026-11-14, 2~6단계 완료)

| 항목 | 값 |
|---|---|
| 로그인 중계 서버 (Cloudflare Worker) | `lead-ai-lab-cms-auth` — `https://lead-ai-lab-cms-auth.mgjang724.workers.dev` (홈페이지 담당자의 개인 Cloudflare 계정. 담당자가 바뀌면 Cloudflare **Members** 로 새 담당자를 초대하거나 새 계정에 다시 만듦) |
| GitHub App | `LEAD AI Lab CMS` (조직 `smu-edtech-lab` 소유, Client ID `Iv23lipHaxk3hV4jTvY8` — 공개해도 되는 값) |
| App 설치 범위 | `smu-edtech-lab/lead-ai-lab` 저장소 하나 |
| Worker 변수 | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`(Secret), `ALLOWED_RETURN_URLS` |
| 저장소 변수 | `CMS_AUTH_URL` = 위 Worker 주소 |

---

## 0. 한눈에 보기

```
관리자 화면(/admin, 브라우저)
   │  GitHub 계정으로 로그인 ── 로그인 중계 서버(Cloudflare Worker, cms-auth/worker.js)
   │
   └─ 편집자가 고침 → '확인하고 게시' → 바뀐 칸 확인 창 → 게시하기 ─▶ GitHub 저장소 main 에 커밋
                                                                          │
                               GitHub Actions(deploy.yml)가 데이터 검사 → 사이트 빌드 → GitHub Pages 배포 (1~2분)
```

- **데이터는 GitHub 저장소 안의 파일에 저장됩니다.** 별도 데이터베이스는 없습니다.

  | 메뉴 | 파일 | 사진 |
  |---|---|---|
  | 소식 | `content/data/news.json` | `public/images/news/` |
  | 구성원·졸업생 | `content/data/members.json` | `public/images/people/` |
  | 논문·저역서·학술발표 | `content/data/publications.json` (한 파일에 `type` 으로 구분) | 표지 `public/images/books/`, 초록 이미지 `public/images/abstracts/` |
  | 연구 과제 | `content/data/projects.json` | `public/images/projects/` |

- **번호·합계는 자동입니다.** 논문(j)·저역서(b)·학술발표(c)·연구 과제(p)는 게시할 때 종류별 가장 큰 번호 + 1 이 붙고(예: j62 다음은 j63),
  날짜에서 연도·정렬값을, 과제는 시작·종료에서 기간 표기를 계산하며, `publications.json` 의 종류별 건수(`counts`)도 함께 맞춥니다.
  날짜를 모르면 비워 두면 `—`(연도 미상)로 저장됩니다. 최근 논문·저역서는 News 에 ‘연구 성과’ 소식으로도 자동으로 나옵니다.
- **저장소는 공개 상태입니다.** 올린 글·사진은 누구나 볼 수 있고, 지워도 변경 기록에는 남습니다. 게시에 동의한 내용만 올립니다.
- **누가 무엇을 할 수 있는지는 GitHub 저장소 권한으로 정해집니다.** 관리자 화면이 따로 회원 명단을 갖고 있지 않습니다.

| GitHub 저장소 권한 | 관리자 화면에서 할 수 있는 일 |
|---|---|
| Write 이상 (협업자, Maintain, Admin, 저장소 소유자) | **편집자** — 고친 뒤 바뀐 칸을 확인하고 바로 게시 (승인 단계 없음) |
| 그 밖 | 들어갈 수 없음 |

관리자 승인 단계는 두지 않았습니다(2026-11-10 연구실 결정). 대신 게시 직전에 바뀌는 칸을 이전 값과 나란히 보여 주고,
누가 언제 무엇을 게시했는지 저장소의 변경 기록(Commits)에 모두 남으며, 언제든 다시 고치거나 되돌릴 수 있습니다.
편집자를 초대·제거하는 일만 저장소 소유자(또는 Admin)가 GitHub 설정에서 합니다.

## 1. 준비물

- 저장소 소유자의 GitHub 계정
- Cloudflare 계정 1개 — **개인 계정보다 연구실 공용 이메일로 만드는 것을 권합니다** (담당자가 바뀌어도 넘겨줄 수 있도록). 무료 플랜으로 충분합니다.

설정 순서: **2. 중계 서버 만들기 → 3. GitHub App 만들기 → 4. 중계 서버에 값 넣기 → 5. 저장소에 중계 서버 주소 넣기 → 6. 다시 배포 → 7. 로그인 확인**

## 2. 로그인 중계 서버 만들기 (Cloudflare Worker)

1. <https://dash.cloudflare.com> 에 로그인 → 왼쪽 **Workers & Pages** → **Create application** → **Start with Hello World!**
2. Worker name 을 `lead-ai-lab-cms-auth` 로 적고 (**Protect with Cloudflare Access** 는 꺼 둔 채) **Deploy**
3. 오른쪽 위 **Edit code** 를 눌러 기본 코드를 모두 지우고, 저장소의 `cms-auth/worker.js` 내용을 그대로 붙여 넣은 뒤 **Deploy**
4. 화면 위쪽에 보이는 Worker 주소를 적어 둡니다. 예: `https://lead-ai-lab-cms-auth.<계정이름>.workers.dev`
   이 주소를 브라우저로 열면 "로그인 중계 서버입니다" 라는 문장이 보여야 합니다.

## 3. GitHub App 만들기

GitHub App 은 관리자 화면이 "이 저장소의 콘텐츠만" 고칠 수 있도록 권한을 좁혀 주는 장치입니다.

1. 조직 페이지 `https://github.com/smu-edtech-lab` → **Settings** → 왼쪽 맨 아래 **Developer settings** → **GitHub Apps** → **New GitHub App**
   - 개인 계정의 Settings 가 아니라 **조직의 Settings** 에서 만듭니다. 그래야 담당자가 바뀌어도 App 을 따로 넘길 필요가 없습니다.
2. 아래처럼 채웁니다.

| 칸 | 값 |
|---|---|
| GitHub App name | `LEAD AI Lab CMS` (이미 있는 이름이면 뒤에 계정 이름을 붙임) |
| Homepage URL | 사이트 주소 `https://smu-edtech-lab.github.io/lead-ai-lab/` |
| Callback URL | 2단계 Worker 주소 + `/callback` 예: `https://lead-ai-lab-cms-auth.<계정이름>.workers.dev/callback` |
| Expire user authorization tokens | **체크 유지** (로그인이 8시간 뒤 자동 만료) |
| Request user authorization (OAuth) during installation | 체크 해제 |
| Webhook › Active | **체크 해제** |
| Repository permissions › Contents | **Read and write** |
| Repository permissions › Pull requests | **Read and write** (누가 main 에 'Pull Request 필수' 규칙을 켜 두었을 때만 쓰임) |
| Repository permissions › Actions | **Read-only** (사이트 반영 상태 표시용) |
| Where can this GitHub App be installed? | **Only on this account** |

3. **Create GitHub App** → 만들어진 App 설정 페이지에서
   - **General** 화면의 **Client ID** 를 복사해 둡니다 (공개해도 되는 값).
   - 왼쪽 **Credentials** → **Client secrets** → **New secret** 을 눌러 나온 값을 복사합니다. 다시 볼 수 없으니 바로 4단계에 넣습니다.
   - 같은 화면 **Key pairs** → **New key** 로 private key 를 하나 만듭니다. GitHub 이 App 을 설치하려면 키가 하나 있어야 한다고 요구하기 때문입니다.
     관리자 화면은 이 키를 쓰지 않으므로, 내려받아진 `.pem` 파일은 **바로 지웁니다** (저장소·Dropbox 에 넣지 않음).
4. 왼쪽 **Install App** → 계정 옆 **Install** → **Only select repositories** → `lead-ai-lab` 선택 → **Install**

## 4. 중계 서버에 값 넣기

Cloudflare → Workers & Pages → `lead-ai-lab-cms-auth` → **Settings** → **Variables and secrets** → **Add variable** (Key·Value 를 적고, 비밀값은 **Secret** 체크 → **Add variable and deploy**)

| 이름 | 종류 | 값 |
|---|---|---|
| `GITHUB_CLIENT_ID` | Text | 3단계의 Client ID |
| `GITHUB_CLIENT_SECRET` | **Secret** | 3단계의 client secret |
| `ALLOWED_RETURN_URLS` | Text | `https://smu-edtech-lab.github.io/lead-ai-lab/admin,http://localhost:3000/admin` |

저장(**Deploy**)합니다. `ALLOWED_RETURN_URLS` 에 없는 주소로는 로그인 결과를 돌려보내지 않으므로, 사이트 주소가 바뀌면 여기도 바꿔야 합니다.

## 5. 저장소에 중계 서버 주소 넣기

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions** → **Variables** 탭 → **New repository variable**

- Name: `CMS_AUTH_URL`
- Value: 2단계의 Worker 주소 (끝에 `/` 없이) 예: `https://lead-ai-lab-cms-auth.<계정이름>.workers.dev`

## 6. 다시 배포

저장소 → **Actions** → **Deploy to GitHub Pages** → **Run workflow** → **Run workflow**. 초록색 체크가 뜨면 완료(1~2분).

## 7. 로그인 확인

1. `https://smu-edtech-lab.github.io/lead-ai-lab/admin` 접속 → **GitHub 계정으로 로그인**
2. GitHub 가 "LEAD AI Lab CMS 가 계정에 접근하려 합니다" 를 물으면 **Authorize**
3. 관리자 화면 위쪽에 내 이름이 보이고 왼쪽 메뉴(소식·사람 / 연구 실적)가 열리면 끝입니다.

## 8. 편집자 추가·제거 (사람이 바뀔 때마다)

1. 추가할 사람에게 GitHub 계정을 만들어 아이디를 알려 달라고 합니다 (무료).
2. 저장소 → **Settings** → **Collaborators and teams** → **Add people** → 아이디 입력 → 역할 **Write**
   - 편집자 초대·제거를 함께 맡을 사람은 조직 페이지 → **People** → **Invite member** 에서 **Owner** 로 초대합니다 (소유자는 2명 이상 권장)
3. 초대받은 사람이 **메일의 초대를 수락**해야 로그인할 수 있습니다.
4. 졸업 등으로 빠지는 사람은 같은 화면에서 **Remove** 합니다.

## 9. (권장) 변경 기록 보호 규칙

누구도 main 의 변경 기록을 지우거나 덮어쓰지 못하게 해, 언제든 이전 상태로 되돌릴 수 있도록 합니다.

저장소 → **Settings** → **Rules** → **Rulesets** → **New ruleset** → **New branch ruleset**

- Ruleset name: `main 기록 보호`, Enforcement status: **Active**
- Target branches → **Add target** → **Include default branch**
- Rules: **Restrict deletions**, **Block force pushes** 두 가지만 켭니다

'Require a pull request before merging' 은 켤 필요가 없습니다(승인 단계를 두지 않기로 했으므로). 혹시 켜져 있어도 관리자 화면은
Pull Request 를 만들어 곧바로 병합하는 방식으로 그대로 게시합니다.
공개 저장소는 무료로 쓸 수 있고, 비공개 저장소는 GitHub 유료 플랜이 필요합니다.

또 **Settings** → **Environments** → **github-pages** → **Deployment branches and tags** 가 `main` 만 허용하는지 확인합니다. 다른 브랜치의 내용으로 사이트가 배포되지 않게 하는 설정입니다.

## 10. 비상용: 토큰으로 로그인

중계 서버가 아직 없거나 고장 났을 때 관리자 화면의 **토큰으로 로그인** 을 씁니다.

GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**

- Repository access: **Only select repositories** → `lead-ai-lab`
- Repository permissions: **Contents** Read and write, **Pull requests** Read and write, **Actions** Read-only
- Expiration: 짧게 (예: 7일)

만든 토큰을 관리자 화면에 붙여 넣습니다. 토큰은 그 브라우저 탭에만 보관되고 탭을 닫으면 지워집니다. 토큰을 다른 사람에게 보내거나 문서에 적지 마세요.

## 11. 저장소를 다른 곳으로 옮길 때

2026-11-10 개인 계정 `mgjang724-hub` 에서 조직 `smu-edtech-lab` 으로 한 번 옮겼습니다. 다시 옮길 때(저장소 → **Settings** → 맨 아래 **Transfer**)는 아래를 함께 합니다.

- **사이트 주소가 바뀝니다** (`https://<새 소유자>.github.io/lead-ai-lab/`). GitHub 은 저장소 주소는 새 위치로 넘겨주지만 **사이트 주소(github.io)는 넘겨주지 않아** 옛 주소는 열리지 않습니다.

1. GitHub App 을 새 소유자에게 설치 (3단계 4번) — 또는 새 소유자 소유로 App 을 새로 만들기
2. Worker 의 `ALLOWED_RETURN_URLS` 를 새 관리자 화면 주소로 (`https://<조직이름>.github.io/lead-ai-lab/admin`)
3. 저장소 변수 `CMS_AUTH_URL` 이 그대로 있는지 확인 → 6단계 다시 배포
4. 이 PC 의 저장소 연결 주소 바꾸기: `git remote set-url origin https://github.com/<조직이름>/lead-ai-lab.git`

저장소 이름은 배포할 때 자동으로 읽으므로 코드는 고칠 필요가 없습니다.

## 12. 문제가 생겼을 때

| 증상 | 확인할 것 |
|---|---|
| "이 저장소를 고칠 권한이 없습니다" | 8단계 초대를 받았는지, 초대 메일에서 수락했는지 |
| "허용되지 않은 관리자 화면 주소" | 4단계 `ALLOWED_RETURN_URLS` 에 지금 주소가 있는지 |
| 로그인 버튼이 없고 "설정되지 않았습니다" | 5단계 `CMS_AUTH_URL` 변수 → 6단계 다시 배포 |
| "로그인이 만료되었습니다" | 8시간이 지나면 자동 만료 — 다시 로그인. 쓰던 내용은 브라우저에 임시 저장되어 있음 |
| 위쪽에 "사이트 반영 실패" | 그 표시를 누르면 GitHub Actions 기록이 열립니다. `Check data` 단계가 실패했다면 메시지에 문제 항목이 나옵니다. 실패해도 공개 사이트는 이전 상태 그대로입니다 |
| 실수로 잘못 게시했다 | 관리자 화면에서 다시 고쳐 게시하면 됩니다. 이전 내용은 저장소 → **Commits** 에서 `[CMS]` 로 시작하는 기록을 눌러 확인할 수 있습니다 |
| "다른 사람이 같은 칸을 먼저 수정했습니다" | 두 사람이 같은 항목의 같은 칸을 동시에 고친 경우입니다. 다른 칸끼리는 자동으로 합쳐집니다. ‘최신 내용 불러오기’ 또는 ‘내 내용으로 덮어쓰기’ 중 하나를 고릅니다 |

## 13. 개발용: 체험 모드

이 PC 에서 `npm run dev` 로 개발 서버를 띄운 뒤 `http://localhost:3000/admin` 에 들어가면 **체험 모드** 버튼이 보입니다.
브라우저 탭 안의 가짜 저장소로 편집·확인·게시를 끝까지 시험할 수 있고, 실제 저장소와 사이트는 바뀌지 않습니다.
배포된 사이트에는 체험 모드가 들어가지 않습니다.

## 파일 위치 (개발자용)

| 파일 | 하는 일 |
|---|---|
| `app/admin/page.tsx` | 관리자 화면 주소 |
| `components/cms/` | 화면 (로그인, 목록, 편집, 게시 전 확인 창) |
| `lib/cms/collections.ts` | **편집할 항목과 입력 칸 정의** — 새 항목 종류는 여기에 추가 (자동 번호 `autoKey`, 자동 계산 `derive`, 종류 나누기 `match`, 파일 합계 `fileHooks`) |
| `lib/cms/engine.ts` | 게시 처리 (최신 내용에 다시 적용·칸 단위 병합·충돌 확인) |
| `lib/cms/github.ts` | GitHub API 연결 |
| `lib/cms/validate.ts` | 입력 검사 (`scripts/check-data.mjs` 와 같은 규칙) |
| `cms-auth/worker.js` | 로그인 중계 서버 |
| `styles/admin.css` | 관리자 화면 스타일 |
