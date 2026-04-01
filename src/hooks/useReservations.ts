import { useState, useEffect } from "react"
import type { Member, Reservation } from "@/types"
import api from "@/lib/api"

type ShowToast = (message: string, type?: "success" | "error") => void

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const res = (error as any).response
    if (res?.data?.message) return res.data.message
  }
  return "오류가 발생했습니다."
}

function mapReservation(r: any): Reservation {
  return {
    id: r.id,
    sessionId: r.sessionId,
    sessionTitle: r.sessionTitle,
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
    location: r.location,
    fee: r.fee,
    status: r.status,
    createdAt: r.createdAt,
  }
}

export function useReservations(
  currentUser: Member | null,
  refreshSession: (sessionId: string) => Promise<void>,
  showToast: ShowToast,
) {
  const [reservations, setReservations] = useState<Reservation[]>([])

  async function fetchReservations() {
    if (!currentUser) return
    try {
      const { data } = await api.get(`/reservations/members/${currentUser.id}`)
      setReservations(data.map(mapReservation))
    } catch (e) {
      showToast(getErrorMessage(e), "error")
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [currentUser])

  async function handleReserve(sessionId: string) {
    if (!currentUser) return
    try {
      await api.post("/reservations", { memberId: currentUser.id, sessionId })
      await Promise.all([fetchReservations(), refreshSession(sessionId)])
      showToast("예약 신청이 완료되었습니다.")
    } catch (e) {
      showToast(getErrorMessage(e), "error")
    }
  }

  async function handleWaitlist(sessionId: string) {
    if (!currentUser) return
    try {
      await api.post("/reservations/waitlist", { memberId: currentUser.id, sessionId })
      await Promise.all([fetchReservations(), refreshSession(sessionId)])
      showToast("대기 신청이 완료되었습니다.")
    } catch (e) {
      showToast(getErrorMessage(e), "error")
    }
  }

  async function handleCancel(reservationId: string) {
    if (!currentUser) return
    const reservation = reservations.find((r) => r.id === reservationId)
    if (!reservation) return
    try {
      await api.delete("/reservations", { data: { memberId: currentUser.id, sessionId: reservation.sessionId } })
      await Promise.all([fetchReservations(), refreshSession(reservation.sessionId)])
      showToast("예약이 취소되었습니다.")
    } catch (e) {
      showToast(getErrorMessage(e), "error")
    }
  }

  return { reservations, fetchReservations, handleReserve, handleWaitlist, handleCancel }
}
