import { useState, useEffect } from "react"
import type { Member } from "@/types"
import api, { getErrorMessage } from "@/lib/api"

type ShowToast = (message: string, type?: "success" | "error") => void

function mapMember(m: any): Member {
  return {
    id: m.id,
    name: m.name,
    birthdate: m.birthdate,
    gender: m.gender,
    level: m.level,
    phone: m.phone,
    joinedAt: m.joinedAt,
    isAdmin: m.isAdmin,
    freeTickets: m.freeTickets ?? 0,
    totalAttendance: m.totalAttendance ?? 0,
    monthlyAttendance: m.monthlyAttendance ?? 0,
  }
}

export function useAuth(showToast: ShowToast) {
  const [currentUser, setCurrentUser] = useState<Member | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // 앱 시작 시 토큰으로 자동 로그인
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setAuthLoading(false)
      return
    }
    api.get("/members/me")
      .then(({ data }) => setCurrentUser(mapMember(data)))
      .catch(() => localStorage.removeItem("token")) // 토큰 만료 시 제거
      .finally(() => setAuthLoading(false))
  }, [])

  async function handleLogin(phone: string, password: string) {
    const { data } = await api.post("/members/login", { phone, password })
    localStorage.setItem("token", data.token)
    const member = mapMember(data.member)
    setCurrentUser(member)
    showToast(`환영합니다, ${member.name}님!`)
    return member
  }

  async function handleSignup(data: {
    name: string
    birthdate: string
    gender: string
    level: string
    phone: string
    password: string
  }) {
    await api.post("/members/signup", data)
    await handleLogin(data.phone, data.password)
  }

  function handleLogout() {
    localStorage.removeItem("token")
    setCurrentUser(null)
    showToast("로그아웃 되었습니다.")
  }

  async function handleUpdateProfile(updated: Pick<Member, "level" | "phone">) {
    if (!currentUser) return
    try {
      const { data: m } = await api.patch(`/members/${currentUser.id}`, {
        level: updated.level,
        phone: updated.phone,
      })
      const next = mapMember(m)
      setCurrentUser(next)
      showToast("프로필이 수정되었습니다.")
      return next
    } catch (e) {
      showToast(getErrorMessage(e), "error")
      throw e
    }
  }

  async function handleChangePassword(currentPassword: string, newPassword: string) {
    if (!currentUser) return
    try {
      await api.patch(`/members/${currentUser.id}/password`, { currentPassword, newPassword })
      showToast("비밀번호가 변경되었습니다.")
    } catch (e) {
      showToast(getErrorMessage(e), "error")
      throw e
    }
  }

  async function refreshCurrentUser() {
    try {
      const { data } = await api.get("/members/me")
      setCurrentUser(mapMember(data))
    } catch {}
  }

  return { currentUser, authLoading, handleLogin, handleSignup, handleLogout, handleUpdateProfile, handleChangePassword, refreshCurrentUser }
}
