import { useState } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Auth } from "@/pages/Auth"
import { Home } from "@/pages/Home"
import { SessionList } from "@/pages/SessionList"
import { SessionDetail } from "@/pages/SessionDetail"
import { MyReservations } from "@/pages/MyReservations"
import { MyProfile } from "@/pages/MyProfile"
import { Admin } from "@/pages/Admin"
import { mockSessions, mockMembers, mockReservations } from "@/data/mock"
import type { BbangSession, Member, Page, Reservation, SessionParticipant } from "@/types"

export default function App() {
  const [currentUser, setCurrentUser] = useState<Member | null>(null)
  const [page, setPage] = useState<Page>("home")
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<BbangSession[]>(mockSessions)
  const [members, setMembers] = useState<Member[]>(mockMembers)
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations)

  // ── 인증 ──────────────────────────────────────────────
  function handleLogin(member: Member) {
    setCurrentUser(member)
    setPage("home")
  }

  function handleSignup(data: Omit<Member, "id" | "joinedAt" | "isAdmin">) {
    const newMember: Member = {
      ...data,
      id: `member-${Date.now()}`,
      joinedAt: new Date().toISOString().slice(0, 10),
      isAdmin: false,
    }
    setMembers((prev) => [...prev, newMember])
    setCurrentUser(newMember)
    setPage("home")
  }

  if (!currentUser) {
    return <Auth members={members} onLogin={handleLogin} onSignup={handleSignup} />
  }

  // ── 로그아웃 ───────────────────────────────────────────
  function handleLogout() {
    setCurrentUser(null)
    setPage("home")
    setSelectedSessionId(null)
    setReservations(mockReservations)
    setSessions(mockSessions)
    setMembers(mockMembers)
  }

  // ── 내 정보 수정 ────────────────────────────────────────
  function handleUpdateProfile(updated: Pick<Member, "level" | "phone" | "password">) {
    setCurrentUser((prev) => prev ? { ...prev, ...updated } : prev)
    setMembers((prev) =>
      prev.map((m) => m.id === currentUser.id ? { ...m, ...updated } : m)
    )
  }

  // ── 내비게이션 ─────────────────────────────────────────
  function navigate(nextPage: Page, sessionId?: string) {
    if (sessionId) setSelectedSessionId(sessionId)
    setPage(nextPage)
    window.scrollTo(0, 0)
  }

  // ── 대기 신청 ──────────────────────────────────────────
  function handleWaitlist(sessionId: string) {
    const session = sessions.find((s) => s.id === sessionId)
    if (!session) return

    const newParticipant: SessionParticipant = {
      memberId: currentUser.id,
      memberName: currentUser.name,
      gender: currentUser.gender,
      level: currentUser.level,
      reservedAt: new Date().toISOString().slice(0, 10),
      status: "waitlisted",
    }
    setSessions((prev) =>
      prev.map((s) => s.id === sessionId ? { ...s, participants: [...s.participants, newParticipant] } : s)
    )
    setReservations((prev) => [...prev, {
      id: `res-${Date.now()}`,
      sessionId: session.id,
      sessionTitle: session.title,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location,
      fee: session.fee,
      status: "waitlisted",
      createdAt: new Date().toISOString().slice(0, 10),
    }])
  }

  // ── 신청 → pending ──────────────────────────────────────
  function handleReserve(sessionId: string) {
    const session = sessions.find((s) => s.id === sessionId)
    if (!session) return

    const newParticipant: SessionParticipant = {
      memberId: currentUser.id,
      memberName: currentUser.name,
      gender: currentUser.gender,
      level: currentUser.level,
      reservedAt: new Date().toISOString().slice(0, 10),
      status: "pending",
    }
    setSessions((prev) =>
      prev.map((s) => s.id === sessionId ? { ...s, participants: [...s.participants, newParticipant] } : s)
    )
    setReservations((prev) => [...prev, {
      id: `res-${Date.now()}`,
      sessionId: session.id,
      sessionTitle: session.title,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location,
      fee: session.fee,
      status: "pending",
      createdAt: new Date().toISOString().slice(0, 10),
    }])
  }

  // ── 예약 취소 ──────────────────────────────────────────
  function handleCancel(reservationId: string) {
    const reservation = reservations.find((r) => r.id === reservationId)
    if (!reservation) return

    const wasConfirmed = reservation.status === "confirmed"
    setReservations((prev) =>
      prev.map((r) => r.id === reservationId ? { ...r, status: "cancelled" } : r)
    )
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== reservation.sessionId) return s
        return {
          ...s,
          participants: s.participants.map((p) =>
            p.memberId === currentUser.id ? { ...p, status: "cancelled" } : p
          ),
          currentParticipants: wasConfirmed ? s.currentParticipants - 1 : s.currentParticipants,
        }
      })
    )
  }

  // ── 관리자: 대기 → pending 승격 ────────────────────────
  function handlePromoteFromWaitlist(sessionId: string, memberId: string) {
    setSessions((prev) =>
      prev.map((s) => s.id !== sessionId ? s : {
        ...s,
        participants: s.participants.map((p) =>
          p.memberId === memberId && p.status === "waitlisted" ? { ...p, status: "pending" } : p
        ),
      })
    )
    setReservations((prev) =>
      prev.map((r) =>
        r.sessionId === sessionId && r.status === "waitlisted" ? { ...r, status: "pending" } : r
      )
    )
  }

  // ── 관리자: 입금 확인 → confirmed ──────────────────────
  function handleConfirmPayment(sessionId: string, memberId: string) {
    setSessions((prev) =>
      prev.map((s) => s.id !== sessionId ? s : {
        ...s,
        participants: s.participants.map((p) =>
          p.memberId === memberId && p.status === "pending" ? { ...p, status: "confirmed" } : p
        ),
        currentParticipants: s.currentParticipants + 1,
      })
    )
    setReservations((prev) =>
      prev.map((r) =>
        r.sessionId === sessionId && r.status === "pending" ? { ...r, status: "confirmed" } : r
      )
    )
  }

  // ── 관리자: 정모 생성 ──────────────────────────────────
  function handleCreateSession(data: Omit<BbangSession, "id" | "currentParticipants" | "participants" | "status">) {
    const newSession: BbangSession = {
      ...data,
      id: `session-${Date.now()}`,
      currentParticipants: 0,
      participants: [],
      status: "open",
    }
    setSessions((prev) => [...prev, newSession])
  }

  // ── 관리자: 참가자 취소 ────────────────────────────────
  function handleCancelParticipant(sessionId: string, memberId: string) {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s
        const target = s.participants.find((p) => p.memberId === memberId)
        const wasConfirmed = target?.status === "confirmed"
        return {
          ...s,
          participants: s.participants.map((p) =>
            p.memberId === memberId ? { ...p, status: "cancelled" } : p
          ),
          currentParticipants: wasConfirmed ? s.currentParticipants - 1 : s.currentParticipants,
        }
      })
    )
  }

  const selectedSession = sessions.find((s) => s.id === selectedSessionId)

  return (
    <div className="min-h-svh bg-background">
      <main className="mx-auto max-w-lg px-4 pt-6 pb-20">
        {page === "home" && (
          <Home currentUser={currentUser} sessions={sessions} reservations={reservations} onNavigate={navigate} />
        )}
        {page === "profile" && (
          <MyProfile currentUser={currentUser} onUpdate={handleUpdateProfile} onLogout={handleLogout} />
        )}
        {page === "sessions" && (
          <SessionList sessions={sessions} onNavigate={navigate} />
        )}
        {page === "session-detail" && selectedSession && (
          <SessionDetail
            session={selectedSession}
            currentUser={currentUser}
            reservations={reservations}
            onNavigate={navigate}
            onReserve={handleReserve}
            onWaitlist={handleWaitlist}
            onCancel={handleCancel}
          />
        )}
        {page === "my-reservations" && (
          <MyReservations reservations={reservations} onNavigate={navigate} onCancel={handleCancel} />
        )}
        {page === "admin" && (
          <Admin
            sessions={sessions}
            members={members}
            currentUser={currentUser}
            onNavigate={navigate}
            onConfirmPayment={handleConfirmPayment}
            onCancelParticipant={handleCancelParticipant}
            onPromoteFromWaitlist={handlePromoteFromWaitlist}
            onCreateSession={handleCreateSession}
          />
        )}
      </main>
      <Navbar currentPage={page} isAdmin={currentUser.isAdmin} onNavigate={navigate} />
    </div>
  )
}
