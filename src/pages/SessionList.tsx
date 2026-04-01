import { CalendarDays } from "lucide-react"
import { SessionCard } from "./Home"
import { Button } from "@/components/ui/button"
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
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <CalendarDays className="size-10 opacity-40" />
            <div className="text-center">
              <p className="text-sm font-medium">
                {filter === "all" ? "아직 정모가 없습니다" :
                 filter === "open" ? "모집 중인 정모가 없습니다" :
                 filter === "closed" ? "마감된 정모가 없습니다" :
                 "완료된 정모가 없습니다"}
              </p>
              {filter === "open" && (
                <p className="mt-1 text-xs">다른 탭을 확인하거나 나중에 다시 와보세요</p>
              )}
            </div>
            {filter !== "all" && (
              <Button variant="outline" size="sm" onClick={() => setFilter("all")}>
                전체 보기
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
