import { useState } from "react"
import { Plus, Search, CalendarDays, MapPin, Users, Phone, ChevronRight, ChevronLeft, CheckCircle2, XCircle, Clock, ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { LEVEL_COLORS, STATUS_CONFIG, formatDate, formatFee } from "@/lib/badminton"
import { CreateSession } from "@/pages/CreateSession"
import type { BadmintonLevel, BbangSession, Member, Page } from "@/types"

const LEVELS: BadmintonLevel[] = ["S", "A", "B", "C", "D"]

interface AdminProps {
  sessions: BbangSession[]
  members: Member[]
  currentUser: Member
  onNavigate: (page: Page, sessionId?: string) => void
  onConfirmPayment: (sessionId: string, memberId: string) => void
  onCancelParticipant: (sessionId: string, memberId: string) => void
  onPromoteFromWaitlist: (sessionId: string, memberId: string) => void
  onCreateSession: (session: Omit<BbangSession, "id" | "currentParticipants" | "participants" | "status">) => void
}

type AdminTab = "sessions" | "members"
type SessionsView = "list" | "create" | "detail"

export function Admin({ sessions, members, currentUser, onNavigate, onConfirmPayment, onCancelParticipant, onPromoteFromWaitlist, onCreateSession }: AdminProps) {
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

  const [tab, setTab] = useState<AdminTab>("sessions")
  const [sessionsView, setSessionsView] = useState<SessionsView>("list")
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [memberSearch, setMemberSearch] = useState("")
  const [levelFilter, setLevelFilter] = useState<BadmintonLevel | "all">("all")

  const filteredMembers = members.filter((m) => {
    const matchSearch = memberSearch === "" || m.name.includes(memberSearch) || m.phone.includes(memberSearch)
    const matchLevel = levelFilter === "all" || m.level === levelFilter
    return matchSearch && matchLevel
  })

  const levelStats = LEVELS.map((l) => ({ level: l, count: members.filter((m) => m.level === l).length }))
  const selectedSession = sessions.find((s) => s.id === selectedSessionId)

  // 정모 생성 서브뷰
  if (sessionsView === "create") {
    return (
      <CreateSession
        organizer={currentUser.name}
        onSubmit={(data) => {
          onCreateSession(data)
          setSessionsView("list")
        }}
        onBack={() => setSessionsView("list")}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* 헤더 */}
      {sessionsView === "detail" && selectedSession ? (
        <button
          onClick={() => { setSessionsView("list"); setSelectedSessionId(null) }}
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
          onCancel={(memberId) => onCancelParticipant(selectedSession.id, memberId)}
          onPromote={(memberId) => onPromoteFromWaitlist(selectedSession.id, memberId)}
          onViewDetail={() => onNavigate("session-detail", selectedSession.id)}
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
              onSelectSession={(id) => { setSelectedSessionId(id); setSessionsView("detail") }}
              onCreateSession={() => setSessionsView("create")}
              onViewDetail={(id) => onNavigate("session-detail", id)}
            />
          )}
          {tab === "members" && (
            <MembersAdmin
              members={filteredMembers}
              allMembers={members}
              search={memberSearch}
              onSearch={setMemberSearch}
              levelFilter={levelFilter}
              onLevelFilter={setLevelFilter}
              levelStats={levelStats}
            />
          )}
        </>
      )}
    </div>
  )
}

/* ── 정모별 참가비 관리 뷰 ──────────────────────────────── */
function SessionPaymentManager({
  session, onConfirm, onCancel, onPromote, onViewDetail,
}: {
  session: BbangSession
  onConfirm: (memberId: string) => void
  onCancel: (memberId: string) => void
  onPromote: (memberId: string) => void
  onViewDetail: () => void
}) {
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
          <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" /> {formatDate(session.date)} · {session.startTime}~{session.endTime}</span>
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
          <button onClick={onViewDetail} className="flex flex-1 flex-col items-center text-xs text-primary hover:underline">
            <ChevronRight className="size-5" />
            <span>상세보기</span>
          </button>
        </div>
      </div>

      <section>
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <Clock className="size-4 text-amber-500" />
          입금 대기 ({pending.length}명)
        </h3>
        {pending.length === 0 ? (
          <p className="rounded-xl bg-muted py-6 text-center text-sm text-muted-foreground">대기 중인 참가자가 없습니다</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map((p) => (
              <div key={p.memberId} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                <span className="text-xl">{p.gender === "male" ? "👨" : "👩"}</span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.memberName}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", LEVEL_COLORS[p.level])}>{p.level}급</span>
                  </div>
                  <span className="text-xs text-muted-foreground">신청일: {p.reservedAt}</span>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => onConfirm(p.memberId)}><CheckCircle2 className="size-3.5" />확정</Button>
                  <Button size="sm" variant="destructive" onClick={() => onCancel(p.memberId)}><XCircle className="size-3.5" />취소</Button>
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
                <span className="text-xl">{p.gender === "male" ? "👨" : "👩"}</span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.memberName}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", LEVEL_COLORS[p.level])}>{p.level}급</span>
                  </div>
                  <span className="text-xs text-muted-foreground">대기 신청일: {p.reservedAt}</span>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => onPromote(p.memberId)}>입금요청</Button>
                  <Button size="sm" variant="destructive" onClick={() => onCancel(p.memberId)}><XCircle className="size-3.5" /></Button>
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
              <span className="text-xl">{p.gender === "male" ? "👨" : "👩"}</span>
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.memberName}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", LEVEL_COLORS[p.level])}>{p.level}급</span>
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
    </div>
  )
}

/* ── 정모 목록 ────────────────────────────────────────── */
function SessionsAdmin({
  sessions, onSelectSession, onCreateSession, onViewDetail,
}: {
  sessions: BbangSession[]
  onSelectSession: (id: string) => void
  onCreateSession: () => void
  onViewDetail: (id: string) => void
}) {
  void onViewDetail
  const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">총 {sessions.length}개</span>
        <Button size="sm" onClick={onCreateSession}>
          <Plus className="size-4" />
          정모 생성
        </Button>
      </div>

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
                <span className="flex items-center gap-1"><CalendarDays className="size-3" />{formatDate(session.date)} · {session.startTime}~{session.endTime}</span>
                <span className="flex items-center gap-1"><Users className="size-3" />확정 {session.currentParticipants}/{session.maxParticipants}명 · {formatFee(session.fee)}</span>
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
  members, allMembers, search, onSearch, levelFilter, onLevelFilter, levelStats,
}: {
  members: Member[]
  allMembers: Member[]
  search: string
  onSearch: (v: string) => void
  levelFilter: BadmintonLevel | "all"
  onLevelFilter: (v: BadmintonLevel | "all") => void
  levelStats: { level: BadmintonLevel; count: number }[]
}) {
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
            placeholder="이름 또는 전화번호 검색"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
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

      <span className="text-sm text-muted-foreground">{members.length}명 / 전체 {allMembers.length}명</span>

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
