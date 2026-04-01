import { CalendarDays, MapPin, Clock, ChevronRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  LEVEL_COLORS,
  STATUS_CONFIG,
  formatDate,
  formatFee,
} from "@/lib/badminton"
import type { BbangSession, Member, Page, Reservation } from "@/types"

interface HomeProps {
  currentUser: Member
  sessions: BbangSession[]
  reservations: Reservation[]
  onNavigate: (page: Page, sessionId?: string) => void
}

const RESERVATION_BADGE = {
  confirmed:  { label: "예약 확정",   variant: "success"  as const },
  pending:    { label: "입금 확인 중", variant: "warning"  as const },
  waitlisted: { label: "대기 중",     variant: "outline"  as const },
  cancelled:  { label: "취소됨",      variant: "destructive" as const },
}

export function Home({ currentUser, sessions, reservations, onNavigate }: HomeProps) {
  const todayStr = new Date().toLocaleDateString("sv") // "YYYY-MM-DD" 로컬 기준
  const upcomingSessions = sessions
    .filter((s) => s.status === "open" && s.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)

  const activeReservations = reservations
    .filter((r) => (r.status === "confirmed" || r.status === "pending" || r.status === "waitlisted") && r.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))

  const pendingCount = activeReservations.filter((r) => r.status === "pending").length
  const confirmedCount = activeReservations.filter((r) => r.status === "confirmed").length

  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* Header */}
      <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
        <div className="flex items-start justify-between">
          <p className="text-sm opacity-80">안녕하세요!</p>
          <button
            onClick={() => onNavigate("profile")}
            className="rounded-lg px-2 py-1 text-xs opacity-70 transition-opacity hover:opacity-100"
          >
            내 정보 &rsaquo;
          </button>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-xl font-bold">{currentUser.name}님</h1>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
            {currentUser.level}급
          </span>
          {currentUser.isAdmin && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
              관리자
            </span>
          )}
        </div>
        <div className="mt-3 flex gap-3 text-sm opacity-80">
          <span>예약 확정 {confirmedCount}건</span>
          {pendingCount > 0 && <span className="text-yellow-200">· 입금 대기 {pendingCount}건</span>}
        </div>
      </div>

      {/* 입금 대기 알림 */}
      {pendingCount > 0 && (
        <div
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
          onClick={() => onNavigate("my-reservations")}
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              입금 대기 {pendingCount}건
            </p>
            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
              계좌이체 후 관리자 확인을 기다리고 있습니다
            </p>
          </div>
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-amber-400" />
        </div>
      )}

      {/* 내 예정 모임 */}
      {activeReservations.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">내 예정 모임</h2>
            <button
              onClick={() => onNavigate("my-reservations")}
              className="flex items-center gap-0.5 text-sm text-primary"
            >
              전체보기 <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {activeReservations.map((res) => {
              const badge = RESERVATION_BADGE[res.status]
              return (
                <button
                  key={res.id}
                  onClick={() => onNavigate("session-detail", res.sessionId)}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition hover:shadow-sm"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{res.sessionTitle}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(res.date)} · {res.startTime}~{res.endTime}
                    </span>
                    <span className="text-sm text-muted-foreground">{res.location}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <span className="text-sm font-medium text-primary">{formatFee(res.fee)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Upcoming sessions */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">다가오는 정모</h2>
          <button
            onClick={() => onNavigate("sessions")}
            className="flex items-center gap-0.5 text-sm text-primary"
          >
            전체보기 <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {upcomingSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onClick={() => onNavigate("session-detail", session.id)}
            />
          ))}
          {upcomingSessions.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <CalendarDays className="size-10 opacity-40" />
              <div className="text-center">
                <p className="text-sm font-medium">예정된 정모가 없습니다</p>
                <p className="mt-1 text-xs">곧 새로운 모임이 열릴 예정이에요</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onNavigate("sessions")}>
                전체 목록 보기
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function SessionCard({
  session,
  onClick,
}: {
  session: BbangSession
  onClick: () => void
}) {
  const confirmedCount = session.participants.filter((p) => p.status === "confirmed").length
  const pct = Math.round((confirmedCount / session.maxParticipants) * 100)
  const status = STATUS_CONFIG[session.status]
  const spotsLeft = session.maxParticipants - confirmedCount

  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{session.title}</h3>
          {session.levelRestriction && (
            <div className="mt-1 flex gap-1">
              {session.levelRestriction.map((l) => (
                <span
                  key={l}
                  className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", LEVEL_COLORS[l])}
                >
                  {l}급
                </span>
              ))}
            </div>
          )}
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" />
          {formatDate(session.date)} · {session.startTime}~{session.endTime}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          {session.location}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" />
          코트 {session.courtCount}면 · {formatFee(session.fee)}
        </span>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>
            {confirmedCount}/{session.maxParticipants}명
          </span>
          <span className={spotsLeft <= 3 ? "text-destructive font-medium" : ""}>
            {spotsLeft > 0 ? `잔여 ${spotsLeft}자리` : "마감"}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-amber-500" : "bg-primary"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </button>
  )
}

export { SessionCard }
