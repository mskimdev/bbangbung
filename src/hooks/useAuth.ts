import { useState, useEffect } from "react"
import type { Member } from "@/types"
import api from "@/lib/api"

type ShowToast = (message: string, type?: "success" | "error") => void

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const res = (error as any).response
    if (res?.data?.message) return res.data.message
  }
  return "오류가 발생했습니다."
}

function mapMember(m: any): Member {
  return {
    id: m.id,
    name: m.name,
    birthdate: m.birthdate,
    gender: m.gender,
    level: m.level,
    phone: m.phone,
    password: m.password,
    joinedAt: m.joinedAt,
    isAdmin: m.isAdmin,
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
  }

  async function handleUpdateProfile(updated: Pick<Member, "level" | "phone" | "password">) {
    if (!currentUser) return
    try {
      const { data: m } = await api.patch(`/members/${currentUser.id}`, {
        level: updated.level,
        phone: updated.phone,
        password: updated.password,
      })
      const next = mapMember(m)
      setCurrentUser(next)
      showToast("프로필이 수정되었습니다.")
      return next
    } catch (e) {
      showToast(getErrorMessage(e), "error")
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

  return { currentUser, authLoading, handleLogin, handleSignup, handleLogout, handleUpdateProfile, handleChangePassword }
}
