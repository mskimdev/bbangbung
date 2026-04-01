import { useState } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Auth } from "@/pages/Auth"
import { Home } from "@/pages/Home"
import { SessionList } from "@/pages/SessionList"
import { SessionDetail } from "@/pages/SessionDetail"
import { MyReservations } from "@/pages/MyReservations"
import { MyProfile } from "@/pages/MyProfile"
import { Admin } from "@/pages/Admin"
import { Onboarding } from "@/pages/Onboarding"
import { mockMembers } from "@/data/mock"
import { useAuth } from "@/hooks/useAuth"
import { useSessions } from "@/hooks/useSessions"
import { useReservations } from "@/hooks/useReservations"
import { useNavigation } from "@/hooks/useNavigation"
import type { Member } from "@/types"

export default function App() {
  const [members, setMembers] = useState<Member[]>(mockMembers)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const { page, selectedSessionId, navigate, resetNavigation } = useNavigation()

  const {
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
  } = useSessions()

  const { currentUser, handleLogin, handleSignup, handleLogout, handleUpdateProfile } =
    useAuth(setMembers)

  const { reservations, resetReservations, handleReserve, handleWaitlist, handleCancel } =
    useReservations(currentUser, sessions, addParticipant, handleCancelMyParticipant)

  function handleLogoutAndReset() {
    handleLogout()
    resetSessions()
    resetReservations()
    resetNavigation()
  }

  if (!currentUser) {
    return (
      <Auth
        members={members}
        onLogin={handleLogin}
        onSignup={(data) => { handleSignup(data); setShowOnboarding(true) }}
      />
    )
  }

  if (showOnboarding) {
    return <Onboarding userName={currentUser.name} onDone={() => setShowOnboarding(false)} />
  }

  const selectedSession = sessions.find((s) => s.id === selectedSessionId)

  return (
    <div className="min-h-svh bg-background">
      <main className="mx-auto max-w-lg px-4 pt-6 pb-20">
        {page === "home" && (
          <Home currentUser={currentUser} sessions={sessions} reservations={reservations} onNavigate={navigate} />
        )}
        {page === "profile" && (
          <MyProfile currentUser={currentUser} onUpdate={handleUpdateProfile} onLogout={handleLogoutAndReset} />
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
            onUpdateSessionStatus={handleUpdateSessionStatus}
            onEditSession={handleEditSession}
            onDeleteSession={(sessionId) => { handleDeleteSession(sessionId); navigate("admin") }}
          />
        )}
      </main>
      <Navbar currentPage={page} isAdmin={currentUser.isAdmin} onNavigate={navigate} />
    </div>
  )
}
