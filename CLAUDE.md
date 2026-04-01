# 빵벙 (Bbangbung) — 프로젝트 가이드

배드민턴 정모 예약 및 관리 앱. React + TypeScript + Vite, 현재 mock 데이터로 동작 중. 백엔드(Spring Boot + MySQL) 연동 예정.

---

## 기술 스택

- **React 19** + **TypeScript** + **Vite 7**
- **Tailwind CSS 4** + **shadcn/ui** (Vega 테마)
- **Lucide React** 아이콘
- 상태 관리: React `useState` / `useReducer` (외부 라이브러리 없음)
- 라우팅: `App.tsx`의 `page` state 기반 수동 라우팅 (React Router 없음)
- 백엔드: **Java 17 + Spring Boot 3.x** (예정) — 현재는 `src/data/mock.ts`의 목 데이터 사용
- DB: **MySQL 8.0.35**

---

## 폴더 구조

```
src/
├── App.tsx                          # 루트. 전역 상태 조합 + 페이지 라우팅
├── main.tsx                         # 진입점
├── types.ts                         # 모든 타입 정의
│
├── data/
│   └── mock.ts                      # 목 데이터 (members, sessions, reservations)
│
├── hooks/                           # 비즈니스 로직 분리
│   ├── useAuth.ts                   # 로그인, 회원가입, 로그아웃, 프로필 수정
│   ├── useNavigation.ts             # 페이지 이동, selectedSessionId
│   ├── useReservations.ts           # 예약, 대기 등록, 취소
│   ├── useSessions.ts               # 세션 CRUD, 참가자 상태 변경
│   └── useToast.ts                  # 토스트 메시지 상태
│
├── pages/
│   ├── Auth.tsx                     # 로그인 / 회원가입
│   ├── Onboarding.tsx               # 회원가입 직후 1회 표시되는 앱 안내 (3단계)
│   ├── Home.tsx                     # 대시보드 (예정 모임, 입금 대기 알림)
│   ├── SessionList.tsx              # 세션 목록 + 상태 필터
│   ├── SessionDetail.tsx            # 세션 상세 + 예약/대기/취소 CTA
│   ├── MyReservations.tsx           # 내 예약 목록 (예정/지난 탭)
│   ├── MyProfile.tsx                # 프로필 수정, 비밀번호 변경, 화면 모드 설정
│   ├── CreateSession.tsx            # 세션 생성/수정 폼 (isEdit 모드 겸용)
│   └── Admin.tsx                    # 관리자 패널 (정모 관리, 회원 관리)
│
├── components/
│   ├── layout/
│   │   └── Navbar.tsx               # 하단 고정 네비게이션
│   └── ui/
│       ├── badge.tsx                # shadcn Badge
│       ├── button.tsx               # shadcn Button
│       ├── confirm-dialog.tsx       # 파괴적 액션 확인 다이얼로그
│       ├── password-input.tsx       # 비밀번호 입력 (눈 아이콘 토글)
│       └── toast.tsx                # 성공/실패 피드백 토스트
│
└── lib/
    ├── badminton.ts                 # 도메인 상수 및 유틸
    │                                #   LEVEL_COLORS, STATUS_CONFIG
    │                                #   getLevelCounts, formatDate, formatFee
    └── utils.ts                     # cn(), formatPhone()
```

---

## 핵심 타입 (`src/types.ts`)

```ts
type BadmintonLevel = "S" | "A" | "B" | "C" | "D"   // S=프로, D=초보
type Gender = "male" | "female"
type SessionStatus = "open" | "closed" | "completed" | "cancelled"
type ReservationStatus = "confirmed" | "pending" | "waitlisted" | "cancelled"
type Page = "home" | "sessions" | "session-detail" | "my-reservations" | "profile" | "admin"

interface Member { id, name, birthdate, gender, level, phone, password, joinedAt, isAdmin }
interface BbangSession { id, title, date, startTime, endTime, location, address, courtCount,
                         maxParticipants, currentParticipants, status, levelRestriction,
                         fee, description, organizer, participants: SessionParticipant[] }
interface SessionParticipant { memberId, memberName, gender, level, reservedAt, status }
interface Reservation { id, sessionId, sessionTitle, date, startTime, endTime,
                        location, fee, status, createdAt }
```

> `currentParticipants`는 `confirmed` 상태 참가자 수. UI에서는 항상 `participants.filter(p => p.status === "confirmed").length`로 직접 계산해서 표시.

---

## 상태 흐름

### 예약 상태 흐름
```
(신청)     pending  →  (관리자 입금확인)  confirmed
(대기신청) waitlisted → (관리자 승격)    pending  → confirmed
모든 상태  →  (취소)  cancelled
```

### 세션 상태 흐름
```
open (모집 중) → closed (모집 마감) → completed (종료)
open / closed  → completed (종료 처리)
closed         → open (모집 재개)
```

---

## Hooks 역할 요약

### `useAuth`
- `handleLogin(member)` — currentUser 설정
- `handleSignup(data)` — 신규 member 생성 후 로그인
- `handleLogout()` — currentUser null로 초기화
- `handleUpdateProfile(updated)` — level, phone, password 수정

### `useSessions`
- `addParticipant(sessionId, participant)` — 세션에 참가자 추가
- `handleCreateSession(data)` — 세션 생성
- `handleEditSession(sessionId, data)` — 세션 정보 수정
- `handleDeleteSession(sessionId)` — 세션 삭제
- `handleUpdateSessionStatus(sessionId, status)` — 세션 상태 변경
- `handleConfirmPayment(sessionId, memberId)` — pending → confirmed
- `handlePromoteFromWaitlist(sessionId, memberId)` — waitlisted → pending
- `handleCancelParticipant(sessionId, memberId)` — 관리자 강제 취소
- `handleCancelMyParticipant(sessionId, memberId)` — 본인 취소
- 참가자 상태 변경 시 `currentParticipants`는 confirmed 수로 자동 재계산

### `useReservations`
- `handleReserve(sessionId)` — pending 예약 생성
- `handleWaitlist(sessionId)` — waitlisted 예약 생성
- `handleCancel(reservationId)` — 예약 cancelled 처리 + 참가자 상태도 동기화

### `useNavigation`
- `navigate(page, sessionId?)` — 페이지 이동, scroll to top
- `resetNavigation()` — home으로, selectedSessionId 초기화

### `useToast`
- `showToast(message, type?)` — 토스트 표시 (2.5초 자동 닫힘)
- `hideToast()` — 수동 닫기

---

## 주요 페이지 동작

### Auth
- 전화번호 + 비밀번호로 로그인
- 회원가입: 이름 / 생년월일 / 성별 / 급수 / 전화번호 / 비밀번호
- 중복 전화번호 체크 있음

### Home
- 예정 모임 (confirmed + pending + waitlisted) 카드 목록
- 입금 대기 건수가 있으면 알림 배너 표시
- 다가오는 open 세션 최대 3개 미리보기

### SessionDetail
- 참가 현황 (진행 바, 성별 통계, 레벨 분포)
- Sticky CTA: 상태에 따라 신청 / 대기신청 / 취소 / 비활성 표시
- 취소 시 ConfirmDialog 경유

### Admin
- **정모 관리 탭**: 세션 목록 → 세션 상세
  - 세션 상세: 입금 대기 확정/취소, 대기자 입금요청/취소
  - 상태 변경 버튼 (마감 / 재개 / 종료)
  - 수정 버튼 → CreateSession 수정 모드
  - 삭제 버튼 → ConfirmDialog 경유
- **회원 관리 탭**: 이름/전화번호 검색, 성별 필터, 급수 필터

### MyProfile
- 프로필 수정, 비밀번호 변경
- 화면 모드 전환 (라이트 / 다크 / 시스템) — `useTheme` 훅 사용

### Onboarding
- 회원가입 직후 `showOnboarding` 상태로 1회 표시
- 3단계: 환영 → 예약 방법 → 추가 기능 안내
- 급수 안내 단계 없음 (제거됨)
- 단계 표시: 완료(bg-primary/40) / 현재(w-8 bg-primary) / 미완(bg-muted) 도트
- 건너뛰기 버튼으로 언제든 종료 가능

### CreateSession
- `initialData` prop이 있으면 수정 모드 (헤더/버튼 텍스트 변경, 과거날짜 체크 스킵)
- 유효성: 빈 시간, 종료 < 시작, 과거 날짜(생성 시), 참가비 음수

---

## 다크모드

`src/components/theme-provider.tsx`에 `ThemeProvider` + `useTheme` 훅 구현되어 있음.
- `theme`: `"light" | "dark" | "system"`
- `setTheme(theme)`: localStorage에 저장 + 즉시 적용
- `MyProfile`에서 UI로 전환 가능

---

## 성별 색상 규칙

이모티콘, 색상 점 없이 **배경색으로만** 구분.
- 남성: `bg-blue-50 / border-blue-200` 계열
- 여성: `bg-pink-50 / border-pink-200` 계열

텍스트로 표기할 때는 "남" / "여" 또는 "남성" / "여성" 그대로 사용.

## 급수 색상 (`LEVEL_COLORS`)

| 급수 | 색상 |
|------|------|
| S    | 보라 |
| A    | 파랑 |
| B    | 초록 |
| C    | 주황 |
| D    | 회색 |

---

## 작업 규칙

- **코드 수정 후에는 반드시 CLAUDE.md를 최신화한다.** 새 파일, 기능, 동작 변경이 생기면 관련 섹션을 즉시 업데이트.

---

## 진행 현황

### 완료
- [x] 프로젝트 초기 세팅 (React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + shadcn/ui)
- [x] 목 데이터 설계 (`members`, `sessions`, `reservations`)
- [x] 전체 페이지 구현 (Auth, Home, SessionList, SessionDetail, MyReservations, MyProfile, CreateSession, Admin)
- [x] 비즈니스 로직 hooks 분리 (useAuth, useSessions, useReservations, useNavigation, useToast)
- [x] 예약 상태 흐름 구현 (pending → confirmed, waitlisted → pending → confirmed, 취소)
- [x] 세션 상태 관리 (open ↔ closed, completed)
- [x] 세션 CRUD (생성, 수정, 삭제)
- [x] 공통 UI 컴포넌트 (ConfirmDialog, Toast, PasswordInput)
- [x] 관리자 패널 (입금 확정, 대기자 승격, 강제 취소, 회원 검색/필터)
- [x] 다크모드 (ThemeProvider, light/dark/system 전환)
- [x] 온보딩 화면 (회원가입 직후 3단계 안내)
- [x] currentParticipants 자동 재계산 (confirmed 수 기준)
- [x] DB 스키마 설계 완료 (MySQL 8.0.35 기준 DDL 작성)
- [x] MySQL DB 생성 완료
- [x] 백엔드 스택 확정 (Java 21 + Spring Boot 3.5.13 + JPA + Spring Security + JWT)
- [x] Spring Boot 프로젝트 생성 (IntelliJ)
- [x] application.yml 설정 완료 (DB 연결, Virtual Threads 활성화)
- [x] Spring Boot 실행 및 DB 연결 확인

### 진행 중
- [ ] Entity 클래스 작성

### 미착수
- [ ] Repository / Service / Controller 구현
- [ ] JWT 인증 적용
- [ ] REST API 구현 (회원 → 인증 → 세션 → 예약 → 관리자 순)
- [ ] 프론트 API 연동 (mock → axios/fetch 교체)
- [ ] 실시간 업데이트 (Polling 또는 WebSocket)

---

## 백엔드 연동 계획

### 확정된 스택
- **백엔드**: Java 21 + Spring Boot 3.5.13
- **DB**: MySQL 8.0.35
- **ORM**: Spring Data JPA
- **인증**: Spring Security + JWT
- **기타**: Lombok, Virtual Threads

### Spring Boot 설정 (application.yml)
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/bbangbung?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: validate  # DDL은 직접 실행, JPA는 검증만
    show-sql: true
    open-in-view: false
  threads:
    virtual:
      enabled: true  # Java 21 Virtual Threads
server:
  port: 8080
```

### DB 테이블 구조
| 테이블 | 설명 |
|--------|------|
| `members` | 회원 (phone UNIQUE, password는 bcrypt 해시) |
| `sessions` | 정모 세션 (level_restriction은 JSON 컬럼) |
| `session_participants` | 세션 참가자 — (session_id, member_id) PK |
| `reservations` | 회원 개인 예약 기록 — (member_id, session_id) UNIQUE |

### 주요 설계 원칙
- `current_participants` 컬럼 없음 — `session_participants`에서 `status = 'confirmed'` 집계
- `reservations` ↔ `session_participants` 상태는 트리거로 자동 동기화
- `organizer`는 `organizer_id` FK로 저장 (현재 mock에서는 이름 문자열)

### 프론트 연동 시 변경 필요 사항
- `src/data/mock.ts` → API 호출로 교체
- 각 hook(`useAuth`, `useSessions`, `useReservations`)에서 `fetch` 또는 `axios` 사용
- 실시간 업데이트: 초기엔 Polling, 이후 WebSocket(Socket.io) 검토

---

## 알려진 제약사항 / 미구현

- 백엔드 없음 — 새로고침 시 mock 데이터로 리셋 (백엔드 연동 전까지)
- React Router 없음 — URL 변경 없음, 뒤로가기 미지원
- 인증 보안 없음 — 비밀번호 평문 저장 (mock 전용, 백엔드 연동 시 bcrypt로 전환)
- 세션 생성/수정 시 `organizer`는 현재 로그인 유저 이름으로 고정 (연동 시 ID로 전환)
- 실시간 업데이트 미구현 — 현재 상태 변경은 해당 유저 화면만 즉시 반영
