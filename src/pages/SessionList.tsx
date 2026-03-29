import { SessionCard } from "./Home"
import type { BbangSession, Page, SessionStatus } from "@/types"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface SessionListProps {
  sessions: BbangSession[]
  onNavigate: (page: Page, sessionId?: string) => void
}

type FilterTab = "all" | SessionStatus

const tabs: { value: FilterTab; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "open", label: "모집중" },
  { value: "closed", label: "마감" },
  { value: "completed", label: "완료" },
]

export function SessionList({ sessions, onNavigate }: SessionListProps) {
  const [filter, setFilter] = useState<FilterTab>("all")

  const filtered = sessions
    .filter((s) => filter === "all" || s.status === filter)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="flex flex-col gap-4 pb-4">
      <h1 className="text-xl font-bold">빵벙 정모 목록</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors",
              filter === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Session list */}
      <div className="flex flex-col gap-3">
        {filtered.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onClick={() => onNavigate("session-detail", session.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            해당하는 정모가 없습니다
          </p>
        )}
      </div>
    </div>
  )
}
