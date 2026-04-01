import { useState } from "react"
import { mockSessions } from "@/data/mock"
import type { BbangSession, SessionParticipant, SessionStatus } from "@/types"

export function useSessions() {
  const [sessions, setSessions] = useState<BbangSession[]>(mockSessions)

  function resetSessions() {
    setSessions(mockSessions)
  }

  function handleCreateSession(
    data: Omit<BbangSession, "id" | "currentParticipants" | "participants" | "status">,
  ) {
    const newSession: BbangSession = {
      ...data,
      id: `session-${Date.now()}`,
      currentParticipants: 0,
      participants: [],
      status: "open",
    }
    setSessions((prev) => [...prev, newSession])
  }

  function addParticipant(sessionId: string, participant: SessionParticipant) {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, participants: [...s.participants, participant] } : s,
      ),
    )
  }

  function updateParticipantStatus(
    sessionId: string,
    memberId: string,
    status: SessionParticipant["status"],
  ) {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s
        const nextParticipants = s.participants.map((p) =>
          p.memberId === memberId ? { ...p, status } : p,
        )
        return {
          ...s,
          participants: nextParticipants,
          currentParticipants: nextParticipants.filter((p) => p.status === "confirmed").length,
        }
      }),
    )
  }

  function handleConfirmPayment(sessionId: string, memberId: string) {
    updateParticipantStatus(sessionId, memberId, "confirmed")
  }

  function handlePromoteFromWaitlist(sessionId: string, memberId: string) {
    updateParticipantStatus(sessionId, memberId, "pending")
  }

  function handleCancelParticipant(sessionId: string, memberId: string) {
    updateParticipantStatus(sessionId, memberId, "cancelled")
  }

  function handleCancelMyParticipant(sessionId: string, memberId: string) {
    updateParticipantStatus(sessionId, memberId, "cancelled")
  }

  function handleUpdateSessionStatus(sessionId: string, status: SessionStatus) {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status } : s))
    )
  }

  function handleEditSession(
    sessionId: string,
    data: Omit<BbangSession, "id" | "currentParticipants" | "participants" | "status">,
  ) {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, ...data } : s))
    )
  }

  function handleDeleteSession(sessionId: string) {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
  }

  return {
    sessions,
    resetSessions,
    addParticipant,
    handleCreateSession,
    handleConfirmPayment,
    handlePromoteFromWaitlist,
    handleCancelParticipant,
    handleCancelMyParticipant,
    handleUpdateSessionStatus,
    handleEditSession,
    handleDeleteSession,
  }
}
