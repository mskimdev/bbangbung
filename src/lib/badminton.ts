import type { BadmintonLevel, BbangSession, SessionStatus } from "@/types"

export const LEVEL_COLORS: Record<BadmintonLevel, string> = {
  S: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  A: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  B: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  C: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  D: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

export const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "outline" }
> = {
  open: { label: "모집중", variant: "success" },
  closed: { label: "마감", variant: "destructive" },
  completed: { label: "완료", variant: "secondary" },
  cancelled: { label: "취소", variant: "outline" },
}

export function getLevelCounts(session: BbangSession) {
  const counts: Record<BadmintonLevel, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 }
  session.participants
    .filter((p) => p.status === "confirmed")
    .forEach((p) => counts[p.level]++)
  return counts
}

export function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  })
}

export function formatFee(fee: number) {
  return fee.toLocaleString("ko-KR") + "원"
}
