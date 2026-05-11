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
