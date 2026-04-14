import axios from "axios"

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? "http://localhost:8080") + "/api",
  headers: { "Content-Type": "application/json" },
})

// 요청마다 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const courtsApi = {
  get:    (sessionId: string) =>
    api.get<import("@/types").CourtSlotApi[]>(`/sessions/${sessionId}/courts`),
  update: (sessionId: string, courts: import("@/types").CourtSlotApi[]) =>
    api.put<import("@/types").CourtSlotApi[]>(`/sessions/${sessionId}/courts`, courts),
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const res = (error as any).response
    if (res?.data?.message) return res.data.message
  }
  return "오류가 발생했습니다."
}

export default api
