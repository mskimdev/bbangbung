import { useState, useEffect } from "react"
import type { BbangSession, SessionParticipant, SessionStatus } from "@/types"
import api, { getErrorMessage } from "@/lib/api"

type ShowToast = (message: string, type?: "success" | "error") => void

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

export function useSessions(showToast: ShowToast) {
  const [sessions, setSessions] = useState<BbangSession[]>([])

  async function fetchSessions() {
    try {
      const { data } = await api.get("/sessions")
      setSessions(data.map(mapSession))
    } catch (e) {
      showToast(getErrorMessage(e), "error")
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  async function refreshSession(sessionId: string) {
    try {
      const { data } = await api.get(`/sessions/${sessionId}`)
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? mapSession(data) : s)))
    } catch (e) {
      showToast(getErrorMessage(e), "error")
    }
  }

  async function handleCreateSession(
    data: Omit<BbangSession, "id" | "currentParticipants" | "participants" | "status">,
    organizerId: string,
  ) {
    try {
      await api.post("/sessions", {
        organizerId,
        title: data.title,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        address: data.address,
        courtCount: data.courtCount,
        maxParticipants: data.maxParticipants,
        levelRestriction: data.levelRestriction ? JSON.stringify(data.levelRestriction) : null,
        fee: data.fee,
        description: data.description,
      })
      await fetchSessions()
      showToast("정모가 생성되었습니다.")
    } catch (e) {
      showToast(getErrorMessage(e), "error")
    }
  }

  async function handleEditSession(
    sessionId: string,
    data: Omit<BbangSession, "id" | "currentParticipants" | "participants" | "status">,
  ) {
    try {
      await api.put(`/sessions/${sessionId}`, {
        title: data.title,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        address: data.address,
        courtCount: data.courtCount,
        maxParticipants: data.maxParticipants,
        levelRestriction: data.levelRestriction ? JSON.stringify(data.levelRestriction) : null,
        fee: data.fee,
        description: data.description,
      })
      await fetchSessions()
      showToast("정모가 수정되었습니다.")
    } catch (e) {
      showToast(getErrorMessage(e), "error")
    }
  }

  async function handleDeleteSession(sessionId: string) {
    try {
      await api.delete(`/sessions/${sessionId}`)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      showToast("정모가 삭제되었습니다.")
    } catch (e) {
      showToast(getErrorMessage(e), "error")
    }
  }

  async function handleUpdateSessionStatus(sessionId: string, status: SessionStatus): Promise<boolean> {
    const prev = sessions.find((s) => s.id === sessionId)
    setSessions((cur) => cur.map((s) => (s.id === sessionId ? { ...s, status } : s)))
    try {
      await api.patch(`/sessions/${sessionId}/status`, { status })
      showToast("세션 상태가 변경되었습니다.")
      return true
    } catch (e) {
      if (prev) setSessions((cur) => cur.map((s) => (s.id === sessionId ? prev : s)))
      showToast(getErrorMessage(e), "error")
      return false
    }
  }

  async function handleConfirmPayment(sessionId: string, memberId: string) {
    try {
      await api.patch("/reservations/confirm", { memberId, sessionId })
      await refreshSession(sessionId)
      showToast("입금이 확인되었습니다.")
    } catch (e) {
      showToast(getErrorMessage(e), "error")
    }
  }

  async function handleConfirmAll(sessionId: string) {
    try {
      await api.patch(`/reservations/confirm-all?sessionId=${sessionId}`)
      await refreshSession(sessionId)
      showToast("전체 입금이 확정되었습니다.")
    } catch (e) {
      showToast(getErrorMessage(e), "error")
    }
  }

  async function handlePromoteFromWaitlist(sessionId: string, memberId: string) {
    try {
      await api.patch("/reservations/promote", { memberId, sessionId })
      await refreshSession(sessionId)
      showToast("대기자가 승격되었습니다.")
    } catch (e) {
      showToast(getErrorMessage(e), "error")
    }
  }

  async function handleCancelParticipant(sessionId: string, memberId: string) {
    try {
      await api.delete("/reservations/admin", { data: { memberId, sessionId } })
      await refreshSession(sessionId)
      showToast("참가자가 취소되었습니다.")
    } catch (e) {
      showToast(getErrorMessage(e), "error")
    }
  }

  return {
    sessions,
    setSessions,
    fetchSessions,
    refreshSession,
    handleCreateSession,
    handleEditSession,
    handleDeleteSession,
    handleUpdateSessionStatus,
    handleConfirmPayment,
    handleConfirmAll,
    handlePromoteFromWaitlist,
    handleCancelParticipant,
  }
}
