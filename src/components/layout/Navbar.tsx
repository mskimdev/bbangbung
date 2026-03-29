import { Home, CalendarDays, BookMarked, UserCircle, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Page } from "@/types"

interface NavbarProps {
  currentPage: Page
  isAdmin: boolean
  onNavigate: (page: Page) => void
}

const navItems = [
  { page: "home" as Page,             label: "홈",     icon: Home },
  { page: "sessions" as Page,         label: "정모",   icon: CalendarDays },
  { page: "my-reservations" as Page,  label: "내 예약", icon: BookMarked },
  { page: "profile" as Page,          label: "내 정보", icon: UserCircle },
]

const adminItem = { page: "admin" as Page, label: "관리", icon: Settings }

export function Navbar({ currentPage, isAdmin, onNavigate }: NavbarProps) {
  const items = isAdmin ? [...navItems, adminItem] : navItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg">
        {items.map(({ page, label, icon: Icon }) => {
          const isActive =
            currentPage === page ||
            (currentPage === "session-detail" && page === "sessions")
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("size-5", isActive && "stroke-[2.5]")} />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
