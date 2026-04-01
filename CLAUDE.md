# 빵벙 (Bbangbung) — 프로젝트 가이드

배드민턴 정모 예약 및 관리 앱. React + TypeScript + Vite 프론트엔드와 Java Spring Boot 백엔드로 구성. 현재 백엔드 API 연동 완료 상태.

---

## 기술 스택

### 프론트엔드
- **React 19** + **TypeScript** + **Vite 7**
- **Tailwind CSS 4** + **shadcn/ui** (Vega 테마)
- **Lucide React** 아이콘
- **axios** — API 호출
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
│   └── useToast.ts                  # 토스트 메시지 상태
│
├── pages/
│   ├── Auth.tsx                     # 로그인 / 회원가입 (API 연동)
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
│   ├── SessionService.java          # 세션 CRUD, 상태 변경
│   └── ReservationService.java      # 예약/대기/취소, 상태 동기화 (upsert)
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

### Admin
- **정모 관리 탭**: 세션 목록 → 세션 상세
  - 세션 상세: 입금 대기 확정/취소, 대기자 입금요청/취소
  - 상태 변경 버튼 (마감 / 재개 / 종료)
  - 수정 버튼 → CreateSession 수정 모드
  - 삭제 버튼 → ConfirmDialog 경유
- **회원 관리 탭**: API로 전체 회원 조회, 이름/전화번호 검색, 성별/급수 필터

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

### 미착수
- [ ] 실시간 업데이트 (Polling)

---

## 알려진 제약사항

- React Router 없음 — URL 변경 없음, 뒤로가기 미지원
- 실시간 업데이트 미구현 — 다른 유저의 상태 변경은 새로고침 전까지 반영 안 됨
