import { useEffect, useRef } from "react"
import type { BbangSession, CourtSlotApi, PlayStatusMap, SessionParticipant } from "@/types"

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8080") + "/api"

function mapSession(s: any): BbangSession {
  return {
    id: s.id,
    title: s.title,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    location: s.location,
    address: s.address ?? "",
    courtCount: s.courtCount,
    maxParticipants: s.maxParticipants,
    currentParticipants: s.currentParticipants ?? 0,
    status: s.status,
    levelRestriction: s.levelRestriction ? JSON.parse(s.levelRestriction) : null,
    fee: s.fee ?? 0,
    description: s.description ?? "",
    organizer: s.organizerName ?? "",
    participants: (s.participants ?? []).map((p: any): SessionParticipant => ({
      memberId: p.memberId,
      memberName: p.memberName,
      gender: p.gender,
      level: p.level,
      reservedAt: p.reservedAt,
      status: p.status,
      usedFreeTicket: p.usedFreeTicket ?? false,
    })),
  }
}

export function useSessionSse(
  sessionId: string | null,
  onUpdate: (session: BbangSession) => void,
  onDeleted?: () => void,
  onReconnect?: () => void,
  onPlayStatusUpdate?: (statuses: PlayStatusMap) => void,
  onCourtUpdate?: (courts: CourtSlotApi[]) => void,
) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate
  const onDeletedRef = useRef(onDeleted)
  onDeletedRef.current = onDeleted
  const onReconnectRef = useRef(onReconnect)
  onReconnectRef.current = onReconnect
  const onPlayStatusUpdateRef = useRef(onPlayStatusUpdate)
  onPlayStatusUpdateRef.current = onPlayStatusUpdate
  const onCourtUpdateRef = useRef(onCourtUpdate)
  onCourtUpdateRef.current = onCourtUpdate

  useEffect(() => {
    if (!sessionId) return

    const token = localStorage.getItem("token")
    if (!token) return

    let es: EventSource
    let isDeleted = false
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      es = new EventSource(`${BASE_URL}/sessions/${sessionId}/stream?token=${encodeURIComponent(token!)}`)
      let isFirstOpen = true

      es.onopen = () => {
        if (isFirstOpen) {
          isFirstOpen = false
          return
        }
        // 재연결 시 최신 상태 동기화
        onReconnectRef.current?.()
      }

      es.addEventListener("session-update", (e) => {
        try {
          const raw = JSON.parse(e.data)
          onUpdateRef.current(mapSession(raw))
        } catch {
          // 파싱 실패 시 무시
        }
      })

      es.addEventListener("session-deleted", () => {
        isDeleted = true
        es.close()
        onDeletedRef.current?.()
      })

      es.addEventListener("play-status-update", (e) => {
        try {
          onPlayStatusUpdateRef.current?.(JSON.parse(e.data) as PlayStatusMap)
        } catch {
          // 파싱 실패 시 무시
        }
      })

      es.addEventListener("court-update", (e) => {
        try {
          onCourtUpdateRef.current?.(JSON.parse(e.data) as CourtSlotApi[])
        } catch {
          // 파싱 실패 시 무시
        }
      })

      es.onerror = () => {
        if (isDeleted) return
        es.close()
        // 3초 후 재연결 시도
        reconnectTimer = setTimeout(() => {
          if (!isDeleted) connect()
        }, 3000)
      }
    }

    connect()

    return () => {
      isDeleted = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      es?.close()
    }
  }, [sessionId])
}
