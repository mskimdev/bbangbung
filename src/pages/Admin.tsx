import { useState, useEffect } from "react"
import { Plus, Search, CalendarDays, MapPin, Users, Phone, ChevronRight, ChevronLeft, CheckCircle2, XCircle, Clock, ShieldOff, Pencil, Trash2, LockKeyhole, Unlock, Flag, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"
import { LEVEL_COLORS, STATUS_CONFIG, formatDate, formatFee, formatTime } from "@/lib/badminton"
import { CreateSession } from "@/pages/CreateSession"
import api from "@/lib/api"
import type { BadmintonLevel, BbangSession, Member, Page, SessionStatus } from "@/types"

const LEVELS: BadmintonLevel[] = ["S", "A", "B", "C", "D"]

interface AdminProps {
  sessions: BbangSession[]
  currentUser: Member
  onNavigate: (page: Page, sessionId?: string) => void
  onConfirmPayment: (sessionId: string, memberId: string) => Promise<void>
  onConfirmAll: (sessionId: string) => Promise<void>
  onCancelParticipant: (sessionId: string, memberId: string) => Promise<void>
  onPromoteFromWaitlist: (sessionId: string, memberId: string) => Promise<void>
  onCreateSession: (session: Omit<BbangSession, "id" | "currentParticipants" | "participants" | "status">, organizerId: string) => Promise<void>
  onUpdateSessionStatus: (sessionId: string, status: SessionStatus) => Promise<void>
  onEditSession: (sessionId: string, data: Omit<BbangSession, "id" | "currentParticipants" | "participants" | "status">) => Promise<void>
  onDeleteSession: (sessionId: string) => void
  showToast: (message: string, type?: "success" | "error") => void
  onAdminSelectSession: (id: string | null) => void
}

type AdminTab = "sessions" | "members"
type SessionsView = "list" | "create" | "edit" | "detail"

export function Admin({ sessions, currentUser, onNavigate, onConfirmPayment, onConfirmAll, onCancelParticipant, onPromoteFromWaitlist, onCreateSession, onUpdateSessionStatus, onEditSession, onDeleteSession, showToast, onAdminSelectSession }: AdminProps) {
  const [tab, setTab] = useState<AdminTab>("sessions")
  const [sessionsView, setSessionsView] = useState<SessionsView>("list")
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [memberSearch, setMemberSearch] = useState("")
  const [levelFilter, setLevelFilter] = useState<BadmintonLevel | "all">("all")
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all")
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  function fetchMembers(keyword: string, level: BadmintonLevel | "all", gender: "all" | "male" | "female") {
    if (!currentUser.isAdmin) return
    setMembersLoading(true)
    const params = new URLSearchParams()
    if (keyword.trim()) params.set("keyword", keyword.trim())
    if (level !== "all") params.set("level", level)
    if (gender !== "all") params.set("gender", gender)
    api.get(`/members?${params.toString()}`)
      .then(({ data }) => {
        setMembers(data.map((m: any): Member => ({
          id: m.id,
          name: m.name,
          birthdate: m.birthdate,
          gender: m.gender,
          level: m.level,
          phone: m.phone,
          joinedAt: m.joinedAt,
          isAdmin: m.admin,
          freeTickets: m.freeTickets ?? 0,
          totalAttendance: m.totalAttendance ?? 0,
          monthlyAttendance: m.monthlyAttendance ?? 0,
        })))
      })
      .catch(() => showToast("회원 목록을 불러오지 못했습니다.", "error"))
      .finally(() => setMembersLoading(false))
  }

  useEffect(() => {
    fetchMembers(memberSearch, levelFilter, genderFilter)
  }, [])

  // 검색/필터 변경 시 디바운스 없이 즉시 요청 (입력 완료 후 엔터/버튼 방식이므로 괜찮음)
  function handleSearch(value: string) {
    setMemberSearch(value)
  }

  function handleLevelFilter(value: BadmintonLevel | "all") {
    setLevelFilter(value)
    fetchMembers(memberSearch, value, genderFilter)
  }

  function handleGenderFilter(value: "all" | "male" | "female") {
    setGenderFilter(value)
    fetchMembers(memberSearch, levelFilter, value)
  }

  function handleSearchSubmit() {
    fetchMembers(memberSearch, levelFilter, genderFilter)
  }

  if (!currentUser.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <ShieldOff className="size-12 text-muted-foreground/40" />
        <div>
          <p className="font-semibold">접근 권한이 없습니다</p>
          <p className="mt-1 text-sm text-muted-foreground">관리자만 사용할 수 있는 페이지입니다</p>
        </div>
        <Button variant="outline" onClick={() => onNavigate("home")}>홈으로 돌아가기</Button>
      </div>
    )
  }

  const levelStats = LEVELS.map((l) => ({ level: l, count: members.filter((m) => m.level === l).length }))
  const selectedSession = sessions.find((s) => s.id === selectedSessionId)

  // 정모 생성 서브뷰
  if (sessionsView === "create") {
    return (
      <CreateSession
        organizer={currentUser.name}
        onSubmit={async (data) => {
          await onCreateSession(data, currentUser.id)
          setSessionsView("list")
        }}
        onBack={() => setSessionsView("list")}
      />
    )
  }

  // 정모 수정 서브뷰
  if (sessionsView === "edit" && selectedSession) {
    return (
      <CreateSession
        organizer={currentUser.name}
        initialData={selectedSession}
        onSubmit={async (data) => {
          await onEditSession(selectedSession.id, data)
          setSessionsView("detail")
        }}
        onBack={() => setSessionsView("detail")}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* 헤더 */}
      {sessionsView === "detail" && selectedSession ? (
        <button
          onClick={() => { setSessionsView("list"); setSelectedSessionId(null); onAdminSelectSession(null) }}
          className="-mx-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          관리자
        </button>
      ) : (
        <h1 className="text-xl font-bold">관리자</h1>
      )}

      {sessionsView === "detail" && selectedSession ? (
        <SessionPaymentManager
          session={selectedSession}
          onConfirm={(memberId) => onConfirmPayment(selectedSession.id, memberId)}
          onConfirmAll={() => onConfirmAll(selectedSession.id)}
          onCancel={(memberId) => onCancelParticipant(selectedSession.id, memberId)}
          onPromote={(memberId) => onPromoteFromWaitlist(selectedSession.id, memberId)}
          onUpdateStatus={(status) => onUpdateSessionStatus(selectedSession.id, status)}
          onEdit={() => setSessionsView("edit")}
          onDelete={() => onDeleteSession(selectedSession.id)}
          onStartPlay={() => onNavigate("session-play", selectedSession.id)}
        />
      ) : (
        <>
          <div className="flex gap-1 rounded-xl bg-muted p-1">
            {(["sessions", "members"] as AdminTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors",
                  tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "sessions" ? "정모 관리" : "회원 관리"}
              </button>
            ))}
          </div>

          {tab === "sessions" && (
            <SessionsAdmin
              sessions={sessions}
              onSelectSession={(id) => { setSelectedSessionId(id); setSessionsView("detail"); onAdminSelectSession(id) }}
              onCreateSession={() => setSessionsView("create")}
            />
          )}
          {tab === "members" && (
            <MembersAdmin
              members={members}
              search={memberSearch}
              onSearch={handleSearch}
              onSearchSubmit={handleSearchSubmit}
              levelFilter={levelFilter}
              onLevelFilter={handleLevelFilter}
              genderFilter={genderFilter}
              onGenderFilter={handleGenderFilter}
              levelStats={levelStats}
              loading={membersLoading}
            />
          )}
        </>
      )}
    </div>
  )
}

/* ── 정모별 참가비 관리 뷰 ──────────────────────────────── */
function SessionPaymentManager({
  session, onConfirm, onConfirmAll, onCancel, onPromote, onUpdateStatus, onEdit, onDelete, onStartPlay,
}: {
  session: BbangSession
  onConfirm: (memberId: string) => Promise<void>
  onConfirmAll: () => Promise<void>
  onCancel: (memberId: string) => Promise<void>
  onPromote: (memberId: string) => Promise<void>
  onUpdateStatus: (status: SessionStatus) => Promise<void>
  onEdit: () => void
  onDelete: () => void
  onStartPlay: () => void
}) {
  const [cancelTarget, setCancelTarget] = useState<{ memberId: string; name: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const [showConfirmAllConfirm, setShowConfirmAllConfirm] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const pending   = session.participants.filter((p) => p.status === "pending")
  const confirmed = session.participants.filter((p) => p.status === "confirmed")
  const waitlisted = session.participants.filter((p) => p.status === "waitlisted")
  const cancelled = session.participants.filter((p) => p.status === "cancelled")

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-start justify-between">
          <h2 className="font-bold">{session.title}</h2>
          <Badge variant={STATUS_CONFIG[session.status].variant}>{STATUS_CONFIG[session.status].label}</Badge>
        </div>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" /> {formatDate(session.date)} · {formatTime(session.startTime)}~{formatTime(session.endTime)}</span>
          <span className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {session.location}</span>
        </div>
        <div className="mt-3 flex gap-3 border-t border-border pt-3 text-sm">
          {[
            { label: "확정",     value: confirmed.length,  color: "text-primary" },
            { label: "입금대기", value: pending.length,    color: "text-amber-500" },
            { label: "대기",     value: waitlisted.length, color: "text-muted-foreground" },
            { label: "취소",     value: cancelled.length,  color: "text-muted-foreground" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-1 flex-col items-center">
              <span className={cn("text-lg font-bold", color)}>{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* 상태 변경 */}
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex flex-wrap gap-2">
            {session.status === "open" && (
              <Button size="sm" variant="outline" disabled={loadingId === "status"} onClick={async () => {
                setLoadingId("status")
                await onUpdateStatus("closed")
                setLoadingId(null)
              }}>
                <LockKeyhole className="size-3.5" />{loadingId === "status" ? "처리 중..." : "모집 마감"}
              </Button>
            )}
            {session.status === "closed" && (
              <Button size="sm" variant="outline" disabled={loadingId === "status"} onClick={async () => {
                setLoadingId("status")
                await onUpdateStatus("open")
                setLoadingId(null)
              }}>
                <Unlock className="size-3.5" />{loadingId === "status" ? "처리 중..." : "모집 재개"}
              </Button>
            )}
            {session.status !== "completed" && session.status !== "cancelled" && (
              <Button size="sm" variant="outline" disabled={loadingId === "status"} onClick={() => setShowCompleteConfirm(true)}>
                <Flag className="size-3.5" />{loadingId === "status" ? "처리 중..." : "종료 처리"}
              </Button>
            )}
          </div>
          {session.status !== "completed" && session.participants.filter(p => p.status === "confirmed").length > 0 && (
            <Button
              size="sm"
              className="mt-2 w-full"
              onClick={onStartPlay}
            >
              <Play className="size-3.5" />정모 진행
            </Button>
          )}
          <div className="mt-2 flex gap-2 border-t border-border pt-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={onEdit}>
              <Pencil className="size-3.5" />수정
            </Button>
            <Button size="sm" variant="destructive" className="flex-1" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="size-3.5" />삭제
            </Button>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <Clock className="size-4 text-amber-500" />
            입금 대기 ({pending.length}명)
          </h3>
          {pending.length > 1 && (
            <Button size="sm" variant="outline" disabled={loadingId === "confirmAll"} onClick={() => setShowConfirmAllConfirm(true)}>
              <CheckCircle2 className="size-3.5" />
              {loadingId === "confirmAll" ? "처리 중..." : "전체 확정"}
            </Button>
          )}
        </div>
        {pending.length === 0 ? (
          <p className="rounded-xl bg-muted py-6 text-center text-sm text-muted-foreground">대기 중인 참가자가 없습니다</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map((p) => (
              <div key={p.memberId} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.memberName}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", LEVEL_COLORS[p.level])}>{p.level}급</span>
                  </div>
                  <span className="text-xs text-muted-foreground">신청일: {p.reservedAt}</span>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" disabled={loadingId === p.memberId} onClick={async () => {
                    setLoadingId(p.memberId)
                    await onConfirm(p.memberId)
                    setLoadingId(null)
                  }}><CheckCircle2 className="size-3.5" />{loadingId === p.memberId ? "처리 중..." : "확정"}</Button>
                  <Button size="sm" variant="destructive" disabled={loadingId === p.memberId} onClick={() => setCancelTarget({ memberId: p.memberId, name: p.memberName })}><XCircle className="size-3.5" />취소</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {waitlisted.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <Users className="size-4 text-muted-foreground" />
            대기자 ({waitlisted.length}명)
          </h3>
          <div className="flex flex-col gap-2">
            {waitlisted.map((p, i) => (
              <div key={p.memberId} className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.memberName}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", LEVEL_COLORS[p.level])}>{p.level}급</span>
                  </div>
                  <span className="text-xs text-muted-foreground">대기 신청일: {p.reservedAt}</span>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" disabled={loadingId === p.memberId} onClick={async () => {
                    setLoadingId(p.memberId)
                    await onPromote(p.memberId)
                    setLoadingId(null)
                  }}>{loadingId === p.memberId ? "처리 중..." : "입금요청"}</Button>
                  <Button size="sm" variant="destructive" disabled={loadingId === p.memberId} onClick={() => setCancelTarget({ memberId: p.memberId, name: p.memberName })}><XCircle className="size-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="size-4 text-green-500" />
          확정 ({confirmed.length}명)
        </h3>
        <div className="flex flex-col gap-2">
          {confirmed.map((p) => (
            <div key={p.memberId} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.memberName}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", LEVEL_COLORS[p.level])}>{p.level}급</span>
                  {p.usedFreeTicket && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">무료권</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">확정일: {p.reservedAt}</span>
              </div>
              <Badge variant="success">확정</Badge>
            </div>
          ))}
          {confirmed.length === 0 && (
            <p className="rounded-xl bg-muted py-4 text-center text-sm text-muted-foreground">확정된 참가자가 없습니다</p>
          )}
        </div>
      </section>

      {cancelTarget && (
        <ConfirmDialog
          message={`${cancelTarget.name} 님의 참가를 취소하시겠습니까?`}
          confirmLabel="참가 취소"
          onConfirm={async () => {
            const memberId = cancelTarget.memberId
            setCancelTarget(null)
            setLoadingId(memberId)
            await onCancel(memberId)
            setLoadingId(null)
          }}
          onCancel={() => setCancelTarget(null)}
        />
      )}
      {showDeleteConfirm && (
        <ConfirmDialog
          message={`'${session.title}' 정모를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          onConfirm={() => { setShowDeleteConfirm(false); onDelete() }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
      {showCompleteConfirm && (
        <ConfirmDialog
          message={`'${session.title}' 정모를 종료 처리하시겠습니까? 확정 참가자의 참여 횟수가 집계되고 무료권이 적립됩니다.`}
          confirmLabel="종료 처리"
          onConfirm={async () => {
            setShowCompleteConfirm(false)
            setLoadingId("status")
            await onUpdateStatus("completed")
            setLoadingId(null)
          }}
          onCancel={() => setShowCompleteConfirm(false)}
        />
      )}
      {showConfirmAllConfirm && (
        <ConfirmDialog
          message={`입금 대기 중인 ${pending.length}명을 전체 확정하시겠습니까?`}
          confirmLabel="전체 확정"
          onConfirm={async () => {
            setShowConfirmAllConfirm(false)
            setLoadingId("confirmAll")
            await onConfirmAll()
            setLoadingId(null)
          }}
          onCancel={() => setShowConfirmAllConfirm(false)}
        />
      )}
    </div>
  )
}

/* ── 정모 목록 ────────────────────────────────────────── */
function SessionsAdmin({
  sessions, onSelectSession, onCreateSession,
}: {
  sessions: BbangSession[]
  onSelectSession: (id: string) => void
  onCreateSession: () => void
}) {
  const sorted = [...sessions].sort((a, b) => {
    const aActive = a.status === "open" || a.status === "closed"
    const bActive = b.status === "open" || b.status === "closed"
    if (aActive && !bActive) return -1
    if (!aActive && bActive) return 1
    // 활성 정모는 날짜 임박순, 나머지는 최신순
    if (aActive) return new Date(a.date).getTime() - new Date(b.date).getTime()
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">총 {sessions.length}개</span>
        <Button size="sm" onClick={onCreateSession}>
          <Plus className="size-4" />
          정모 생성
        </Button>
      </div>

      {sorted.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <CalendarDays className="size-10 opacity-40" />
          <div className="text-center">
            <p className="text-sm font-medium">아직 정모가 없습니다</p>
            <p className="mt-1 text-xs">정모 생성 버튼을 눌러 첫 번째 모임을 만들어보세요</p>
          </div>
        </div>
      )}
      {sorted.map((session) => {
        const status = STATUS_CONFIG[session.status]
        const pendingCount  = session.participants.filter((p) => p.status === "pending").length
        const waitlistCount = session.participants.filter((p) => p.status === "waitlisted").length
        return (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:shadow-sm"
          >
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{session.title}</span>
                <Badge variant={status.variant}>{status.label}</Badge>
                {pendingCount > 0 && <Badge variant="warning">{pendingCount} 입금대기</Badge>}
                {waitlistCount > 0 && <Badge variant="outline">{waitlistCount} 대기자</Badge>}
              </div>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarDays className="size-3" />{formatDate(session.date)} · {formatTime(session.startTime)}~{formatTime(session.endTime)}</span>
                <span className="flex items-center gap-1"><Users className="size-3" />확정 {session.participants.filter((p) => p.status === "confirmed").length}/{session.maxParticipants}명 · {formatFee(session.fee)}</span>
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )
      })}
    </div>
  )
}

/* ── 회원 관리 ───────────────────────────────────────── */
function MembersAdmin({
  members, search, onSearch, onSearchSubmit, levelFilter, onLevelFilter, genderFilter, onGenderFilter, levelStats, loading,
}: {
  members: Member[]
  search: string
  onSearch: (v: string) => void
  onSearchSubmit: () => void
  levelFilter: BadmintonLevel | "all"
  onLevelFilter: (v: BadmintonLevel | "all") => void
  genderFilter: "all" | "male" | "female"
  onGenderFilter: (v: "all" | "male" | "female") => void
  levelStats: { level: BadmintonLevel; count: number }[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 py-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-5 gap-2">
        {levelStats.map(({ level, count }) => (
          <div key={level} className={cn("flex flex-col items-center gap-1 rounded-xl p-3", LEVEL_COLORS[level])}>
            <span className="text-lg font-bold">{count}</span>
            <span className="text-xs font-semibold">{level}급</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="이름 또는 전화번호 검색 후 엔터"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
            className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "male", "female"] as const).map((g) => (
            <button
              key={g}
              onClick={() => onGenderFilter(g)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                genderFilter === g
                  ? g === "all"
                    ? "bg-primary text-primary-foreground"
                    : g === "male"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                      : "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {g === "all" ? "전체" : g === "male" ? "남성" : "여성"}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(["all", ...LEVELS] as (BadmintonLevel | "all")[]).map((l) => (
            <button
              key={l}
              onClick={() => onLevelFilter(l)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                levelFilter === l
                  ? l === "all" ? "bg-primary text-primary-foreground" : LEVEL_COLORS[l as BadmintonLevel]
                  : "bg-muted text-muted-foreground"
              )}
            >
              {l === "all" ? "전체" : `${l}급`}
            </button>
          ))}
        </div>
      </div>

      <span className="text-sm text-muted-foreground">{members.length}명</span>

      <div className="flex flex-col gap-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold", LEVEL_COLORS[member.level])}>
              {member.level}
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-medium">{member.name}</span>
                <span className="text-xs text-muted-foreground">
                  {member.gender === "male" ? "남" : "여"} · {member.birthdate.replace(/-/g, ".")}
                </span>
                {member.isAdmin && <span className="text-xs font-semibold text-primary">관리자</span>}
              </div>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="size-3" /> {member.phone}
              </span>
              <span className="text-xs text-muted-foreground">가입 {member.joinedAt.slice(0, 10).replace(/-/g, ".")}</span>
              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                <span>총 <span className="font-semibold text-foreground">{member.totalAttendance}</span>회</span>
                <span>이번 달 <span className="font-semibold text-foreground">{member.monthlyAttendance}</span>회</span>
                {member.freeTickets > 0 && (
                  <span className="font-semibold text-primary">무료권 {member.freeTickets}장</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">검색 결과가 없습니다</p>
        )}
      </div>
    </div>
  )
}
