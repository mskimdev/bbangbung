# 빵벙 (Bbangbung)

배드민턴 정모 예약 및 관리 웹 앱

> 현재 프론트엔드(mock 데이터)까지 구현 완료. 백엔드(Spring Boot + MySQL) 연동 진행 예정.

---

## 기술 스택

### 프론트엔드
| 항목 | 버전 |
|------|------|
| React | 19 |
| TypeScript | 5.9 |
| Vite | 7 |
| Tailwind CSS | 4 |
| shadcn/ui | Vega 테마 |
| Lucide React | 아이콘 |

### 백엔드 (예정)
| 항목 | 버전 |
|------|------|
| Java | 17 |
| Spring Boot | 3.x |
| Spring Data JPA | - |
| Spring Security + JWT | - |
| MySQL | 8.0.35 |

---

## 주요 기능

- **회원 인증** — 로그인 / 회원가입 / 프로필 수정 / 비밀번호 변경
- **정모 세션** — 세션 목록 조회, 상세 보기, 생성/수정/삭제
- **예약 시스템** — 신청(pending) → 입금 확인(confirmed), 대기(waitlisted) → 승격
- **관리자 패널** — 입금 확정, 대기자 승격, 강제 취소, 세션 상태 관리, 회원 검색/필터
- **다크모드** — 라이트 / 다크 / 시스템 모드 전환
- **온보딩** — 회원가입 직후 3단계 앱 사용 안내

---

## 예약 상태 흐름

```
신청      →  pending  →  (관리자 입금 확인)  →  confirmed
대기신청  →  waitlisted  →  (관리자 승격)  →  pending  →  confirmed
모든 상태  →  (취소)  →  cancelled
```

## 세션 상태 흐름

```
open (모집 중)  →  closed (모집 마감)  →  completed (종료)
closed  →  open (모집 재개 가능)
```

---

## 시작하기

### 요구사항

- Node.js 18+
- npm 9+

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 빌드
npm run build

# 타입 체크
npm run typecheck
```

### 테스트 계정

| 이름 | 전화번호 | 비밀번호 | 권한 |
|------|----------|----------|------|
| 김민준 | 010-1234-5678 | admin1234 | 관리자 |
| 박준호 | 010-3456-7890 | admin1234 | 관리자 |
| 이서연 | 010-2345-6789 | test1234 | 일반 |

> 새로고침 시 mock 데이터로 초기화됩니다.

---

## 폴더 구조

```
src/
├── App.tsx                # 루트. 전역 상태 + 페이지 라우팅
├── types.ts               # 모든 타입 정의
├── data/
│   └── mock.ts            # 목 데이터
├── hooks/                 # 비즈니스 로직
│   ├── useAuth.ts
│   ├── useSessions.ts
│   ├── useReservations.ts
│   ├── useNavigation.ts
│   └── useToast.ts
├── pages/                 # 페이지 컴포넌트
├── components/
│   ├── layout/            # Navbar
│   └── ui/                # 공통 UI (Button, Badge, Toast, ConfirmDialog 등)
└── lib/                   # 유틸 함수 및 상수
```

---

## 진행 현황

- [x] 프론트엔드 전체 구현 (mock 데이터)
- [x] DB 스키마 설계 (MySQL 8.0.35)
- [x] 백엔드 스택 확정 (Spring Boot 3.x)
- [ ] Spring Boot REST API 구현
- [ ] 프론트 API 연동 (mock → axios)
- [ ] JWT 인증 적용
- [ ] 실시간 업데이트

---

## DB 스키마 (MySQL)

| 테이블 | 설명 |
|--------|------|
| `members` | 회원 정보 |
| `sessions` | 정모 세션 |
| `session_participants` | 세션 참가자 (세션 관점) |
| `reservations` | 예약 기록 (회원 관점) |

- `current_participants` 컬럼 없음 — `session_participants`에서 `confirmed` 수 집계
- `reservations` ↔ `session_participants` 상태는 트리거로 자동 동기화
- `level_restriction`은 JSON 컬럼 (`null` = 제한 없음)
