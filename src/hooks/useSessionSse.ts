import { useEffect, useRef } from "react"
import type { BbangSession, SessionParticipant } from "@/types"

const BASE_URL = "http://localhost:8080/api"

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
    })),
  }
}

export function useSessionSse(
  sessionId: string | null,
  onUpdate: (session: BbangSession) => void,
  onDeleted?: () => void,
) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate
  const onDeletedRef = useRef(onDeleted)
  onDeletedRef.current = onDeleted

  useEffect(() => {
    if (!sessionId) return

    const es = new EventSource(`${BASE_URL}/sessions/${sessionId}/stream`)

    es.addEventListener("session-update", (e) => {
      try {
        const raw = JSON.parse(e.data)
        onUpdateRef.current(mapSession(raw))
      } catch {
        // 파싱 실패 시 무시
      }
    })

    es.addEventListener("session-deleted", () => {
      es.close()
      onDeletedRef.current?.()
    })

    es.onerror = () => {
      // 연결 끊기면 브라우저가 자동 재연결 시도하므로 별도 처리 불필요
    }

    return () => {
      es.close()
    }
  }, [sessionId])
}
