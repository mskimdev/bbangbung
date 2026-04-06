import { CalendarDays, MapPin, Clock, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"
import { formatDate, formatFee, formatTime } from "@/lib/badminton"
import type { Page, Reservation, ReservationStatus } from "@/types"
import { useState } from "react"

interface MyReservationsProps {
  reservations: Reservation[]
  onNavigate: (page: Page, sessionId?: string) => void
  onCancel: (reservationId: string) => Promise<void>
}

type Tab = "upcoming" | "past"

const STATUS_BADGE: Record<ReservationStatus, { label: string; variant: "success" | "secondary" | "destructive" | "outline" | "warning" }> = {
  confirmed:  { label: "예약 확정",  variant: "success" },
  pending:    { label: "입금 확인 중", variant: "warning" },
  waitlisted: { label: "대기 중",    variant: "outline" },
  cancelled:  { label: "취소됨",     variant: "destructive" },
}

export function MyReservations({ reservations, onNavigate, onCancel }: MyReservationsProps) {
  const [tab, setTab] = useState<Tab>("upcoming")
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const todayStr = new Date().toLocaleDateString("sv") // "YYYY-MM-DD" 로컬 기준
  const upcoming = reservations.filter(
    (r) => r.status !== "cancelled" && r.date >= todayStr
  )
  const past = reservations.filter(
    (r) => r.status !== "cancelled" && r.date < todayStr
  )

  const list = tab === "upcoming" ? upcoming : past

  return (
    <div className="flex flex-col gap-4 pb-4">
      <h1 className="text-xl font-bold">내 예약</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {(["upcoming", "past"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors",
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "upcoming" ? `예정 (${upcoming.length})` : `지난 모임 (${past.length})`}
          </button>
        ))}
      </div>

      {/* Reservation list */}
      <div className="flex flex-col gap-3">
        {list.map((res) => {
          const statusCfg = STATUS_BADGE[res.status]
          const isPast = res.date < todayStr
          return (
            <div
              key={res.id}
              className={cn(
                "flex flex-col gap-3 rounded-xl border border-border bg-card p-4",
                isPast && "opacity-70"
              )}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{res.sessionTitle}</h3>
                <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
              </div>

              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 shrink-0" />
                  {formatDate(res.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5 shrink-0" />
                  {formatTime(res.startTime)} ~ {formatTime(res.endTime)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  {res.location}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-semibold text-primary">
                  {res.usedFreeTicket ? "무료권 사용" : formatFee(res.fee)}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onNavigate("session-detail", res.sessionId)}
                  >
                    상세보기
                  </Button>
                  {(res.status === "confirmed" || res.status === "pending" || res.status === "waitlisted") && !isPast && (
                    <Button
                      variant="destructive"
                      onClick={() => setConfirmId(res.id)}
                    >
                      취소
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {list.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            {tab === "upcoming" ? (
              <>
                <CalendarDays className="size-10 opacity-40" />
                <p className="text-sm">예정된 예약이 없습니다</p>
                <Button variant="outline" size="sm" onClick={() => onNavigate("sessions")}>
                  정모 찾아보기
                </Button>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-10 opacity-40" />
                <p className="text-sm">지난 모임 기록이 없습니다</p>
              </>
            )}
          </div>
        )}
      </div>
      {confirmId && (
        <ConfirmDialog
          message="예약을 취소하시겠습니까?"
          confirmLabel={cancelling ? "취소 중..." : "예약 취소"}
          onConfirm={async () => {
            setCancelling(true)
            await onCancel(confirmId)
            setCancelling(false)
            setConfirmId(null)
          }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}
