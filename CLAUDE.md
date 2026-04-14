# 빵벙 (Bbangbung) — 프로젝트 가이드

배드민턴 정모 예약 및 관리 앱. React + TypeScript + Vite 프론트엔드와 Java Spring Boot 백엔드로 구성. 현재 백엔드 API 연동 완료 상태.

---

## 기술 스택

### 프론트엔드
- **React 19** + **TypeScript** + **Vite 7**
- **Tailwind CSS 4** + **shadcn/ui** (Vega 테마)
- **Lucide React** 아이콘
- **axios** — API 호출
- **EventSource (브라우저 내장)** — SSE 실시간 업데이트
- 상태 관리: React `useState` / `useReducer` (외부 라이브러리 없음)
- 라우팅: `App.tsx`의 `page` state 기반 수동 라우팅 (React Router 없음)

### 백엔드
- **Java 21** + **Spring Boot 3.5.13**
- **Spring Data JPA** + **Hibernate**
- **Spring Security** + **JWT** (jjwt 0.12.6)
- **MySQL 8.0.35**
- **Lombok**, Virtual Threads 활성화

---

## 프론트엔드 폴더 구조

```
src/
├── App.tsx                          # 루트. 전역 상태 조합 + 페이지 라우팅
├── main.tsx                         # 진입점
├── types.ts                         # 모든 타입 정의
│
├── data/
│   └── mock.ts                      # (미사용) 구 목 데이터
│
├── hooks/
│   ├── useAuth.ts                   # 로그인, 회원가입, 로그아웃, 프로필/비밀번호 수정, 자동 로그인
│   ├── useNavigation.ts             # 페이지 이동, selectedSessionId
│   ├── useReservations.ts           # 예약, 대기 등록, 취소
│   ├── useSessions.ts               # 세션 CRUD, 참가자 상태 변경
│   ├── useSessionSse.ts             # SSE 구독 — SessionDetail 오픈 시 실시간 세션 업데이트
│   └── useToast.ts                  # 토스트 메시지 상태
│
├── pages/
│   ├── Auth.tsx                     # 로그인 / 회원가입 (API 연동)
│   ├── Onboarding.tsx               # 회원가입 직후 1회 표시되는 앱 안내 (3단계)
│   ├── Home.tsx                     # 대시보드 (예정 모임, 입금 대기 알림, 정모 진행 중 배너)
│   ├── MatchingPage.tsx             # 참가자용 실시간 코트 현황 뷰어 (SSE 구독)
│   ├── SessionPlay.tsx              # 관리자용 정모 진행 화면 (코트 배정 + 대기 게임 + 자동 배정)
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
    ├── api.ts                       # axios 인스턴스 (baseURL, 토큰 자동 첨부)
    ├── badminton.ts                 # 도메인 상수 및 유틸
    │                                #   LEVEL_COLORS, STATUS_CONFIG
    │                                #   getLevelCounts, formatDate, formatFee
    └── utils.ts                     # cn(), formatPhone()
```

---

## 백엔드 폴더 구조

```
src/main/java/com/web/bbangbungbe/
├── BbangbungBeApplication.java
│
├── entity/                          # JPA 엔티티 + Enum
│   ├── Member.java                  # UUID PK, bcrypt 비밀번호
│   ├── BbangSession.java            # 정모 세션
│   ├── SessionParticipant.java      # 복합키 (session_id, member_id)
│   ├── SessionParticipantId.java    # @Embeddable 복합키
│   ├── Reservation.java             # 회원 예약 기록
│   ├── Gender.java
│   ├── BadmintonLevel.java
│   ├── SessionStatus.java
│   └── ReservationStatus.java
│
├── dto/
│   ├── member/
│   │   ├── MemberResponse.java      # password 제외한 회원 응답
│   │   ├── SignupRequest.java
│   │   ├── LoginRequest.java
│   │   ├── LoginResponse.java       # { token, member }
│   │   ├── UpdateProfileRequest.java
│   │   └── ChangePasswordRequest.java
│   ├── session/
│   │   ├── SessionResponse.java     # organizer, participants 포함
│   │   ├── SessionParticipantResponse.java
│   │   ├── SessionCreateRequest.java
│   │   └── StatusUpdateRequest.java
│   └── reservation/
│       ├── ReservationResponse.java
│       └── ReservationRequest.java
│
├── repository/
│   ├── MemberRepository.java
│   ├── BbangSessionRepository.java  # @EntityGraph로 Lazy 로딩 처리
│   ├── SessionParticipantRepository.java
│   └── ReservationRepository.java   # @EntityGraph로 Lazy 로딩 처리
│
├── service/
│   ├── MemberService.java           # 회원가입, 로그인, 프로필/비밀번호 수정
│   ├── SessionService.java          # 세션 CRUD, 상태 변경 (변경 시 SSE notify)
│   ├── ReservationService.java      # 예약/대기/취소, 상태 동기화 (upsert) (변경 시 SSE notify)
│   └── SessionSseService.java       # SseEmitter 관리, 세션별 구독자에게 push
│
├── controller/
│   ├── MemberController.java
│   ├── SessionController.java
│   └── ReservationController.java
│
├── security/
│   ├── JwtUtil.java                 # 토큰 생성/검증
│   ├── JwtFilter.java               # 요청마다 토큰 검증
│   ├── SecurityConfig.java          # 인증/인가 설정, CORS
│   ├── CorsConfig.java              # localhost:5173 허용
│   ├── CustomUserDetailsService.java
│   └── SecurityUtil.java            # getCurrentMemberId(), validateSelf()
│
├── exception/
│   ├── BbangException.java          # 커스텀 예외
│   ├── ErrorCode.java               # 에러 코드 enum (HTTP 상태 포함)
│   ├── ErrorResponse.java           # { code, message }
│   └── GlobalExceptionHandler.java  # @RestControllerAdvice
│
└── config/
    └── JacksonConfig.java           # Hibernate6Module 등록
```

---

## REST API 목록

### 회원 (`/api/members`)
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/signup` | 불필요 | 회원가입 |
| POST | `/login` | 불필요 | 로그인 → `{ token, member }` |
| GET | `/me` | 필요 | 토큰으로 내 정보 조회 (자동 로그인용) |
| GET | `/` | ADMIN | 전체 회원 조회 |
| GET | `/{id}` | 필요 | 단건 조회 |
| PATCH | `/{id}` | 본인 | 프로필 수정 (level, phone) |
| PATCH | `/{id}/password` | 본인 | 비밀번호 변경 (현재 비밀번호 검증) |

### 세션 (`/api/sessions`)
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/` | 불필요 | 전체 세션 조회 (`?status=open`) |
| GET | `/upcoming` | 불필요 | 오늘 이후 세션 |
| GET | `/{id}` | 불필요 | 단건 조회 |
| GET | `/{id}/stream` | 불필요 | SSE 구독 — 세션 실시간 업데이트 |
| POST | `/` | ADMIN | 세션 생성 |
| PUT | `/{id}` | ADMIN | 세션 수정 |
| PATCH | `/{id}/status` | ADMIN | 상태 변경 |
| DELETE | `/{id}` | ADMIN | 세션 삭제 |

### 예약 (`/api/reservations`)
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/members/{memberId}` | 본인 | 내 예약 목록 |
| POST | `/` | 본인 | 예약 신청 (pending) |
| POST | `/waitlist` | 본인 | 대기 신청 (waitlisted) |
| DELETE | `/` | 본인 | 예약 취소 |
| PATCH | `/confirm` | ADMIN | 입금 확인 (pending → confirmed) |
| PATCH | `/promote` | ADMIN | 대기자 승격 (waitlisted → pending) |
| DELETE | `/admin` | ADMIN | 강제 취소 |

### 코트 배정 (`/api/sessions/{sessionId}/courts`)
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/` | 불필요 | 현재 코트 배정 현황 조회 (CourtSlotApi[]) |
| PUT | `/` | ADMIN | 코트 배정 저장 + SSE `court-update` push |

---

## 핵심 타입 (`src/types.ts`)

```ts
type BadmintonLevel = "S" | "A" | "B" | "C" | "D"   // S=프로, D=초보
type Gender = "male" | "female"
type SessionStatus = "open" | "closed" | "completed" | "cancelled"
type ReservationStatus = "confirmed" | "pending" | "waitlisted" | "cancelled"
type Page = "home" | "sessions" | "session-detail" | "session-match" | "session-play" | "my-reservations" | "profile" | "admin"

interface Member { id, name, birthdate, gender, level, phone, password, joinedAt, isAdmin }
interface BbangSession { id, title, date, startTime, endTime, location, address, courtCount,
                         maxParticipants, currentParticipants, status, levelRestriction,
                         fee, description, organizer, participants: SessionParticipant[] }
interface SessionParticipant { memberId, memberName, gender, level, reservedAt, status }
interface Reservation { id, sessionId, sessionTitle, date, startTime, endTime,
                        location, fee, status, createdAt }
// 코트 슬롯 API 응답/요청 타입
interface CourtSlotApi { courtNumber: number; status: "idle" | "playing"; slots: (string | null)[] }
```

---

## 상태 흐름

### 예약 상태 흐름
```
(신청)     pending  →  (관리자 입금확인)  confirmed
(대기신청) waitlisted → (관리자 승격)    pending  → confirmed
모든 상태  →  (취소)  cancelled  →  (재신청)  pending / waitlisted
```

> 취소 후 재신청 시 기존 레코드를 재사용 (upsert) — UNIQUE 제약 유지

### 세션 상태 흐름
```
open (모집 중) → closed (모집 마감) → completed (종료)
open / closed  → completed (종료 처리)
closed         → open (모집 재개)
```

---

## Hooks 역할 요약

### `useAuth`
- `authLoading` — 앱 시작 시 토큰 검증 중 여부 (자동 로그인)
- `handleLogin(phone, password)` — API 로그인, 토큰 저장
- `handleSignup(data)` — 회원가입 후 자동 로그인
- `handleLogout()` — 토큰 삭제, currentUser null
- `handleUpdateProfile(updated)` — level, phone 수정
- `handleChangePassword(currentPassword, newPassword)` — 백엔드에서 현재 비밀번호 검증 후 변경

### `useSessions`
- `fetchSessions()` — 전체 세션 API 조회
- `refreshSession(sessionId)` — 단건 세션 갱신
- `handleCreateSession(data, organizerId)` — 세션 생성
- `handleEditSession(sessionId, data)` — 세션 수정
- `handleDeleteSession(sessionId)` — 세션 삭제
- `handleUpdateSessionStatus(sessionId, status)` — 세션 상태 변경
- `handleConfirmPayment(sessionId, memberId)` — pending → confirmed
- `handlePromoteFromWaitlist(sessionId, memberId)` — waitlisted → pending
- `handleCancelParticipant(sessionId, memberId)` — 관리자 강제 취소
- 모든 함수에 try/catch + showToast 에러 처리

### `useSessionSse`
- `sessionId` — null이면 구독 안 함 (page가 session-detail일 때만 활성)
- `onUpdate(session)` — session-update 이벤트 수신 시 호출
- `onDeleted()` — session-deleted 이벤트 수신 시 호출 (세션 목록으로 이동 + 토스트)

### `useReservations`
- `fetchReservations()` — 내 예약 API 조회
- `handleReserve(sessionId)` — pending 예약
- `handleWaitlist(sessionId)` — waitlisted 예약
- `handleCancel(reservationId)` — 취소

### `useNavigation`
- `navigate(page, sessionId?)` — 페이지 이동, scroll to top
- `resetNavigation()` — home으로, selectedSessionId 초기화

### `useToast`
- `showToast(message, type?)` — 토스트 표시 (2.5초 자동 닫힘)
- `hideToast()` — 수동 닫기

---

## 주요 페이지 동작

### Auth
- 전화번호 + 비밀번호로 로그인 (API)
- 회원가입: 이름 / 생년월일 / 성별 / 급수 / 전화번호 / 비밀번호 (API)
- 로딩 상태 표시, 에러 toast

### Home
- 예정 모임 (confirmed + pending + waitlisted) 카드 목록
- 입금 대기 건수가 있으면 알림 배너 표시
- 다가오는 open 세션 최대 3개 미리보기

### SessionDetail
- 참가 현황 (진행 바, 성별 통계, 레벨 분포)
- Sticky CTA: 상태에 따라 신청 / 대기신청 / 취소 / 비활성 표시
- 취소 시 ConfirmDialog 경유
- 신청/대기/취소 버튼 API 호출 중 `actionLoading` 으로 중복 클릭 방지
- SSE 구독 중 세션 삭제 시 sessions 페이지로 자동 이동

### Admin
- **정모 관리 탭**: 세션 목록 → 세션 상세
  - 세션 상세: 입금 대기 확정/취소, 대기자 입금요청/취소
  - 상태 변경 버튼 (마감 / 재개 / 종료)
  - 수정 버튼 → CreateSession 수정 모드
  - 삭제 버튼 → ConfirmDialog 경유
  - 모든 액션 버튼 API 호출 중 `loadingId` 로 중복 클릭 방지 (멤버별 개별 비활성화)
- **회원 관리 탭**: API로 전체 회원 조회, 이름/전화번호 검색, 성별/급수 필터
  - 조회 중 스켈레톤 로딩 표시, 실패 시 에러 토스트

### MyProfile
- 프로필 수정 (level, phone) — API
- 비밀번호 변경 — 백엔드에서 현재 비밀번호 bcrypt 검증
- 화면 모드 전환 (라이트 / 다크 / 시스템) — `useTheme` 훅

### Onboarding
- 회원가입 직후 `showOnboarding` 상태로 1회 표시
- 3단계: 환영 → 예약 방법 → 추가 기능 안내
- 건너뛰기 버튼으로 언제든 종료 가능

### CreateSession
- `initialData` prop이 있으면 수정 모드 (헤더/버튼 텍스트 변경, 과거날짜 체크 스킵)
- 유효성: 빈 시간, 종료 < 시작, 과거 날짜(생성 시), 참가비 음수

---

## 보안

- JWT 토큰: `Authorization: Bearer {token}` 헤더로 전송
- 토큰 payload: `{ sub: memberId, isAdmin, iat, exp }`
- 만료: 24시간
- `SecurityUtil.validateSelf()` — 본인 리소스 접근 검증 (예약, 프로필 수정)
- 비밀번호: bcrypt 해시 저장, 평문 비교 없음

---

## 다크모드

`src/components/theme-provider.tsx`에 `ThemeProvider` + `useTheme` 훅 구현.
- `theme`: `"light" | "dark" | "system"`
- `setTheme(theme)`: localStorage에 저장 + 즉시 적용

---

## 성별 색상 규칙

이모티콘, 색상 점 없이 **배경색으로만** 구분.
- 남성: `bg-blue-50 / border-blue-200` 계열
- 여성: `bg-pink-50 / border-pink-200` 계열

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
- [x] 전체 페이지 구현 (Auth, Home, SessionList, SessionDetail, MyReservations, MyProfile, CreateSession, Admin, Onboarding)
- [x] 비즈니스 로직 hooks 분리 (useAuth, useSessions, useReservations, useNavigation, useToast)
- [x] 공통 UI 컴포넌트 (ConfirmDialog, Toast, PasswordInput)
- [x] 다크모드 (ThemeProvider, light/dark/system 전환)
- [x] DB 스키마 설계 및 MySQL DB 생성
- [x] Spring Boot 프로젝트 세팅 (Java 21 + Spring Boot 3.5.13 + JPA + Security + JWT)
- [x] Entity 클래스 작성 (Member, BbangSession, SessionParticipant, Reservation + Enum)
- [x] Repository 작성 (@EntityGraph로 Lazy 로딩 처리)
- [x] Service 작성 (MemberService, SessionService, ReservationService)
- [x] Controller 작성 (MemberController, SessionController, ReservationController)
- [x] DTO 작성 (Request/Response 분리, password 노출 방지)
- [x] JWT 인증 (JwtUtil, JwtFilter, SecurityConfig, SecurityUtil)
- [x] CORS 설정 (localhost:5173 허용)
- [x] 에러 핸들링 (BbangException, ErrorCode, GlobalExceptionHandler)
- [x] 입력값 검증 (@Valid + DTO 어노테이션)
- [x] 프론트 API 연동 (axios, mock → API 교체)
- [x] 로그인 유지 (토큰 자동 로그인, GET /api/members/me)
- [x] 취소 후 재예약 처리 (upsert 방식)
- [x] 비밀번호 변경 백엔드 검증 (bcrypt matches)

### 완료 (추가)
- [x] 실시간 업데이트 (SSE) — `GET /api/sessions/{id}/stream`, `useSessionSse` 훅, SessionDetail 오픈 시 자동 구독/해제
- [x] SSE 세션 삭제 이벤트 (`session-deleted`) — 삭제 시 구독자에게 push, 프론트 자동 이동
- [x] 버튼 중복 클릭 방지 — SessionDetail(`actionLoading`), Admin(`loadingId`) 로딩 상태
- [x] 토스트 중복 제거 — SessionDetail/Admin 내부 showToast 호출 제거, 훅에서 단일 처리
- [x] 날짜 비교 버그 수정 — `new Date(str)` UTC 파싱 → `toLocaleDateString("sv")` 문자열 비교
- [x] Admin 회원 목록 에러 처리 — 조회 실패 시 에러 토스트, 로딩 중 스켈레톤 표시
- [x] 시간 표시 포맷 — `"01:00:00"` → `"01:00"` (`formatTime` 유틸 추가, `badminton.ts`)
- [x] 참가비 계좌 안내 바텀시트 — 신청하기 클릭 시 3단계 안내 + 계좌+금액 복사 (클립보드 API + execCommand fallback + 햅틱 + 토스트)
- [x] 모바일 접속 지원 — `vite.config.ts` `host: true`, `.env.local` VITE_API_URL 설정, CorsConfig에 로컬 IP 허용
- [x] JwtFilter 삭제 회원 토큰 처리 — `UsernameNotFoundException` catch 후 인증 없이 계속 진행
- [x] GlobalExceptionHandler SSE 호환 — SSE 요청(`Accept: text/event-stream`) 시 JSON 대신 SSE 이벤트 형식으로 에러 응답
- [x] Auth 에러 메시지 개선 — catch 하드코딩 제거 → `getErrorMessage(e)` 서버 응답 기반으로 표시
- [x] UX/UI 개선
  - 대기 신청 로딩 텍스트 "대기 신청 중..." 추가
  - CreateSession 뒤로가기 작성 내용 손실 방지 (`isDirty` + ConfirmDialog)
  - Home 입금 대기 배너 X 버튼 닫기 추가
  - MyReservations 버튼 `size="sm"` 제거 (터치 영역 확대)
  - SessionList / MyReservations 탭 높이 `py-1.5` → `py-2.5`
  - Admin 버튼 레이아웃 — 상태변경 / 수정·삭제 2행으로 분리
  - ConfirmDialog `pb-8` → `pb-24` (모바일 네비바 가림 수정)
  - Toast `bottom-24` → `bottom-32` (모바일 네비바 위로 올림)
  - 계좌 정보 레이아웃 개선 — 은행명/계좌번호/예금주 분리 표시
- [x] **실시간 코트 배정 (정모 진행 기능)** — `SessionPlay.tsx`, `MatchingPage.tsx`, `court_game` DB 테이블
  - **관리자용 `SessionPlay.tsx`** (`session-play` 페이지, Admin에서 진입)
    - 4슬롯 코트 그리드, 게임 시작/종료, 이력 기록, 각 코트 "비우기" 버튼
    - **Auto / 수동 모드 토글**
      - Auto 모드 ON: "자동 배정" 버튼 → 모든 빈 코트 + 대기 게임 한번에 채움 (`free` 타입)
      - Auto 모드 ON + 경기 종료: 해당 코트 자동으로 바로 재배정
      - 수동 모드 (기본): 빈 코트/대기게임 카드에 `[자유] [혼복] [남복] [여복]` 버튼으로 1코트씩 배정
      - 양 모드 공통: 빈 슬롯 `+` 클릭 → PlayerPicker 바텀시트로 한 명씩 직접 배정 가능
    - **대기 게임** (pendingGames): 코트 수만큼 생성 상한, 수동/자동 배정 모두 지원
      - "코트 배정" 버튼으로 빈 idle 코트에 이동
      - 대기 게임도 동일하게 `[자유] [혼복] [남복] [여복]` 버튼 + 슬롯 직접 배정
    - `saveCourts(courts, pending)`: 실제 코트(courtNumber 1~N) + 대기게임(courtNumber N+1~)을 함께 저장
    - 마운트 시 API로 상태 복원 — courtNumber 기반으로 실제 코트/대기게임 구분, padding 처리
  - **참가자용 `MatchingPage.tsx`** (`session-match` 페이지)
    - SSE `court-update` 이벤트 구독으로 실시간 반영
    - `courtNumber <= session.courtCount` → 실제 코트, 초과 → 대기 게임 (status 대소문자 무관)
    - 실제 코트 현황 + 대기 게임 섹션 + 대기 중 섹션 (항상 표시, 0명이면 "없음" 메시지)
    - "내 코트" 강조, "나" 배지, 내 슬롯 ring
  - `Home.tsx` — 오늘 closed 세션 + 내가 confirmed인 경우 "정모 진행 중" 배너 → `session-match` 이동
  - `SessionDetail.tsx` — "코트 현황 보기 →" 버튼: `status === "closed" && confirmedParticipants.length > 0`
  - `CourtSlotApi.status`: `"idle" | "playing" | "pending"`
  - **백엔드**: `court_game` 테이블, `CourtGameService`, `CourtGameController`, `SessionSseService.notifyCourts()`
    - DB: `session_id, court_number, status(VARCHAR20), slot0~slot3_member_id`, UNIQUE `(session_id, court_number)`
    - `GET /api/sessions/{id}/courts` — permitAll, `PUT` — ADMIN only
    - PUT 시 기존 rows delete + 새로 insert + SSE `court-update` push
    - 대기 게임은 `courtNumber > session.courtCount`로 구분 (별도 테이블 없음)

---

## 미해결 보완 항목

없음 — 모두 해결됨.

### 해결된 항목 (이력)
- `MyProfile` 토스트 중복 → `handleInfoSave` 내부 `showToast` 제거 (`useAuth`에서 단일 처리)
- `MyProfile` 저장 버튼 로딩 상태 없음 → `infoLoading`, `pwLoading` 상태 추가, 호출 중 버튼 비활성화
- SSE 재연결 시 데이터 동기화 없음 → `useSessionSse`에 `onReconnect` 콜백 추가, `es.onopen` 재연결 감지 시 `refreshSession` 호출
- `Admin` Rules of Hooks 위반 → `useState`/`useEffect`를 early return 위로 이동, `useEffect` 내 `isAdmin` 조건 체크
- `useReservations` `refreshSession` → SSE 지연 시 `session.participants`가 즉시 반영 안 되어 CTA가 갱신 안 되는 문제로 `refreshSession` 복원. `fetchReservations`와 `Promise.all`로 병렬 호출
- 프로필 수정 시 비밀번호 이중 encode 버그 → `Member` 타입에서 `password` 제거, `UpdateProfileRequest`에서 `password` 제거, `MemberService.updateProfile` 파라미터 제거, `handleInfoSave`에서 password 전달 제거
- `getErrorMessage` 중복 → `lib/api.ts`로 통합, 각 훅에서 import
- JWT Secret / DB 비밀번호 평문 노출 → `application.yaml`에서 `${JWT_SECRET}`, `${DB_USERNAME}`, `${DB_PASSWORD}` 환경변수로 분리 (기본값 fallback 유지)
- 프로필 수정 실패 시 UI 불일치 → `handleInfoSave`에 try/catch 추가, `useAuth.handleUpdateProfile`에서 에러 re-throw
- 세션 상태 변경 Optimistic update 롤백 없음 → API 실패 시 이전 상태로 rollback
- `ReservationRepository` N+1 쿼리 → `findByMemberIdAndStatus`, `findByMemberIdAndSessionId`에 `@EntityGraph({"session"})` 추가
- 급수 제한 백엔드 검증 없음 → `ReservationService.validateLevelRestriction()` 추가, `ErrorCode.LEVEL_NOT_ALLOWED` 추가
- `SessionResponse` cancelled 참가자 포함 → participants 직렬화 시 cancelled 필터링, `currentParticipants`를 confirmed+pending으로 수정
- `ReservationService` 동시성 → `reserve/waitlist` 트랜잭션에 `Isolation.SERIALIZABLE` 적용
- SSE 인증 없음 → `SessionController.stream()`에 `?token=` 쿼리 파라미터 검증 추가, 프론트 `useSessionSse`에서 토큰 전달
- `MyReservations` 취소 다이얼로그 → `onCancel` prop을 `Promise<void>`로 변경, `await` + `cancelling` 상태 추가
- `findByMember` cancelled 포함 → `findByMemberIdAndStatusNot(cancelled)` 으로 교체
- SSE 재구독 → `useSessionSse`에 `onerror` 3초 재연결 로직 추가, 백엔드 타임아웃 3분 → 30분
- Admin 회원 검색 클라이언트 필터링 → `GET /api/members?keyword=&level=&gender=` 서버사이드 처리, 엔터키로 검색 실행

---

## 다음 할 일 (배포)

### 배포 목표
Oracle Cloud Free Tier VM 1대에 Spring Boot + MySQL + Nginx 올리기 (영구 무료)

### 배포 순서
- [ ] Oracle Cloud 가입 및 VM 인스턴스 생성 (Ubuntu 22.04, ARM 또는 x86)
- [ ] VM에 Java 21 설치
- [ ] VM에 MySQL 8 설치 및 DB/계정 생성
- [ ] Spring Boot `application.yaml` 환경변수 설정 (JWT_SECRET, DB_USERNAME, DB_PASSWORD)
- [ ] 프론트엔드 빌드 (`npm run build`) → `dist/` 파일을 `bbangbung-be/src/main/resources/static/`에 복사
- [ ] Spring Boot JAR 빌드 (`./mvnw package`)
- [ ] JAR 파일 서버에 업로드 (scp 또는 GitHub Actions)
- [ ] Nginx 설치 및 리버스 프록시 설정 (80/443 → 8080)
- [ ] Let's Encrypt로 HTTPS 인증서 발급 (certbot)
- [ ] 무료 도메인 연결 (freedns.afraid.org 또는 소유 도메인)
- [ ] CORS 설정에 실제 도메인 추가 (`CorsConfig.java`)
- [ ] `.env.local` VITE_API_URL을 실제 도메인으로 변경 후 재빌드
- [ ] systemd 서비스 등록 (서버 재시작 시 자동 실행)

---

## 알려진 제약사항

- React Router 없음 — URL 변경 없음, 뒤로가기 미지원
- 현재 HTTP 환경 — 모바일 클립보드 API 불안정 (HTTPS 배포 후 해결됨)
- iOS Vibration API 미지원 — 햅틱 피드백 없음 (네이티브 앱 아니면 불가)
