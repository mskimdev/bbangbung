import { useState } from "react"
import { mockReservations } from "@/data/mock"
import type { BbangSession, Member, Reservation, SessionParticipant } from "@/types"

export function useReservations(
  currentUser: Member | null,
  sessions: BbangSession[],
  addParticipant: (sessionId: string, participant: SessionParticipant) => void,
  cancelMyParticipant: (sessionId: string, memberId: string) => void,
) {
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations)

  function resetReservations() {
    setReservations(mockReservations)
  }

  function buildParticipant(user: Member, status: SessionParticipant["status"]): SessionParticipant {
    return {
      memberId: user.id,
      memberName: user.name,
      gender: user.gender,
      level: user.level,
      reservedAt: new Date().toISOString().slice(0, 10),
      status,
    }
  }

  function buildReservation(session: BbangSession, status: Reservation["status"]): Reservation {
    return {
      id: `res-${Date.now()}`,
      sessionId: session.id,
      sessionTitle: session.title,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location,
      fee: session.fee,
      status,
      createdAt: new Date().toISOString().slice(0, 10),
    }
  }

  function handleReserve(sessionId: string) {
    if (!currentUser) return
    const session = sessions.find((s) => s.id === sessionId)
    if (!session) return

    addParticipant(sessionId, buildParticipant(currentUser, "pending"))
    setReservations((prev) => [...prev, buildReservation(session, "pending")])
  }

  function handleWaitlist(sessionId: string) {
    if (!currentUser) return
    const session = sessions.find((s) => s.id === sessionId)
    if (!session) return

    addParticipant(sessionId, buildParticipant(currentUser, "waitlisted"))
    setReservations((prev) => [...prev, buildReservation(session, "waitlisted")])
  }

  function handleCancel(reservationId: string) {
    const reservation = reservations.find((r) => r.id === reservationId)
    if (!reservation) return

    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: "cancelled" } : r)),
    )
    if (!currentUser) return
    cancelMyParticipant(reservation.sessionId, currentUser.id)
  }

  return { reservations, resetReservations, handleReserve, handleWaitlist, handleCancel }
}
