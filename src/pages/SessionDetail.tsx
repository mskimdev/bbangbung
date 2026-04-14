import { useState } from "react"
import { ChevronLeft, MapPin, CalendarDays, Users, Layers, BanknoteIcon, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"
import { LEVEL_COLORS, STATUS_CONFIG, getLevelCounts, formatDate, formatFee, formatTime, BANK_ACCOUNT } from "@/lib/badminton"
import type { BadmintonLevel, BbangSession, Member, Page, Reservation } from "@/types"

const LEVELS: BadmintonLevel[] = ["S", "A", "B", "C", "D"]

interface SessionDetailProps {
  session: BbangSession
  currentUser: Member
  reservations: Reservation[]
  previousPage: Page
  onNavigate: (page: Page, sessionId?: string) => void
  onReserve: (sessionId: string, useFreeTicket?: boolean) => Promise<void>
  onWaitlist: (sessionId: string) => Promise<void>
  onCancel: (reservationId: string) => Promise<void>
  onToast: (message: string, type?: "success" | "error") => void
}

const BACK_LABEL: Partial<Record<Page, string>> = {
  home: "홈",
  sessions: "정모 목록",
  "my-reservations": "내 예약",
  "session-match": "코트 배정",
}

export function SessionDetail({
  session,
  currentUser,
  reservations,
  previousPage,
  onNavigate,
  onReserve,
  onWaitlist,
  onCancel,
  onToast,
}: SessionDetailProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showReserveSheet, setShowReserveSheet] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const status = STATUS_CONFIG[session.status]
  const levelCounts = getLevelCounts(session)

  const confirmedParticipants = session.participants.filter((p) => p.status === "confirmed")
  const pendingParticipants   = session.participants.filter((p) => p.status === "pending")
  const waitlistedParticipants = session.participants.filter((p) => p.status === "waitlisted")

  const maleCount   = confirmedParticipants.filter((p) => p.gender === "male").length
  const femaleCount = confirmedParticipants.filter((p) => p.gender === "female").length

  // 확정 + 입금대기 합산으로 실제 자리 계산 (대기자는 제외)
  const activeCount = session.participants.filter(
    (p) => p.status === "confirmed" || p.status === "pending"
  ).length
  const spotsLeft = session.maxParticipants - activeCount
  const pct = Math.round((activeCount / session.maxParticipants) * 100)

  const myParticipant = session.participants.find(
    (p) => p.memberId === currentUser.id && p.status !== "cancelled"
  )
  const myReservation = reservations.find(
    (r) => r.sessionId === session.id && r.status !== "cancelled"
  )

  const levelAllowed = !session.levelRestriction || session.levelRestriction.includes(currentUser.level)
  const isToday = new Date().toLocaleDateString("sv") === session.date && session.status !== "completed"

  // 대기 순번 (1부터)
  const myWaitlistPosition = waitlistedParticipants.findIndex(
    (p) => p.memberId === currentUser.id
  ) + 1

  return (
    <div className="flex flex-col gap-5 pb-28">
      {/* Back */}
      <button
        onClick={() => onNavigate(previousPage)}
        className="-mx-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {BACK_LABEL[previousPage] ?? "정모 목록"}
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{session.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">주최: {session.organizer}</p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {/* Info card */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <InfoRow icon={<CalendarDays className="size-4" />}>
          {formatDate(session.date)} · {formatTime(session.startTime)}~{formatTime(session.endTime)}
        </InfoRow>
        <InfoRow icon={<MapPin className="size-4" />}>
          <span className="font-medium">{session.location}</span>
          <span className="block text-xs text-muted-foreground">{session.address}</span>
        </InfoRow>
        <InfoRow icon={<Layers className="size-4" />}>
          코트 {session.courtCount}면
        </InfoRow>
        <InfoRow icon={<BanknoteIcon className="size-4" />}>
          참가비 <span className="font-semibold text-primary">{formatFee(session.fee)}</span>
          <span className="ml-1 text-xs text-muted-foreground">(계좌이체 후 관리자 확인)</span>
          <span className="mt-1 block text-xs text-muted-foreground">{BANK_ACCOUNT}</span>
        </InfoRow>
        {session.levelRestriction && (
          <InfoRow icon={<Users className="size-4" />}>
            <span className="mr-2 text-sm">참가 제한</span>
            <div className="inline-flex gap-1">
              {session.levelRestriction.map((l) => (
                <span key={l} className={cn("rounded-full px-2 py-0.5 text-xs font-bold", LEVEL_COLORS[l])}>
                  {l}급
                </span>
              ))}
            </div>
          </InfoRow>
        )}
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed text-muted-foreground">{session.description}</p>

      {/* Participants stats */}
      <section>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">참가 현황</span>
          <span className="text-muted-foreground">
            확정 {confirmedParticipants.length}/{session.maxParticipants}명
            {pendingParticipants.length > 0 && (
              <span className="ml-1 text-amber-600">(입금대기 {pendingParticipants.length})</span>
            )}
            {waitlistedParticipants.length > 0 && (
              <span className="ml-1 text-muted-foreground">(대기 {waitlistedParticipants.length})</span>
            )}
          </span>
        </div>

        {/* Progress bar — 확정+입금대기 기준 */}
        <div className="mb-1 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <p className="mb-4 text-right text-xs text-muted-foreground">
          {spotsLeft > 0 ? `잔여 ${spotsLeft}자리` : "정원 마감 · 대기 신청 가능"}
        </p>

        {/* Gender & level stats */}
        <div className="mb-4 flex gap-2">
          <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 py-3 dark:bg-blue-900/20">
            <div>
              <p className="text-xs text-muted-foreground">남</p>
              <p className="font-bold text-blue-700 dark:text-blue-300">{maleCount}명</p>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-pink-50 py-3 dark:bg-pink-900/20">
            <div>
              <p className="text-xs text-muted-foreground">여</p>
              <p className="font-bold text-pink-600 dark:text-pink-300">{femaleCount}명</p>
            </div>
          </div>
        </div>

        {/* Level distribution */}
        <div className="flex gap-2">
          {LEVELS.map((level) => (
            <div key={level} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-10 w-full items-end justify-center">
                {levelCounts[level] > 0 && (
                  <div
                    className={cn("w-full rounded-t-sm", LEVEL_COLORS[level].split(" ")[0])}
                    style={{ height: `${Math.max(8, (levelCounts[level] / session.maxParticipants) * 40)}px` }}
                  />
                )}
              </div>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", LEVEL_COLORS[level])}>
                {level}
              </span>
              <span className="text-xs text-muted-foreground">{levelCounts[level]}명</span>
            </div>
          ))}
        </div>
      </section>

      {/* Participant chips */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">참가자 목록</h2>
          {new Date().toLocaleDateString("sv") === session.date && confirmedParticipants.length > 0 && (
            <button
              onClick={() => onNavigate("session-match")}
              className="text-xs text-primary hover:underline"
            >
              코트 현황 보기 →
            </button>
          )}
        </div>
        {confirmedParticipants.length === 0 && pendingParticipants.length === 0 && waitlistedParticipants.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">아직 참가자가 없습니다</p>
        ) : (
          <div className="flex flex-col gap-3">
            {confirmedParticipants.length > 0 && (
              <ParticipantGroup label="입금 확정" labelColor="text-muted-foreground">
                {confirmedParticipants.map((p) => (
                  <ParticipantChip key={p.memberId} p={p} isSelf={p.memberId === currentUser.id} variant="confirmed" />
                ))}
              </ParticipantGroup>
            )}
            {pendingParticipants.length > 0 && (
              <ParticipantGroup label="입금 대기 중" labelColor="text-amber-600">
                {pendingParticipants.map((p) => (
                  <ParticipantChip key={p.memberId} p={p} isSelf={p.memberId === currentUser.id} variant="pending" />
                ))}
              </ParticipantGroup>
            )}
            {waitlistedParticipants.length > 0 && (
              <ParticipantGroup label="대기자" labelColor="text-muted-foreground">
                {waitlistedParticipants.map((p, i) => (
                  <ParticipantChip
                    key={p.memberId}
                    p={p}
                    isSelf={p.memberId === currentUser.id}
                    variant="waitlisted"
                    position={i + 1}
                  />
                ))}
              </ParticipantGroup>
            )}
          </div>
        )}
      </section>

      {/* Sticky CTA */}
      <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-lg">
          {myParticipant?.status === "confirmed" && myReservation ? (
            isToday ? (
              <div className="flex flex-col gap-2">
                <Button className="w-full" size="lg" onClick={() => onNavigate("session-match", session.id)}>
                  실시간 코트 현황 보기
                </Button>
                <button
                  disabled={actionLoading}
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-xs text-muted-foreground hover:text-destructive text-center"
                >
                  예약 취소
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">예약 확정</p>
                  <p className="text-xs text-muted-foreground">참가비 {formatFee(session.fee)} 납부 완료</p>
                </div>
                <Button variant="destructive" disabled={actionLoading} onClick={() => setShowCancelConfirm(true)}>예약 취소</Button>
              </div>
            )
          ) : myParticipant?.status === "pending" && myReservation ? (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-600">입금 확인 중</p>
                <p className="text-xs text-muted-foreground">관리자가 확인 후 확정됩니다</p>
              </div>
              <Button variant="outline" disabled={actionLoading} onClick={() => setShowCancelConfirm(true)}>취소</Button>
            </div>
          ) : myParticipant?.status === "waitlisted" && myReservation ? (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">대기 {myWaitlistPosition}번째</p>
                <p className="text-xs text-muted-foreground">자리가 나면 관리자가 입금 요청을 드립니다</p>
              </div>
              <Button variant="outline" disabled={actionLoading} onClick={() => setShowCancelConfirm(true)}>대기 취소</Button>
            </div>
          ) : !levelAllowed ? (
            <div className="rounded-xl bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
              {currentUser.level}급은 참가할 수 없는 모임입니다
            </div>
          ) : session.status !== "open" ? (
            <div className="rounded-xl bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
              {session.status === "completed" ? "종료된 모임입니다" : "모집이 마감되었습니다"}
            </div>
          ) : spotsLeft > 0 ? (
            <Button className="w-full" size="lg" disabled={actionLoading} onClick={() => setShowReserveSheet(true)}>
              {`신청하기 · ${formatFee(session.fee)} 계좌이체`}
            </Button>
          ) : (
            <Button className="w-full" size="lg" variant="outline" disabled={actionLoading} onClick={async () => {
              setActionLoading(true)
              await onWaitlist(session.id)
              setActionLoading(false)
            }}>
              {actionLoading ? "대기 신청 중..." : `대기 신청하기 (현재 대기 ${waitlistedParticipants.length}명)`}
            </Button>
          )}
        </div>
      </div>

      {showCancelConfirm && myReservation && (
        <ConfirmDialog
          message="예약을 취소하시겠습니까?"
          confirmLabel="예약 취소"
          onConfirm={async () => {
            setActionLoading(true)
            setShowCancelConfirm(false)
            await onCancel(myReservation.id)
            setActionLoading(false)
          }}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}

      {showReserveSheet && (
        <ReserveSheet
          fee={session.fee}
          freeTickets={currentUser.freeTickets}
          onConfirm={async (useFreeTicket) => {
            setActionLoading(true)
            await onReserve(session.id, useFreeTicket)
            setActionLoading(false)
            setShowReserveSheet(false)
          }}
          onCancel={() => setShowReserveSheet(false)}
          loading={actionLoading}
          onToast={onToast}
        />
      )}
    </div>
  )
}

function ParticipantGroup({
  label,
  labelColor,
  children,
}: {
  label: string
  labelColor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className={cn("mb-2 text-xs font-medium", labelColor)}>{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function ParticipantChip({
  p,
  isSelf,
  variant,
  position,
}: {
  p: { memberName: string; gender: string; level: BadmintonLevel; memberId: string }
  isSelf: boolean
  variant: "confirmed" | "pending" | "waitlisted"
  position?: number
}) {
  const isMale = p.gender === "male"

  const baseClass = "flex items-center gap-1.5 rounded-full border px-3 py-1"

  const genderBase = isMale
    ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
    : "border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-900/20"

  const pendingGenderBase = isMale
    ? "border-dashed border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-900/10"
    : "border-dashed border-pink-300 bg-pink-50/50 dark:border-pink-700 dark:bg-pink-900/10"

  const variantClass = {
    confirmed:  cn(genderBase, isSelf && (isMale ? "border-blue-400" : "border-pink-400") + " ring-1 " + (isMale ? "ring-blue-300" : "ring-pink-300")),
    pending:    cn(pendingGenderBase, isSelf && (isMale ? "border-blue-400" : "border-pink-400")),
    waitlisted: cn("border-dashed border-border bg-muted/30", isSelf && "border-muted-foreground"),
  }[variant]

  return (
    <div className={cn(baseClass, variantClass)}>
      {position !== undefined && (
        <span className="text-xs text-muted-foreground">{position}</span>
      )}
      <span className={cn("size-5 rounded-full text-center text-xs font-bold leading-5", LEVEL_COLORS[p.level])}>
        {p.level}
      </span>
      <span className={cn("text-sm", variant === "waitlisted" && "text-muted-foreground")}>
        {p.memberName}
        {isSelf && <span className="ml-1 text-xs text-primary">(나)</span>}
      </span>
    </div>
  )
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

function ReserveSheet({
  fee,
  freeTickets,
  onConfirm,
  onCancel,
  loading,
  onToast,
}: {
  fee: number
  freeTickets: number
  onConfirm: (useFreeTicket: boolean) => Promise<void>
  onCancel: () => void
  loading: boolean
  onToast: (message: string, type?: "success" | "error") => void
}) {
  const [useFreeTicket, setUseFreeTicket] = useState(false)
  const [copied, setCopied] = useState(false)
  const account = BANK_ACCOUNT

  async function handleCopy() {
    const accountNumber = account.split(" ")[1]
    const text = `${accountNumber} ${formatFee(fee)}`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement("textarea")
      el.value = text
      el.style.position = "fixed"
      el.style.opacity = "0"
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
    }
    navigator.vibrate?.(50)
    setCopied(true)
    onToast("계좌번호가 복사되었습니다.", "success")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* 배경 딤 */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onCancel} />
      {/* 시트 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background px-5 pb-24 pt-5 shadow-xl">
        <div className="mx-auto max-w-lg">
          {/* 핸들 */}
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-muted" />

          {/* 무료권 선택 */}
          {freeTickets > 0 && (
            <div className="mb-5 flex flex-col gap-2">
              <p className="text-sm font-semibold">참가비 결제 방법</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setUseFreeTicket(false)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-xl border py-3 text-sm transition-colors",
                    !useFreeTicket ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground"
                  )}
                >
                  <span>계좌이체</span>
                  <span className="text-xs">{formatFee(fee)}</span>
                </button>
                <button
                  onClick={() => setUseFreeTicket(true)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-xl border py-3 text-sm transition-colors",
                    useFreeTicket ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground"
                  )}
                >
                  <span>무료권 사용</span>
                  <span className="text-xs">보유 {freeTickets}장</span>
                </button>
              </div>
              {useFreeTicket && (
                <p className="rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary">
                  무료권 1장을 사용하면 즉시 예약이 확정됩니다.
                </p>
              )}
            </div>
          )}

          {!useFreeTicket && (
            <>
              <h2 className="mb-1 text-lg font-bold">신청 전 확인해주세요</h2>
              <p className="mb-5 text-sm text-muted-foreground">입금 완료 후 관리자가 확인하면 예약이 확정됩니다.</p>

              {/* 안내 단계 */}
              <div className="mb-5 flex flex-col gap-3">
                {[
                  { step: "1", text: "아래 계좌로 참가비를 이체해주세요." },
                  { step: "2", text: "신청하기를 누르면 입금 대기 상태가 됩니다." },
                  { step: "3", text: "관리자가 입금을 확인하면 예약이 확정됩니다." },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {step}
                    </span>
                    <p className="pt-0.5 text-sm">{text}</p>
                  </div>
                ))}
              </div>

              {/* 계좌 정보 */}
              <div className="mb-6 rounded-xl bg-muted px-4 py-3">
                <p className="mb-2 text-xs text-muted-foreground">입금 계좌</p>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{account.split(" ").slice(0, -1).join(" ")}</p>
                    <p className="text-sm text-muted-foreground">{account.split(" ").slice(-1)[0]}</p>
                    <p className="mt-1 text-sm font-bold text-primary">{formatFee(fee)}</p>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                    {copied ? "복사됨" : "복사"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 버튼 */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" disabled={loading} onClick={onCancel}>취소</Button>
            <Button className="flex-1" disabled={loading} onClick={() => onConfirm(useFreeTicket)}>
              {loading ? "신청 중..." : useFreeTicket ? "무료권으로 신청" : "신청하기"}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
