<div align="center">

# 🛡️ .env Guardian

**무료 · 로컬 우선 · AI 시대를 위한 시크릿 스캐너**

코드에 박혀버린 API 키, 브라우저로 새어나가는 `VITE_OPENAI_API_KEY`,
`.env` 파일과 GitHub 공개 저장소까지 — 한 번에 점검하고 안전하게 리팩터링합니다.

[빠른 시작](#-빠른-시작) · [주요 기능](#-주요-기능) · [작동 방식](#-어떻게-작동하나요) · [개인정보](#-개인정보-원칙) · [기여하기](#-기여하기)

<img width="1497" height="1276" alt="env1" src="https://github.com/user-attachments/assets/db7ba885-3d78-4eb2-a838-e99d2e7bcfc5" />

</div>

---

## 한 줄 요약

> **로컬 폴더**나 **공개 GitHub URL**을 넣으면 → 노출된 시크릿을 잡고, 어디서 쓰이는지 추적하고,
> 보안 점수(A+~F)를 매기고, 서버 사이드 프록시로 옮기는 패치 파일까지 만들어주는 **무료 도구**입니다.

OpenAI · Anthropic 같은 **유료 API를 일절 호출하지 않습니다.** 모든 분석은 여러분 컴퓨터 안에서만 일어나요.
학생, 인디 해커, 오픈소스 메인테이너를 위해 설계됐습니다.

---

## 🚀 빠른 시작

### 1. 사전 요구 사항

| 도구 | 버전 |
| --- | --- |
| Node.js | 20 이상 (권장 22) |
| npm | 10 이상 |
| Git | 2.40 이상 (GitHub URL 스캔용) |

### API 키는 저장소에 없습니다

이 프로젝트는 **어떤 제3자 API 키도 커밋하지 않습니다.**  
`examples/insecure-app` 데모를 풍부하게 쓰려면 해당 폴더에서 `.env.example`을 복사해 `.env`로 만든 뒤, **본인이 발급·폐기 가능한 테스트 키만** 직접 붙여 넣으세요. (`.env`는 Git에 올리지 마세요.)  
저장소·이슈: [github.com/selfaslab/goo-260511-env](https://github.com/selfaslab/goo-260511-env)

### 2. 설치 & 실행

```bash
# 백엔드와 프론트엔드 의존성 설치
npm --prefix server install
npm --prefix client install

# 두 개의 터미널에서 각각 실행
npm --prefix server run dev    # → http://127.0.0.1:5174  (Express API)
npm --prefix client run dev    # → http://localhost:5173  (대시보드 UI)
```

### 3. 사용

브라우저에서 **<http://localhost:5173>** 열기. 그 다음 둘 중 하나:

- **로컬 폴더** 탭 → 절대경로 붙여넣기 (예: `c:\code\my-app`) → `Scan folder`
- **GitHub URL** 탭 → 공개 저장소 URL 붙여넣기 (예: `https://github.com/expressjs/express`) → `Scan repository`

스캔이 끝나면 점수 카드 · 발견 목록 · 의존성 트리 · 리팩터링 미리보기까지 한 화면에 나옵니다.

> 💡 **처음이라면 번들된 예제부터:** `examples/insecure-app` 폴더를 스캔해 보세요.
> 위험한 패턴이 들어간 데모이며, **시크릿 값은 커밋되어 있지 않습니다.** `.env.example` → `.env` 복사 후 로컬에서만 키를 넣으면 스캔 결과가 더 풍부해집니다.

---
<img width="1479" height="1033" alt="env2" src="https://github.com/user-attachments/assets/45ca7b44-33fe-4798-bf26-89f0753ed5ce" />
## ✨ 주요 기능

### Phase 1 — 로컬 시크릿 스캐너

| 기능 | 설명 |
| --- | --- |
| 🔎 **시크릿 탐지** | 정규식 + Babel AST로 `.env` · `.ts/.tsx/.js/.jsx` · `.json` 등 검사 |
| 🌳 **의존성 추적** | `process.env.X` / `import.meta.env.X` 가 어떤 파일에서 읽히는지 그래프로 표시 |
| 🎯 **위험도 분류** | `LOW` → `MEDIUM` → `HIGH` → `CRITICAL` 4단계 자동 판정 |
| 🩹 **안전한 리팩터링 생성** | Express 프록시 라우트 + 클라이언트 호출 코드 자동 작성 |
| 💾 **패치 내보내기** | 모든 변경을 `guardian.patch.json` 한 파일로 다운로드 |

### Phase 2 — GitHub 무료 보안 감사

| 기능 | 설명 |
| --- | --- |
| 🐙 **공개 GitHub URL 스캔** | 임시 폴더에 얕은 복제(`--depth=1`) 후 스캔, 끝나면 **자동 삭제** |
| ⏱️ **안전 가드** | 60초 타임아웃 · 최대 500MB · 최대 5만 파일 |
| 🧠 **프레임워크 자동 감지** | React · Vite · Next.js · Remix · Node · Express · Python · Django · Flask · Firebase · Supabase · Docker · GitHub Actions · Terraform · Vercel · Netlify |
| 🛡️ **확장된 시크릿 패턴** | OpenAI · Anthropic · Gemini · GitHub PAT · AWS · Stripe · Firebase · Supabase · Discord · Slack · Telegram · Twilio · GCP 서비스 계정 · RSA · OpenSSH · Bearer 토큰 · MongoDB / Postgres / MySQL URI |
| 🧰 **위험 설정 탐지** | GitHub Actions에서 시크릿을 `echo`하는 단계, `pull_request_target` 사용, `docker-compose`/`terraform`/`vercel.json`/`netlify.toml`/`Dockerfile`에 박힌 자격 증명 |
| 🅰️ **A+~F 등급 + 사유** | 패널티(시크릿 노출)와 보너스(`.gitignore` · `.env.example` · 시크릿 매니저)까지 사유와 함께 표시 |
| 📥 **리포트 내보내기** | `JSON` · `Markdown` · `TXT` 3가지 포맷 다운로드 |

### 일부러 **하지 않는 것들**

- ❌ 유료 API 호출 (OpenAI · Anthropic · Gemini 모두 사용 안 함)
- ❌ 텔레메트리 · 트래킹 픽셀 · 분석 도구
- ❌ 코드나 시크릿을 외부 서버에 저장
- ❌ 회원가입 · 로그인 — **계정 자체가 없습니다**

---

## 📊 점수 산정 방식

기준 점수 **100**에서 다음을 더하고 빼서 최종 점수를 계산합니다.

### 패널티 (마이너스)

| 상황 | 차감 |
| --- | --- |
| `.env`에만 존재하고 어디서도 안 쓰임 | `LOW` − 2 |
| 서버 코드에서 `process.env`로 읽음 | `MEDIUM` − 5 |
| 클라이언트 코드에서 읽음 | `HIGH` − 10 |
| 변수명이 `VITE_` · `NEXT_PUBLIC_` 등으로 시작 | `CRITICAL` − 20 |
| 소스 파일에 시크릿이 **하드코딩** | `CRITICAL` − 20 |

### 보너스 (플러스)

| 조건 | 가점 |
| --- | --- |
| 클라이언트 번들에 시크릿이 하나도 없음 | + 5 |
| `.gitignore` 존재 | + 3 |
| `.env.example` 존재 | + 5 |
| 시크릿 매니저 의존성 (`@aws-sdk/client-secrets-manager`, `@google-cloud/secret-manager`, Doppler, Vault, Vercel Edge Config 등) 사용 | + 10 |

### 등급 매핑

| 점수 | 등급 | 의미 |
| --- | --- | --- |
| 95 ~ 100 | **A+** | 배포해도 좋음 |
| 85 ~ 94 | **A** | 매우 좋음 |
| 70 ~ 84 | **B** | 양호 |
| 55 ~ 69 | **C** | 개선 필요 |
| 40 ~ 54 | **D** | 위험 |
| 0 ~ 39 | **F** | 즉시 조치 필요 |

> 💯 점수 = `clamp(100 − Σ패널티 + Σ보너스, 0, 100)`

---

## 🔐 어떻게 작동하나요?

### 로컬 폴더 스캔

```
브라우저  ── POST /api/scan ──▶  Express 서버
              { projectPath }              │
                                           ▼
                              ┌──────────────────────────────┐
                              │ 1. fast-glob으로 파일 탐색    │
                              │    (.gitignore + 제외 폴더)   │
                              │ 2. 정규식 + Babel/ts-morph    │
                              │    AST로 시크릿 검출           │
                              │ 3. process.env / import.meta  │
                              │    .env 사용처를 그래프로 추적 │
                              │ 4. 프레임워크 / 위험 설정 감지 │
                              │ 5. 점수 + 추천사항 계산        │
                              └──────────────┬───────────────┘
                                             │  마스킹된 JSON
                                             ▼
                                          대시보드
```

### GitHub URL 스캔

```
브라우저 ─ POST /api/scan/github ──▶  Express 서버
              { repoUrl }                  │
                              parseGithubUrl() — github.com 화이트리스트
                                           │
                                           ▼
                              ┌──────────────────────────────┐
                              │ simple-git clone              │
                              │ --depth=1 --no-tags           │
                              │ --filter=blob:none            │
                              │ timeout 60초                  │
                              └──────────────┬───────────────┘
                                             │
                              크기/파일수 가드 (500MB · 5만개 이하)
                                             ▼
                                  ↳ 위와 동일한 스캔 파이프라인
                                             ▼
                              ┌──────────────────────────────┐
                              │ rm -rf TEMP_DIR  (반드시 실행)│
                              │ try/finally 블록              │
                              └──────────────┬───────────────┘
                                             │ JSON
                                             ▼
                                          대시보드
```

임시 클론은 `os.tmpdir()/guardian-scan-XXXXXX/` 아래에 생기고,
스캔이 실패하더라도 `finally`에서 무조건 정리됩니다.
응답이 끝나면 클론은 디스크에 남지 않습니다.

---

## 🔒 개인정보 원칙

1. **로컬 우선.** 분석은 여러분의 Node.js 프로세스 안에서만 일어납니다.
   브라우저는 폴더 경로(또는 공개 GitHub URL)만 서버로 보냅니다.
2. **모든 시크릿은 마스킹.** 탐지된 값은 스캐너 경계를 넘기 전에 `head****tail` 형태로 잘라냅니다.
   원래 값은 브라우저 · `guardian.patch.json` · 리포트 어디에도 들어가지 않습니다.
3. **클론은 반드시 삭제.** GitHub 스캔의 임시 폴더는 `finally` 블록에서 정리되며 절대 보관하지 않습니다.
4. **외부 통신 없음.** Git clone 외에는 어떤 외부 호출도 하지 않습니다.
   텔레메트리도, LLM 호출도 없습니다 → 에어갭 환경에서도 로컬 스캔이 가능합니다.

---
<img width="1504" height="1099" alt="env3" src="https://github.com/user-attachments/assets/26bb2b9a-05de-49f3-ab41-82da11133da0" />

## 📡 API

모든 엔드포인트는 `/api` 아래 마운트되며 `zod`로 검증됩니다.

| 메서드 | 경로 | 본문/쿼리 | 응답 |
| --- | --- | --- | --- |
| `GET`  | `/api/health` | — | `{ status: "ok", … }` |
| `POST` | `/api/scan` | `{ projectPath }` | `ScanResult` |
| `POST` | `/api/scan/github` | `{ repoUrl }` | `ScanResult` |
| `GET`  | `/api/report` | `?projectPath=…` | 캐시된 `ScanResult` |
| `GET`  | `/api/report/export` | `?format=json\|markdown\|txt&download=true` | 리포트 파일 |
| `POST` | `/api/refactor` | `{ finding, currentCode? }` | `RefactorResult` |
| `POST` | `/api/refactor/export` | `{ projectPath? }` | `guardian.patch.json` |

---

## 🧪 추천 테스트 저장소

| 저장소 | 기대 결과 |
| --- | --- |
| `https://github.com/octocat/Hello-World` | 빈 저장소 → A+ 기준점 확인 |
| `https://github.com/expressjs/express` | 실제 OSS — 프레임워크(Node + GitHub Actions) 자동 감지, A+ |
| 번들된 `examples/insecure-app` (로컬 스캔) | 6가지 탐지 카테고리 전부 발화 + 리팩터링 diff 미리보기 |

---

## 📁 프로젝트 구조

```
.
├── client/                    Vite + React + TS 대시보드
│   ├── src/
│   │   ├── components/        UI · dashboard · scanner · report · diff
│   │   ├── hooks/             useScanRunner · usePatchExport · useReportExport
│   │   ├── pages/             DashboardPage
│   │   ├── services/          api/  scan/  (파일시스템 접근 금지)
│   │   ├── store/             Zustand 전역 상태
│   │   ├── types/             서버 계약을 미러링
│   │   ├── constants/         색상 · 라벨
│   │   └── utils/             cn(), download(), …
│   └── package.json
│
├── server/                    Express + ts-morph + Babel + simple-git
│   ├── src/
│   │   ├── scanner/           regex · ast · dependencyTrace · risk · env · framework · config
│   │   ├── refactor/          secureRefactor · patchGenerator · promptBuilder
│   │   ├── routes/            scan · github · report · refactor (zod 검증)
│   │   ├── services/          scanService · githubCloneService · reportService
│   │   ├── types/             타입 단일 출처
│   │   ├── constants/         패턴 · 제외 폴더 · 접두사
│   │   ├── utils/             fs, mask
│   │   └── index.ts
│   └── package.json
│
├── examples/
│   ├── insecure-app/          의도적으로 위험한 데모 프로젝트
│   └── guardian.patch.json    샘플 패치
│
├── LICENSE                    MIT
├── CONTRIBUTING.md            패턴 · 프레임워크 추가 가이드
├── CODE_OF_CONDUCT.md         Contributor Covenant 2.1
└── README.md
```

---

## 🛠️ 빌드 & 배포

```bash
# 프로덕션 빌드 (서버 + 클라이언트)
npm --prefix server run build && npm --prefix server start
npm --prefix client run build && npm --prefix client run preview
```

빌드 결과:

- 서버: `server/dist/index.js` — Node.js 22 환경에서 그대로 실행
- 클라이언트: `client/dist/` — 정적 파일이라 Vercel · Netlify · Cloudflare Pages · GitHub Pages 등 어디든 배포 가능

> ⚠️ 클라이언트가 호출하는 `/api/*`는 동일 도메인의 백엔드를 가정합니다.
> 두 도메인이 다르다면 리버스 프록시 또는 `vite.config.ts`의 `proxy` 설정을 조정하세요.

---

## ⚠️ 알려진 한계

- 브라우저 보안 모델상 임의의 로컬 폴더에 접근할 수 없어, 로컬 스캔은 **절대경로 입력 방식**입니다.
- 의존성 추적은 1단계입니다. `process.env.X`/`import.meta.env.X` 직접 읽기만 추적하며, 모듈을 가로지르는 재export는 아직 따라가지 않습니다.
- 리팩터링 생성기는 휴리스틱(LLM 미사용) — 일관성과 무료를 보장합니다. 생성된 `serverImplementation`은 **스텁**이라 업스트림 API 연결은 직접 마무리해야 합니다.
- GitHub URL 스캔은 익명 — IP당 GitHub 레이트 리밋이 적용되며 공개 저장소만 가능합니다.
- 패치는 find/replace 방식입니다. 매우 긴 파일은 적용 후 직접 검토하세요.

---

## 🗺️ 로드맵

- [ ] **GitHub App / PR 체크** — 모든 PR에 Guardian 리포트 자동 코멘트
- [ ] **Cursor 익스텐션** — 스캐너 패키지 그대로 IDE 내부 사용
- [ ] **SARIF 내보내기** — GitHub Code Scanning 통합
- [ ] **스캔 간 차이 비교** — 회귀 추적
- [ ] **`.guardianignore`** — 인지된 발견을 무음 처리

---

## 🤝 기여하기

PR을 환영합니다! [CONTRIBUTING.md](./CONTRIBUTING.md) 에 로컬 셋업과 코드 룰이 있고,
모든 기여자는 [Code of Conduct](./CODE_OF_CONDUCT.md) 를 따릅니다.

새 시크릿 패턴 추가는 보통 5분짜리 PR입니다 — 가이드의 4군데만 수정하면 됩니다.

---

## 📜 라이선스

MIT — [LICENSE](./LICENSE) 파일을 참고하세요.

> 즐겁게 쓰시고, 키는 주기적으로 로테이션하시고,
> 이제 다시는 `git push`로 `sk-…` 흘리지 마세요. 🛡️
