import { useState } from "react"
import type { Member } from "@/types"

export function useAuth(setMembers: React.Dispatch<React.SetStateAction<Member[]>>) {
  const [currentUser, setCurrentUser] = useState<Member | null>(null)

  function handleLogin(member: Member) {
    setCurrentUser(member)
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
  }

  function handleLogout() {
    setCurrentUser(null)
  }

  function handleUpdateProfile(updated: Pick<Member, "level" | "phone" | "password">) {
    setCurrentUser((prev) => (prev ? { ...prev, ...updated } : prev))
    setMembers((prev) => prev.map((m) => (m.id === currentUser?.id ? { ...m, ...updated } : m)))
  }

  return { currentUser, handleLogin, handleSignup, handleLogout, handleUpdateProfile }
}
