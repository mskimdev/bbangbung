import { useState, useEffect } from "react"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { LEVEL_COLORS, formatDate, formatTime } from "@/lib/badminton"
import { courtsApi } from "@/lib/api"
import type { BbangSession, CourtSlotApi, Page, SessionParticipant } from "@/types"

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8080") + "/api"

interface MatchingPageProps {
  session: BbangSession
  currentUserId: string
  onNavigate: (page: Page) => void
}

export function MatchingPage({ session, currentUserId, onNavigate }: MatchingPageProps) {
  const confirmed = session.participants.filter((p) => p.status === "confirmed")
  const byId      = Object.fromEntries(confirmed.map((p) => [p.memberId, p]))

  const [courts, setCourts] = useState<CourtSlotApi[]>([])

  // 초기 로드 + SSE 구독
  useEffect(() => {
    courtsApi.get(session.id).then((res) => setCourts(res.data)).catch(() => {})

    const token = localStorage.getItem("token")
    if (!token) return

    let es: EventSource
    let closed = false

    function connect() {
      es = new EventSource(
        `${BASE_URL}/sessions/${session.id}/stream?token=${encodeURIComponent(token!)}`,
      )
      es.addEventListener("court-update", (e) => {
        try {
          setCourts(JSON.parse(e.data) as CourtSlotApi[])
        } catch {}
      })
      es.onerror = () => {
        if (closed) return
        es.close()
        setTimeout(() => { if (!closed) connect() }, 3000)
      }
    }

    connect()
    return () => {
      closed = true
      es?.close()
    }
  }, [session.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // courtNumber <= session.courtCount → 실제 코트, 초과 → 대기 게임
  const realCourts   = courts.filter((c) => c.courtNumber <= session.courtCount)
  const pendingGames = courts.filter((c) => c.courtNumber > session.courtCount)

  // 코트·대기게임에 있는 멤버 ID (대기열 계산에서 제외)
  const onCourtIds   = new Set(courts.flatMap((c) => c.slots.filter(Boolean)))
  const queue        = confirmed.filter((p) => !onCourtIds.has(p.memberId))

  const playingCount = realCourts
    .filter((c) => c.status === "playing")
    .reduce((s, c) => s + c.slots.filter(Boolean).length, 0)

  return (
    <div className="flex flex-col gap-4 pb-28">
      {/* 헤더 */}
      <button
        onClick={() => onNavigate("session-detail")}
        className="-mx-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        정모 상세
      </button>

      <div>
        <h1 className="text-xl font-bold">코트 현황</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {session.title} · {formatDate(session.date)} {formatTime(session.startTime)}
        </p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "경기 중",  value: `${playingCount}명` },
          { label: "대기 중",  value: `${queue.length}명` },
          { label: "전체 확정", value: `${confirmed.length}명` },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center rounded-xl bg-muted py-2.5 gap-0.5">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="font-bold text-sm">{value}</span>
          </div>
        ))}
      </div>

      {/* 코트 현황 */}
      {realCourts.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          아직 배정된 코트가 없습니다
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {realCourts.map((court) => (
            <CourtView key={court.courtNumber} court={court} byId={byId} currentUserId={currentUserId} />
          ))}
        </div>
      )}

      {/* 대기 게임 */}
      {pendingGames.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-sm">대기 게임</h2>
            <span className="text-xs text-muted-foreground">{pendingGames.length}게임</span>
          </div>
          <div className="flex flex-col gap-2">
            {pendingGames.map((game, i) => (
              <div key={game.courtNumber} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between bg-muted/50 px-4 py-2.5">
                  <span className="text-sm font-semibold text-muted-foreground">{i + 1}번째 대기</span>
                  <span className="text-xs text-muted-foreground">{game.slots.filter(Boolean).length}명</span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3">
                  {game.slots.map((id, pos) => {
                    const player = id ? (byId[id] ?? null) : null
                    if (!player) return <div key={pos} className="h-9 rounded-lg border-2 border-dashed border-border/40" />
                    const isMe   = player.memberId === currentUserId
                    const isMale = player.gender === "male"
                    return (
                      <div key={pos} className={cn(
                        "flex h-9 items-center gap-2 rounded-lg border px-2",
                        isMe
                          ? "border-primary bg-primary/10 ring-1 ring-primary dark:bg-primary/20"
                          : isMale
                            ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                            : "border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-900/20",
                      )}>
                        <span className={cn("size-5 shrink-0 rounded-full text-center text-xs font-bold leading-5", LEVEL_COLORS[player.level])}>
                          {player.level}
                        </span>
                        <span className={cn("truncate text-sm", isMe && "font-semibold")}>{player.memberName}</span>
                        {isMe && <span className="ml-auto shrink-0 text-xs font-bold text-primary">나</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 대기열 */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-sm">대기 중</h2>
          <span className="text-xs text-muted-foreground">{queue.length}명</span>
        </div>
        {queue.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">대기 중인 참가자가 없습니다</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {queue.map((p, i) => (
              <QueueChip key={p.memberId} player={p} position={i + 1} isMe={p.memberId === currentUserId} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function CourtView({
  court,
  byId,
  currentUserId,
}: {
  court: CourtSlotApi
  byId: Record<string, SessionParticipant>
  currentUserId: string
}) {
  const isPlaying  = court.status === "playing"
  const players    = court.slots.map((id) => (id ? (byId[id] ?? null) : null))
  const filled     = players.filter(Boolean).length
  const isMyCourt  = players.some((p) => p?.memberId === currentUserId)

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border bg-card transition-colors",
      isMyCourt  ? "border-primary" :
      isPlaying  ? "border-primary/40" : "border-border",
    )}>
      <div className={cn(
        "flex items-center justify-between px-4 py-2.5",
        isMyCourt  ? "bg-primary/15" :
        isPlaying  ? "bg-primary/10" : "bg-muted/50",
      )}>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{court.courtNumber}번 코트</span>
          {isMyCourt && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              내 코트
            </span>
          )}
          {!isMyCourt && isPlaying && (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
              경기 중
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{filled}명</span>
      </div>

      {filled === 0 ? (
        <div className="px-4 py-5 text-center text-sm text-muted-foreground">배정 없음</div>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-3">
          {players.map((player, i) =>
            player ? (
              <PlayerChip key={i} player={player} isMe={player.memberId === currentUserId} />
            ) : (
              <div key={i} className="h-9 rounded-lg border-2 border-dashed border-border/40" />
            ),
          )}
        </div>
      )}
    </div>
  )
}

function PlayerChip({ player, isMe }: { player: SessionParticipant; isMe: boolean }) {
  const isMale = player.gender === "male"
  return (
    <div className={cn(
      "flex h-9 items-center gap-2 rounded-lg border px-2",
      isMe
        ? "border-primary bg-primary/10 ring-1 ring-primary dark:bg-primary/20"
        : isMale
          ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
          : "border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-900/20",
    )}>
      <span className={cn("size-5 shrink-0 rounded-full text-center text-xs font-bold leading-5", LEVEL_COLORS[player.level])}>
        {player.level}
      </span>
      <span className={cn("truncate text-sm", isMe && "font-semibold")}>{player.memberName}</span>
      {isMe && <span className="ml-auto shrink-0 text-xs font-bold text-primary">나</span>}
    </div>
  )
}

function QueueChip({ player, position, isMe }: { player: SessionParticipant; position: number; isMe: boolean }) {
  const isMale = player.gender === "male"
  return (
    <div className={cn(
      "flex items-center gap-1.5 rounded-full border px-3 py-1",
      isMe
        ? "border-primary bg-primary/10 ring-1 ring-primary dark:bg-primary/20"
        : isMale
          ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
          : "border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-900/20",
    )}>
      <span className={cn("text-xs", isMe ? "font-bold text-primary" : "text-muted-foreground")}>{position}</span>
      <span className={cn("size-5 rounded-full text-center text-xs font-bold leading-5", LEVEL_COLORS[player.level])}>
        {player.level}
      </span>
      <span className={cn("text-sm", isMe && "font-semibold")}>{player.memberName}</span>
      {isMe && <span className="text-xs font-bold text-primary">나</span>}
    </div>
  )
}

// ─── 미리보기 (세션 미선택 상태용) ────────────────────────────────────────────

export function MatchingPagePreview() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <p className="text-lg font-semibold">코트 현황</p>
      <p className="text-sm text-muted-foreground">정모를 선택하면 실시간 코트 배정 현황을 볼 수 있습니다.</p>
    </div>
  )
}
