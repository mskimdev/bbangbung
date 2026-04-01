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
import { Toast } from "@/components/ui/toast"
import { useAuth } from "@/hooks/useAuth"
import { useSessions } from "@/hooks/useSessions"
import { useReservations } from "@/hooks/useReservations"
import { useNavigation } from "@/hooks/useNavigation"
import { useToast } from "@/hooks/useToast"

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  const { page, selectedSessionId, navigate, resetNavigation } = useNavigation()
  const { toast, showToast, hideToast } = useToast()

  const {
    sessions,
    refreshSession,
    handleCreateSession,
    handleConfirmPayment,
    handlePromoteFromWaitlist,
    handleCancelParticipant,
    handleUpdateSessionStatus,
    handleEditSession,
    handleDeleteSession,
  } = useSessions(showToast)

  const { currentUser, authLoading, handleLogin, handleSignup, handleLogout, handleUpdateProfile, handleChangePassword } =
    useAuth(showToast)

  const { reservations, handleReserve, handleWaitlist, handleCancel } =
    useReservations(currentUser, refreshSession, showToast)

  async function handleLogoutAndReset() {
    handleLogout()
    resetNavigation()
  }

  if (authLoading) {
    return <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground text-sm">로딩 중...</div>
  }

  if (!currentUser) {
    return (
      <>
        <Auth
          onLogin={handleLogin}
          onSignup={async (data) => {
            await handleSignup(data)
            setShowOnboarding(true)
          }}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </>
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
          <MyProfile currentUser={currentUser} onUpdate={handleUpdateProfile} onChangePassword={handleChangePassword} onLogout={handleLogoutAndReset} />
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
