import { useState } from "react"
import type { Page } from "@/types"

export function useNavigation(initialPage: Page = "home") {
  const [page, setPage] = useState<Page>(initialPage)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  function navigate(nextPage: Page, sessionId?: string) {
    if (sessionId) setSelectedSessionId(sessionId)
    setPage(nextPage)
    window.scrollTo(0, 0)
  }

  function resetNavigation() {
    setPage("home")
    setSelectedSessionId(null)
  }

  return { page, selectedSessionId, navigate, resetNavigation }
}
