# CampusEat

대학생 커뮤니티·맛집·중고거래·모임·시간표·교내 혼잡도 등을 하나의 웹 서비스로 묶은 풀스택 프로젝트입니다. 프론트는 **Next.js**, API는 **NestJS**, 시계열 예측은 **FastAPI**가 담당하는 하이브리드 구조입니다.

## 저장소 구조

```
campuseat/
├── frontend/          # Next.js 16 (App Router, React 19)
├── backend/           # NestJS 11 REST API + Socket.IO
├── ml-server/         # FastAPI + Prophet (교내 혼잡 예측 학습)
└── README.md
```

## 주요 기능

| 영역 | 설명 |
|------|------|
| 인증·회원 | JWT 기반 로그인, 회원가입, 비밀번호·아이디 찾기 등 (`auth`, `users`) |
| 커뮤니티 | 게시글·댓글 (`posts`, `comments`) |
| 맛집 | 식당 목록·리뷰·제보 (`restaurants`, `reviews`, `submissions`) |
| 중고·모임 | 거래·책장터·모임·쪽지 (`trades`, `gatherings`, `messages`) |
| 시간표 | 학교별 스크래핑·PDF 파싱·AI 검증 보조 (`timetable`) |
| 교내 상태 | 실시간 리포트·요약·주간 Prophet 예측 (`campus-status` + `ml-server`) |
| 운영 | 신고·문의·관리자 화면 (`reports`, `inquiries`, `answers`, 프론트 `/admin/*`) |
| 파일 업로드 | Oracle Cloud Infrastructure Object Storage 연동 (`uploads`) |

부가로 **Redis** 캐시·세션 용도, **Winston** 로깅, **Helmet**·CORS·전역 Rate limit(`Throttler`)이 적용되어 있습니다.

## 기술 스택

### Frontend (`frontend/`)

- Next.js 16, React 19, Turbopack 빌드
- Tailwind CSS 4, Framer Motion, Chart.js
- Axios (`src/lib/api.js`), Socket.IO 클라이언트

### Backend (`backend/`)

- NestJS 11, TypeORM, PostgreSQL
- JWT (`passport-jwt`), Socket.IO (`@nestjs/platform-socket.io`)
- OpenAI API (교내 요약·시간표 AI 검증 등)
- Google Document AI (시간표 PDF 파싱)
- Puppeteer / Cheerio (스크래핑)
- OCI Object Storage SDK (`oci-objectstorage`)
- 선택 연동: Firebase Admin, Nodemailer, ioredis

### ML 서버 (`ml-server/`)

- FastAPI, Prophet, pandas, SQLAlchemy(PostgreSQL 직접 접속)
- `POST /train-all`: 캠퍼스 상태 메시지 기반 혼잡 타임라인 학습·`campus_prediction` 테이블 반영

## 사전 요구 사항

- Node.js 20+ 권장 (프론트·백엔드)
- PostgreSQL
- Python 3.10+ (ML 서버)
- (선택) Redis — `REDIS_URL` 사용 시
- OCI API 키·버킷 정보 — 이미지 업로드 사용 시
- OpenAI API 키 — AI 기능 사용 시

## 환경 변수

`.env` 파일은 Git에 올리지 마세요. 루트 `.gitignore`에 이미 제외 규칙이 있습니다.

### Backend (`backend/.env` 또는 `backend/.env.production`)

`ConfigModule`에서 **반드시 검증되는 값**:

| 변수 | 설명 |
|------|------|
| `NODE_ENV` | `development` \| `production` \| `test` |
| `DB_HOST` | PostgreSQL 호스트 |
| `DB_PORT` | 포트 (기본 5432) |
| `DB_USERNAME` | DB 사용자 |
| `DB_PASSWORD` | DB 비밀번호 |
| `DB_DATABASE` | DB 이름 |
| `JWT_SECRET` | JWT 서명 비밀값 |
| `OPENAI_API_KEY` | OpenAI |
| `ML_API_KEY` | ML 서버 Bearer 토큰과 동일 값 |

코드에서 추가로 참조되는 값(기능별로 필요 시 설정):

| 변수 | 용도 |
|------|------|
| `REDIS_URL` | Redis 클라이언트 |
| `FRONTEND_URL` | 메일 링크 등 |
| `EMAIL_USER` / `EMAIL_PASS` | Nodemailer |
| `OCI_TENANCY_ID`, `OCI_USER_ID`, `OCI_FINGERPRINT`, `OCI_KEY_FILE_PATH`, `OCI_BUCKET_NAME`, `OCI_REGION` | OCI Object Storage |

프로덕션에서는 `NODE_ENV=production`일 때 **`backend/.env.production`** 이 로드됩니다.

### Frontend (`frontend/.env.local` 등)

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_API_URL` | Nest API 베이스 URL (예: `http://localhost:3000/api`) |

### ML 서버 (`ml-server/.env`)

| 변수 | 설명 |
|------|------|
| `ML_API_KEY` | API Bearer 검증용 (백엔드와 동일) |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | PostgreSQL (백엔드와 동일 DB를 가리키는 경우가 많음) |

## 로컬 실행

백엔드가 **`http://localhost:3000`** 에서 listen 하므로, 프론트 기본 포트(3000)와 겹치지 않게 **프론트는 3001 등 다른 포트**를 쓰는 것을 권장합니다. `backend/src/main.ts`의 CORS에 `localhost:3000`, `localhost:3001` 이 포함되어 있습니다.

### 1. PostgreSQL 준비

DB를 만든 뒤 연결 정보를 백엔드·ML 서버 `.env`에 맞춥니다.

### 2. Backend

```bash
cd backend
npm install
npm run start:dev
```

API 프리픽스: **`/api`** (예: `http://localhost:3000/api/...`)

### 3. ML 서버 (교내 예측 학습이 필요할 때)

`ml-server`에는 `requirements.txt`가 없으므로, `main.py` 의존성에 맞춰 설치합니다.

```bash
cd ml-server
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install fastapi uvicorn python-dotenv sqlalchemy pandas prophet psycopg2-binary
uvicorn main:app --host 0.0.0.0 --port 8000
```

백엔드의 주간 학습 크론은 기본적으로 **`http://127.0.0.1:8000/train-all`** 로 요청합니다. ML 서버를 다른 호스트에 두면 해당 URL을 코드에서 환경 변수화하는 편이 좋습니다.

### 4. Frontend

```bash
cd frontend
npm install
npx next dev --turbopack -p 3001
```

프로덕션 빌드:

```bash
npm run build
npm run start
```

## 배포 (현재 구성)

| 구분 | 방식 |
|------|------|
| Frontend | **Vercel** |
| Backend | **Oracle Cloud Infrastructure** 가상머신 + **PM2** 등 프로세스 매니저 |
| 이미지 | **OCI Object Storage** (`frontend/next.config.js`의 `images.remotePatterns`에 리전 호스트 설정) |

운영 도메인 예시는 백엔드 CORS 설정에 `https://campuseat.shop`, `https://www.campuseat.shop` 이 포함되어 있습니다.

## 보안·운영 참고

- **`synchronize: true`** 가 `backend/src/app.module.ts` 의 TypeORM 설정에 있습니다. 운영 DB에서는 스키마 자동 변경 위험이 있으므로, 성숙한 배포에서는 마이그레이션 전략으로 바꾸는 것을 권장합니다.
- **`dump-*.sql`** 같은 DB 덤프, API 키, `.pem` 은 저장소에 넣지 마세요. 덤프는 로컬 백업용으로만 보관하세요.

## 라이선스

각 패키지의 `package.json` 및 저장소 정책을 따릅니다. 별도 루트 `LICENSE` 파일이 없으면 조직·개인 정책에 맞게 추가하면 됩니다.
