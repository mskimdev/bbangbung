import { useState, useEffect } from "react"
import { ChevronLeft, Zap, X, History, Plus, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LEVEL_COLORS, formatDate } from "@/lib/badminton"
import { courtsApi } from "@/lib/api"
import type { BadmintonLevel, BbangSession, Gender, Page, PlayStatusMap, SessionParticipant } from "@/types"

// ─── 타입 ────────────────────────────────────────────────────────────────────

type MatchType = "free" | "mixed" | "male" | "female"

const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  free:   "자유",
  mixed:  "혼복",
  male:   "남복",
  female: "여복",
}

interface GameRecord {
  gameNumber: number
  courtNumber: number
  playerIds: string[]   // sorted
  playerNames: string[]
}

interface CourtState {
  players: (SessionParticipant | null)[]  // 4 slots
  status: "idle" | "playing"
}

interface PendingGame {
  id: string
  players: (SessionParticipant | null)[]  // 4 slots, 수동 배정 지원
}

// court 슬롯 or pending 게임 슬롯 구분
type ActiveSlot =
  | { target: "court";   courtIndex: number; position: 0 | 1 | 2 | 3 }
  | { target: "pending"; gameId: string;     position: 0 | 1 | 2 | 3 }

// ─── 알고리즘 ─────────────────────────────────────────────────────────────────

function getCourtPlayers(court: CourtState): SessionParticipant[] {
  return court.players.filter(Boolean) as SessionParticipant[]
}

function getPendingPlayers(game: PendingGame): SessionParticipant[] {
  return game.players.filter(Boolean) as SessionParticipant[]
}

function hasPlayedTogether(players: SessionParticipant[], history: GameRecord[]): boolean {
  const key = players.map((p) => p.memberId).sort().join(",")
  return history.some((g) => g.playerIds.join(",") === key)
}

function pickNextFour(subset: SessionParticipant[], history: GameRecord[]): SessionParticipant[] | null {
  if (subset.length < 4) return null

  const first3 = subset.slice(0, 3)
  for (let i = 3; i < subset.length; i++) {
    const candidate = [...first3, subset[i]]
    if (!hasPlayedTogether(candidate, history)) return candidate
  }

  const first2 = subset.slice(0, 2)
  for (let j = 3; j < subset.length; j++) {
    for (let i = 2; i < j; i++) {
      const candidate = [...first2, subset[i], subset[j]]
      if (!hasPlayedTogether(candidate, history)) return candidate
    }
  }

  return subset.slice(0, 4)
}

function pickGroup(
  currentQueue: SessionParticipant[],
  history: GameRecord[],
  matchType: MatchType,
): SessionParticipant[] | null {
  if (matchType === "male") {
    return pickNextFour(currentQueue.filter((p) => p.gender === "male"), history)
  }
  if (matchType === "female") {
    return pickNextFour(currentQueue.filter((p) => p.gender === "female"), history)
  }
  if (matchType === "mixed") {
    const males   = currentQueue.filter((p) => p.gender === "male")
    const females = currentQueue.filter((p) => p.gender === "female")
    if (males.length < 2 || females.length < 2) return null
    return [...males.slice(0, 2), ...females.slice(0, 2)]
  }
  return pickNextFour(currentQueue, history)
}

// ─── 팀 밸런싱 ───────────────────────────────────────────────────────────────

const LEVEL_SCORES: Record<BadmintonLevel, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 }

function balanceTeams(players: SessionParticipant[]): SessionParticipant[] {
  if (players.length !== 4) return players
  const s = (p: SessionParticipant) => LEVEL_SCORES[p.level]

  const males   = players.filter((p) => p.gender === "male")
  const females = players.filter((p) => p.gender === "female")

  // 2남2여인 경우: 성비 균형(각 팀 1남1여) 우선, 그 다음 레벨 균형
  if (males.length === 2 && females.length === 2) {
    const [m1, m2] = males
    const [f1, f2] = females
    const diff1 = Math.abs((s(m1) + s(f1)) - (s(m2) + s(f2)))
    const diff2 = Math.abs((s(m1) + s(f2)) - (s(m2) + s(f1)))
    return diff1 <= diff2
      ? [m1, f1, m2, f2]  // {m1,f1} vs {m2,f2}
      : [m1, f2, m2, f1]  // {m1,f2} vs {m2,f1}
  }

  // 그 외(남복/여복 등): 레벨 균형만
  const splits: [number, number, number, number][] = [
    [0, 1, 2, 3],
    [0, 2, 1, 3],
    [0, 3, 1, 2],
  ]
  let best = splits[0]
  let bestDiff = Infinity
  for (const combo of splits) {
    const diff = Math.abs(
      (s(players[combo[0]]) + s(players[combo[1]])) -
      (s(players[combo[2]]) + s(players[combo[3]])),
    )
    if (diff < bestDiff) { bestDiff = diff; best = combo }
  }
  return [players[best[0]], players[best[1]], players[best[2]], players[best[3]]]
}

function isGuest(player: SessionParticipant) {
  return player.memberId.startsWith("guest-")
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

interface SessionPlayProps {
  session: BbangSession
  playStatuses?: PlayStatusMap
  onNavigate: (page: Page) => void
}

export function SessionPlay({ session, playStatuses = {}, onNavigate }: SessionPlayProps) {
  const confirmed = session.participants.filter((p) => p.status === "confirmed")

  const [courts, setCourts]             = useState<CourtState[]>(() =>
    Array.from({ length: session.courtCount }, () => ({
      players: [null, null, null, null],
      status: "idle" as const,
    })),
  )
  const [queue, setQueue]               = useState<SessionParticipant[]>(confirmed)
  const [pendingGames, setPendingGames] = useState<PendingGame[]>([])
  const historyKey = `game-history-${session.id}`
  const [history, setHistory] = useState<GameRecord[]>(() => {
    try {
      const saved = sessionStorage.getItem(`game-history-${session.id}`)
      return saved ? (JSON.parse(saved) as GameRecord[]) : []
    } catch {
      return []
    }
  })
  useEffect(() => {
    sessionStorage.setItem(historyKey, JSON.stringify(history))
  }, [history, historyKey])

  const [activeSlot, setActiveSlot]     = useState<ActiveSlot | null>(null)
  const [showHistory, setShowHistory]   = useState(false)
  const [autoMode, setAutoMode]         = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)

  // 마운트 시 저장된 코트 상태 로드
  useEffect(() => {
    courtsApi.get(session.id).then((res) => {
      if (res.data.length === 0) return
      const allConfirmed = session.participants.filter((p) => p.status === "confirmed")
      const byId = Object.fromEntries(allConfirmed.map((p) => [p.memberId, p]))
      const loadedByNumber = Object.fromEntries(
        res.data.map((c) => [c.courtNumber, c])
      )
      const loadedCourts = Array.from({ length: session.courtCount }, (_, i) => {
        const c = loadedByNumber[i + 1]
        if (!c) return { status: "idle" as const, players: [null, null, null, null] as (SessionParticipant | null)[] }
        return {
          status: c.status as "idle" | "playing",
          players: c.slots.map((id) => (id ? (byId[id] ?? null) : null)) as (SessionParticipant | null)[],
        }
      })
      // pending(courtNumber > courtCount)은 대기열 계산에서만 제외, courts 배열엔 포함 안 함
      const onCourtIds = new Set(
        res.data.filter((c) => c.courtNumber <= session.courtCount).flatMap((c) => c.slots.filter(Boolean))
      )
      setCourts(loadedCourts)
      setQueue(allConfirmed.filter((p) => !onCourtIds.has(p.memberId)))
    }).catch(() => {})
  }, [session.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 코트 상태를 백엔드에 저장 + SSE push (fire-and-forget)
  function saveCourts(updatedCourts: CourtState[], updatedPending?: PendingGame[]) {
    const pending = updatedPending ?? pendingGames
    const courtPayload = updatedCourts.map((c, i) => ({
      courtNumber: i + 1,
      status: c.status,
      slots: c.players.map((p) => (p && !isGuest(p)) ? p.memberId : null),
    }))
    const pendingPayload = pending.map((g, i) => ({
      courtNumber: session.courtCount + i + 1,
      status: "pending" as const,
      slots: g.players.map((p) => (p && !isGuest(p)) ? p.memberId : null),
    }))
    courtsApi.update(session.id, [...courtPayload, ...pendingPayload]).catch(() => {})
  }

  // 휴식/종료 참가자는 자동 배정에서 제외
  function isActivePlayer(player: SessionParticipant): boolean {
    if (isGuest(player)) return true
    const s = playStatuses[player.memberId]
    return !s || s === "active"
  }
  const activeQueue = queue.filter(isActivePlayer)

  const playingCount   = courts.filter((c) => c.status === "playing").reduce((s, c) => s + getCourtPlayers(c).length, 0)
  const totalGameCount = history.length
  const maleCount      = activeQueue.filter((p) => p.gender === "male").length
  const femaleCount    = activeQueue.filter((p) => p.gender === "female").length

  const canAutoAssign  = activeQueue.length >= 4

  const hasIdleCourt   = courts.some((c) => c.status === "idle" && getCourtPlayers(c).length === 0)

  function canAssignType(type: MatchType) {
    if (type === "male")   return maleCount >= 4
    if (type === "female") return femaleCount >= 4
    if (type === "mixed")  return maleCount >= 2 && femaleCount >= 2
    return activeQueue.length >= 4
  }

  // ── 코트 슬롯 ──────────────────────────────────────────────────────────────

  function handleSlotClick(courtIndex: number, position: 0 | 1 | 2 | 3) {
    if (courts[courtIndex].status === "playing") return
    const player = courts[courtIndex].players[position]

    if (player) {
      const newCourts = courts.map((c) => ({ ...c, players: [...c.players] }))
      newCourts[courtIndex].players[position] = null
      setCourts(newCourts)
      setQueue((prev) => [...prev, player])
      saveCourts(newCourts)
    } else {
      setActiveSlot({ target: "court", courtIndex, position })
    }
  }

  function handleGameStart(courtIndex: number) {
    if (getCourtPlayers(courts[courtIndex]).length < 4) return
    const newCourts = courts.map((c, i) =>
      i === courtIndex ? { ...c, status: "playing" as const } : c,
    )
    setCourts(newCourts)
    saveCourts(newCourts)
  }

  function handleGameEnd(courtIndex: number) {
    const court   = courts[courtIndex]
    const players = getCourtPlayers(court)
    if (players.length === 0) return

    const newHistory = [
      ...history,
      {
        gameNumber:  totalGameCount + 1,
        courtNumber: courtIndex + 1,
        playerIds:   players.map((p) => p.memberId).sort(),
        playerNames: players.map((p) => p.memberName),
      },
    ]

    // 종료된 선수들을 대기열에 합친 뒤 auto 모드면 바로 그 코트 재배정
    const returnedQueue = [...queue, ...players]
    let newCourts = courts.map((c, i) =>
      i === courtIndex ? { players: [null, null, null, null] as (SessionParticipant | null)[], status: "idle" as const } : c,
    )
    let newQueue = returnedQueue

    if (autoMode) {
      const returnedActiveQueue = returnedQueue.filter(isActivePlayer)
      const four = pickGroup(returnedActiveQueue, newHistory, "free")
      if (four) {
        newCourts = newCourts.map((c, i) =>
          i === courtIndex ? { ...c, players: balanceTeams(four) as (SessionParticipant | null)[] } : c,
        )
        const usedIds = new Set(four.map((p) => p.memberId))
        newQueue = returnedQueue.filter((p) => !usedIds.has(p.memberId))
      }
    }

    setHistory(newHistory)
    setQueue(newQueue)
    setCourts(newCourts)
    saveCourts(newCourts)
  }

  // ── 대기 게임 슬롯 ─────────────────────────────────────────────────────────

  function handlePendingSlotClick(gameId: string, position: 0 | 1 | 2 | 3) {
    const game = pendingGames.find((g) => g.id === gameId)
    if (!game) return
    const player = game.players[position]

    if (player) {
      const newPending = pendingGames.map((g) =>
        g.id !== gameId ? g : { ...g, players: g.players.map((p, i) => (i === position ? null : p)) },
      )
      setPendingGames(newPending)
      setQueue((prev) => [...prev, player])
      saveCourts(courts, newPending)
    } else {
      setActiveSlot({ target: "pending", gameId, position })
    }
  }

  function handleAddPendingGame() {
    if (pendingGames.length >= session.courtCount) return
    const newPending = [...pendingGames, { id: crypto.randomUUID(), players: [null, null, null, null] as (SessionParticipant | null)[] }]
    setPendingGames(newPending)
    saveCourts(courts, newPending)
  }

  function handleAssignPending(gameId: string) {
    const game = pendingGames.find((g) => g.id === gameId)
    if (!game || getPendingPlayers(game).length < 4) return
    const courtIndex = courts.findIndex(
      (c) => c.status === "idle" && getCourtPlayers(c).length === 0,
    )
    if (courtIndex === -1) return

    const newCourts = courts.map((c) => ({ ...c, players: [...c.players] }))
    const gamePlayers = game.players.filter(Boolean) as SessionParticipant[]
    newCourts[courtIndex].players = balanceTeams(gamePlayers) as (SessionParticipant | null)[]
    const newPending = pendingGames.filter((g) => g.id !== gameId)
    setCourts(newCourts)
    setPendingGames(newPending)
    saveCourts(newCourts, newPending)
  }

  function handleDiscardPending(gameId: string) {
    const game = pendingGames.find((g) => g.id === gameId)
    if (!game) return
    const newPending = pendingGames.filter((g) => g.id !== gameId)
    setQueue((prev) => [...prev, ...getPendingPlayers(game)])
    setPendingGames(newPending)
    saveCourts(courts, newPending)
  }

  function handleAssignPendingManual(gameId: string, type: MatchType) {
    const game = pendingGames.find((g) => g.id === gameId)
    if (!game || getPendingPlayers(game).length > 0) return
    const four = pickGroup(activeQueue, history, type)
    if (!four) return
    const usedIds = new Set(four.map((p) => p.memberId))
    const newPending = pendingGames.map((g) =>
      g.id !== gameId ? g : { ...g, players: four as (SessionParticipant | null)[] },
    )
    setPendingGames(newPending)
    setQueue((prev) => prev.filter((p) => !usedIds.has(p.memberId)))
    saveCourts(courts, newPending)
  }

  // idle 코트 한 개 비우기 → 대기열로 반환
  function handleClearCourt(courtIndex: number) {
    const court = courts[courtIndex]
    if (court.status === "playing") return
    const returned = getCourtPlayers(court)
    if (returned.length === 0) return
    const newCourts = courts.map((c, i) =>
      i === courtIndex ? { ...c, players: [null, null, null, null] as (SessionParticipant | null)[] } : c,
    )
    setCourts(newCourts)
    setQueue((prev) => [...prev, ...returned])
    saveCourts(newCourts)
  }

  // ── 선수 피커 (court + pending 공용) ───────────────────────────────────────

  function handlePickPlayer(player: SessionParticipant) {
    if (!activeSlot) return

    if (activeSlot.target === "court") {
      const { courtIndex, position } = activeSlot
      const newCourts = courts.map((c) => ({ ...c, players: [...c.players] }))
      newCourts[courtIndex].players[position] = player
      setCourts(newCourts)
      saveCourts(newCourts)
    } else {
      const { gameId, position } = activeSlot
      const newPending = pendingGames.map((g) =>
        g.id !== gameId ? g : { ...g, players: g.players.map((p, i) => (i === position ? player : p)) },
      )
      setPendingGames(newPending)
      saveCourts(courts, newPending)
    }

    setQueue((prev) => prev.filter((p) => p.memberId !== player.memberId))
    setActiveSlot(null)
  }

  // ── 게스트 추가 ────────────────────────────────────────────────────────────

  function handleAddGuest(name: string, gender: Gender, level: BadmintonLevel) {
    const guest: SessionParticipant = {
      memberId: `guest-${crypto.randomUUID()}`,
      memberName: name,
      gender,
      level,
      reservedAt: new Date().toISOString(),
      status: "confirmed",
      usedFreeTicket: false,
    }
    setQueue((prev) => [...prev, guest])
    setShowGuestModal(false)
  }

  // ── 자동 배정 (전체) ────────────────────────────────────────────────────────

  function handleAutoAssign(type: MatchType = "free") {
    let currentQueue     = [...activeQueue]
    const newCourts      = courts.map((c) => ({ ...c, players: [...c.players] }))
    const newPending     = [...pendingGames]
    const currentHistory = [...history]

    // 1. 빈 코트 먼저 채우기
    for (let i = 0; i < newCourts.length; i++) {
      const court = newCourts[i]
      if (court.status === "playing") continue
      const emptyCount = 4 - getCourtPlayers(court).length
      if (emptyCount === 0) continue

      if (emptyCount === 4) {
        const four = pickGroup(currentQueue, currentHistory, type)
        if (!four) continue
        court.players = balanceTeams(four) as (SessionParticipant | null)[]
        const usedIds = new Set(four.map((p) => p.memberId))
        currentQueue  = currentQueue.filter((p) => !usedIds.has(p.memberId))
      } else {
        for (let j = 0; j < 4; j++) {
          if (!court.players[j] && currentQueue.length > 0) {
            court.players[j] = currentQueue.shift()!
          }
        }
      }
    }

    // 2. 남은 인원으로 대기 게임 생성 (최대 코트 수)
    while (newPending.length < session.courtCount) {
      const four = pickGroup(currentQueue, currentHistory, type)
      if (!four) break
      newPending.push({ id: crypto.randomUUID(), players: four as (SessionParticipant | null)[] })
      const usedIds = new Set(four.map((p) => p.memberId))
      currentQueue  = currentQueue.filter((p) => !usedIds.has(p.memberId))
    }

    // 휴식/종료 인원은 배정하지 않고 queue에 유지
    const inactiveInQueue = queue.filter((p) => !isActivePlayer(p))
    setCourts(newCourts)
    setPendingGames(newPending)
    setQueue([...currentQueue, ...inactiveInQueue])
    saveCourts(newCourts, newPending)
  }

  // ── 코트 단건 수동 배정 ────────────────────────────────────────────────────

  function handleAssignCourt(courtIndex: number, type: MatchType) {
    const court = courts[courtIndex]
    if (court.status === "playing" || getCourtPlayers(court).length > 0) return
    const four = pickGroup(activeQueue, history, type)
    if (!four) return
    const newCourts = courts.map((c, i) =>
      i === courtIndex ? { ...c, players: balanceTeams(four) as (SessionParticipant | null)[] } : c,
    )
    const usedIds = new Set(four.map((p) => p.memberId))
    setCourts(newCourts)
    setQueue((prev) => prev.filter((p) => !usedIds.has(p.memberId)))
    saveCourts(newCourts)
  }

  // ── 피커 타이틀 ────────────────────────────────────────────────────────────

  const pickerTitle = activeSlot
    ? activeSlot.target === "court"
      ? `${activeSlot.courtIndex + 1}번 코트 · 선수 선택`
      : `대기 게임 ${pendingGames.findIndex((g) => g.id === activeSlot.gameId) + 1} · 선수 선택`
    : ""

  return (
    <div className="flex flex-col gap-4 pb-28 md:pb-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate("admin")}
          className="-mx-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          관리자
        </button>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">경기 중 <strong className="text-foreground">{playingCount}명</strong></span>
            <span className="text-muted-foreground">대기 <strong className="text-foreground">{queue.length}명</strong></span>
            <span className="text-muted-foreground">완료 <strong className="text-foreground">{totalGameCount}게임</strong></span>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <History className="size-3.5" />
              기록 {history.length}
            </button>
          )}
        </div>
      </div>

      {/* 타이틀 */}
      <div>
        <h1 className="text-xl font-bold">정모 진행</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {session.title} · {formatDate(session.date)}
        </p>
      </div>

      {/* 모드 토글 */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{autoMode ? "Auto 모드" : "수동 모드"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {autoMode ? "전체 코트 자동 배정" : "각 코트에서 방식 선택"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {autoMode && (
            <Button
              size="sm"
              onClick={() => handleAutoAssign("free")}
              disabled={!canAutoAssign}
            >
              <Zap className="size-3.5 mr-1" />
              {canAutoAssign ? "자동 배정" : "대기자 부족"}
            </Button>
          )}
          <button
            onClick={() => setAutoMode((v) => !v)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
              autoMode ? "bg-primary" : "bg-muted-foreground/30",
            )}
          >
            <span className={cn(
              "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
              autoMode ? "translate-x-6" : "translate-x-1",
            )} />
          </button>
        </div>
      </div>

      {/* 모바일 통계 */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        {[
          { label: "경기 중", value: `${playingCount}명` },
          { label: "대기 중", value: `${queue.length}명` },
          { label: "완료 게임", value: `${totalGameCount}게임` },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center rounded-xl bg-muted py-2.5 gap-0.5">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="font-bold text-sm">{value}</span>
          </div>
        ))}
      </div>

      {/* 태블릿: 좌우 분할 / 모바일: 세로 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">

        {/* 좌측: 코트 + 대기 게임 */}
        <div className="flex-1 flex flex-col gap-4">

          {/* 코트 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {courts.map((court, i) => (
              <CourtCard
                key={i}
                courtNumber={i + 1}
                court={court}
                manualMode={!autoMode}
                onSlotClick={(pos) => handleSlotClick(i, pos)}
                onGameStart={() => handleGameStart(i)}
                onGameEnd={() => handleGameEnd(i)}
                onClear={() => handleClearCourt(i)}
                onManualAssign={(type) => handleAssignCourt(i, type)}
                canAssignType={canAssignType}
              />
            ))}
          </div>

          {/* 대기 게임 섹션 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold text-sm">
                대기 게임
                {pendingGames.length > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">{pendingGames.length}게임</span>
                )}
              </h2>
              {pendingGames.length < session.courtCount && (
                <button
                  onClick={handleAddPendingGame}
                  className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="size-3.5" />
                  추가
                </button>
              )}
            </div>

            {pendingGames.length === 0 ? (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-6 text-sm text-muted-foreground">
                자동 배정하거나 직접 추가하세요
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingGames.map((game, i) => (
                  <PendingGameCard
                    key={game.id}
                    game={game}
                    index={i}
                    canAssign={hasIdleCourt && getPendingPlayers(game).length === 4}
                    manualMode={!autoMode}
                    onSlotClick={(pos) => handlePendingSlotClick(game.id, pos)}
                    onAssign={() => handleAssignPending(game.id)}
                    onDiscard={() => handleDiscardPending(game.id)}
                    onManualAssign={(type) => handleAssignPendingManual(game.id, type)}
                    canAssignType={canAssignType}
                  />
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 우측: 대기열 + 기록 */}
        <div className="md:w-64 md:shrink-0 flex flex-col gap-4">

          {/* 대기열 */}
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-sm">대기 중</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{queue.length}명</span>
                <button
                  onClick={() => setShowGuestModal(true)}
                  className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <UserPlus className="size-3.5" />
                  게스트
                </button>
              </div>
            </div>
            {queue.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">대기자 없음</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {queue.map((p, i) => (
                  <QueueChip
                    key={p.memberId}
                    player={p}
                    position={i + 1}
                    playStatus={isGuest(p) ? "active" : (playStatuses[p.memberId] ?? "active")}
                  />
                ))}
              </div>
            )}
          </section>

          {/* 게임 기록 */}
          {showHistory && history.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-3 font-semibold text-sm">게임 기록</h2>
              <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                {[...history].reverse().map((g) => (
                  <div key={g.gameNumber} className="rounded-lg bg-muted px-3 py-2 text-xs">
                    <span className="font-medium">게임 {g.gameNumber} · {g.courtNumber}번 코트</span>
                    <p className="mt-0.5 text-muted-foreground">{g.playerNames.join(" · ")}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>

      {/* 선수 선택 모달 (코트 + 대기 게임 공용) */}
      {activeSlot && (
        <PlayerPicker
          title={pickerTitle}
          queue={queue}
          playStatuses={playStatuses}
          onPick={handlePickPlayer}
          onClose={() => setActiveSlot(null)}
        />
      )}

      {/* 게스트 추가 모달 */}
      {showGuestModal && (
        <GuestAddSheet
          onAdd={handleAddGuest}
          onClose={() => setShowGuestModal(false)}
        />
      )}
    </div>
  )
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function CourtCard({
  courtNumber,
  court,
  manualMode,
  onSlotClick,
  onGameStart,
  onGameEnd,
  onClear,
  onManualAssign,
  canAssignType,
}: {
  courtNumber: number
  court: CourtState
  manualMode: boolean
  onSlotClick: (position: 0 | 1 | 2 | 3) => void
  onGameStart: () => void
  onGameEnd: () => void
  onClear: () => void
  onManualAssign: (type: MatchType) => void
  canAssignType: (type: MatchType) => boolean
}) {
  const players    = getCourtPlayers(court)
  const isPlaying  = court.status === "playing"
  const isFull     = players.length === 4
  const isEmpty    = players.length === 0
  const showManual = manualMode && !isPlaying && isEmpty

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border bg-card transition-colors",
      isPlaying ? "border-primary/60" : "border-border",
    )}>
      <div className={cn(
        "flex items-center justify-between px-4 py-2.5",
        isPlaying ? "bg-primary/10" : "bg-muted/50",
      )}>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{courtNumber}번 코트</span>
          {isPlaying && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              경기 중
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isPlaying && players.length > 0 && (
            <button
              onClick={onClear}
              className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              비우기
            </button>
          )}
          {isPlaying ? (
            <button
              onClick={onGameEnd}
              className="rounded-lg bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/20"
            >
              경기 종료
            </button>
          ) : (
            <button
              onClick={onGameStart}
              disabled={!isFull}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                isFull
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "cursor-not-allowed text-muted-foreground",
              )}
            >
              게임 시작
            </button>
          )}
        </div>
      </div>

      {/* 슬롯 그리드 (항상 표시) */}
      <div className="grid grid-cols-2 gap-2 p-3 pb-2">
        {([0, 1, 2, 3] as const).map((pos) => (
          <PlayerSlot
            key={pos}
            player={court.players[pos]}
            onClick={() => onSlotClick(pos)}
            locked={isPlaying}
          />
        ))}
      </div>

      {/* 수동 모드: 빈 코트에 빠른 배정 버튼 */}
      {showManual && (
        <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
          {(["free", "mixed", "male", "female"] as MatchType[]).map((type) => {
            const ok = canAssignType(type)
            return (
              <button
                key={type}
                onClick={() => ok && onManualAssign(type)}
                disabled={!ok}
                className={cn(
                  "rounded-lg py-2 text-xs font-medium transition-colors",
                  ok
                    ? "bg-muted hover:bg-primary hover:text-primary-foreground text-foreground"
                    : "bg-muted/50 text-muted-foreground/40 cursor-not-allowed",
                )}
              >
                {MATCH_TYPE_LABELS[type]}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PendingGameCard({
  game,
  index,
  canAssign,
  manualMode,
  onSlotClick,
  onAssign,
  onDiscard,
  onManualAssign,
  canAssignType,
}: {
  game: PendingGame
  index: number
  canAssign: boolean
  manualMode: boolean
  onSlotClick: (position: 0 | 1 | 2 | 3) => void
  onAssign: () => void
  onDiscard: () => void
  onManualAssign: (type: MatchType) => void
  canAssignType: (type: MatchType) => boolean
}) {
  const filledCount = getPendingPlayers(game).length
  const isEmpty     = filledCount === 0

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between bg-muted/50 px-4 py-2.5">
        <span className="text-sm font-semibold text-muted-foreground">{index + 1}번째 대기</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onAssign}
            disabled={!canAssign}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
              canAssign
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed text-muted-foreground",
            )}
          >
            {filledCount < 4 ? `${filledCount}/4명` : "코트 배정"}
          </button>
          <button
            onClick={onDiscard}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 pb-2">
        {([0, 1, 2, 3] as const).map((pos) => (
          <PlayerSlot
            key={pos}
            player={game.players[pos]}
            onClick={() => onSlotClick(pos)}
            locked={false}
          />
        ))}
      </div>
      {manualMode && isEmpty && (
        <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
          {(["free", "mixed", "male", "female"] as MatchType[]).map((type) => {
            const ok = canAssignType(type)
            return (
              <button
                key={type}
                onClick={() => ok && onManualAssign(type)}
                disabled={!ok}
                className={cn(
                  "rounded-lg py-2 text-xs font-medium transition-colors",
                  ok
                    ? "bg-muted hover:bg-primary hover:text-primary-foreground text-foreground"
                    : "bg-muted/50 text-muted-foreground/40 cursor-not-allowed",
                )}
              >
                {MATCH_TYPE_LABELS[type]}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PlayerSlot({
  player,
  onClick,
  locked,
}: {
  player: SessionParticipant | null
  onClick: () => void
  locked: boolean
}) {
  if (!player) {
    return (
      <button
        onClick={onClick}
        disabled={locked}
        className={cn(
          "flex h-9 items-center justify-center rounded-lg border-2 border-dashed transition-colors",
          locked
            ? "cursor-not-allowed border-border/40 text-muted-foreground/40"
            : "border-border text-muted-foreground hover:border-primary hover:text-primary",
        )}
      >
        <span className="text-lg leading-none">+</span>
      </button>
    )
  }

  const isMale = player.gender === "male"
  return (
    <button
      onClick={onClick}
      disabled={locked}
      title={locked ? undefined : "클릭하면 대기열로 이동"}
      className={cn(
        "flex h-9 items-center gap-2 rounded-lg border px-2 transition-colors",
        locked ? "cursor-default opacity-90" : "hover:opacity-70",
        isMale
          ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
          : "border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-900/20",
      )}
    >
      <span className={cn("size-5 shrink-0 rounded-full text-center text-xs font-bold leading-5", LEVEL_COLORS[player.level])}>
        {player.level}
      </span>
      <span className="truncate text-sm">{player.memberName}</span>
      {!locked && <X className="ml-auto size-3 shrink-0 text-muted-foreground" />}
    </button>
  )
}

function QueueChip({
  player,
  position,
  playStatus = "active",
}: {
  player: SessionParticipant
  position: number
  playStatus?: "active" | "resting" | "done"
}) {
  const isMale    = player.gender === "male"
  const isResting = playStatus === "resting"
  const isDone    = playStatus === "done"
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1",
        isDone    ? "border-border bg-muted opacity-50" :
        isResting ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20" :
        isMale
          ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
          : "border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-900/20",
      )}
    >
      <span className="text-xs text-muted-foreground">{position}</span>
      <span className={cn("size-5 rounded-full text-center text-xs font-bold leading-5", LEVEL_COLORS[player.level])}>
        {player.level}
      </span>
      <span className="text-sm">{player.memberName}</span>
      {isResting && <span className="text-xs font-medium text-amber-600 dark:text-amber-400">휴식</span>}
      {isDone    && <span className="text-xs text-muted-foreground">종료</span>}
    </div>
  )
}

function GuestAddSheet({
  onAdd,
  onClose,
}: {
  onAdd: (name: string, gender: Gender, level: BadmintonLevel) => void
  onClose: () => void
}) {
  const [name, setName] = useState("")
  const [gender, setGender] = useState<Gender>("male")
  const [level, setLevel] = useState<BadmintonLevel>("B")

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background px-5 pb-24 pt-5 shadow-xl">
        <div className="mx-auto max-w-lg">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
          <p className="mb-4 text-center text-sm font-semibold">게스트 추가</p>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && onAdd(name.trim(), gender, level)}
              autoFocus
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              {(["male", "female"] as Gender[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={cn(
                    "flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors",
                    gender === g
                      ? g === "male"
                        ? "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        : "border-pink-400 bg-pink-50 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {g === "male" ? "남성" : "여성"}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {(["S", "A", "B", "C", "D"] as BadmintonLevel[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={cn(
                    "flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors",
                    level === l ? cn(LEVEL_COLORS[l], "border-transparent") : "border-border text-muted-foreground",
                  )}
                >
                  {l}급
                </button>
              ))}
            </div>
            <Button className="w-full" disabled={!name.trim()} onClick={() => onAdd(name.trim(), gender, level)}>
              대기열에 추가
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

function PlayerPicker({
  title,
  queue,
  playStatuses,
  onPick,
  onClose,
}: {
  title: string
  queue: SessionParticipant[]
  playStatuses: PlayStatusMap
  onPick: (player: SessionParticipant) => void
  onClose: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-background px-5 pb-24 pt-5 shadow-xl">
        <div className="mx-auto max-w-lg">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
          <p className="mb-4 text-center text-sm font-semibold">{title}</p>
          {queue.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">대기 중인 선수 없음</p>
          ) : (
            <div className="flex flex-col gap-2">
              {queue.map((p) => {
                const isMale      = p.gender === "male"
                const ps          = isGuest(p) ? "active" : (playStatuses[p.memberId] ?? "active")
                const isResting   = ps === "resting"
                const isDone      = ps === "done"
                return (
                  <button
                    key={p.memberId}
                    onClick={() => onPick(p)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors hover:opacity-80 active:scale-95",
                      isDone    ? "border-border bg-muted opacity-60" :
                      isResting ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20" :
                      isMale
                        ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                        : "border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-900/20",
                    )}
                  >
                    <span className={cn("size-6 shrink-0 rounded-full text-center text-xs font-bold leading-6", LEVEL_COLORS[p.level])}>
                      {p.level}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{p.memberName}</p>
                      <p className="text-xs text-muted-foreground">{isMale ? "남" : "여"} · {p.level}급</p>
                    </div>
                    {isResting && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        휴식 중
                      </span>
                    )}
                    {isDone && (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        종료
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
