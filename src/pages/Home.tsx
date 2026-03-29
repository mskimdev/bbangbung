import { CalendarDays, MapPin, Clock, ChevronRight, Zap } from "lucide-react"
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

export function Home({ currentUser, sessions, reservations, onNavigate }: HomeProps) {
  const today = new Date()
  const upcomingSessions = sessions
    .filter((s) => s.status === "open" && new Date(s.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  const upcomingReservations = reservations.filter(
    (r) => r.status === "confirmed" && new Date(r.date) >= today
  )

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
        <div className="mt-3 flex gap-3">
          <div className="flex items-center gap-1 text-sm opacity-80">
            <Zap className="size-4" />
            <span>예약 {upcomingReservations.length}건 대기 중</span>
          </div>
        </div>
      </div>

      {/* Upcoming reservations */}
      {upcomingReservations.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">내 예정 모임</h2>
          <div className="flex flex-col gap-2">
            {upcomingReservations.map((res) => (
              <button
                key={res.id}
                onClick={() => onNavigate("session-detail", res.sessionId)}
                className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4 text-left transition hover:bg-primary/10"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{res.sessionTitle}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(res.date)} · {res.startTime}~{res.endTime}
                  </span>
                  <span className="text-sm text-muted-foreground">{res.location}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="success">예약 확정</Badge>
                  <span className="text-sm font-medium text-primary">{formatFee(res.fee)}</span>
                </div>
              </button>
            ))}
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
            <p className="py-8 text-center text-sm text-muted-foreground">
              예정된 정모가 없습니다
            </p>
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
  const pct = Math.round((session.currentParticipants / session.maxParticipants) * 100)
  const status = STATUS_CONFIG[session.status]
  const spotsLeft = session.maxParticipants - session.currentParticipants

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
            {session.currentParticipants}/{session.maxParticipants}명
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
