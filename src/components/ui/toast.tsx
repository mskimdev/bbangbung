import { useEffect } from "react"
import { CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  message: string
  type: "success" | "error"
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-32 left-1/2 z-50 -translate-x-1/2">
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-lg",
          type === "success"
            ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/50 dark:text-green-200"
            : "border-destructive/30 bg-destructive/10 text-destructive",
        )}
      >
        {type === "success"
          ? <CheckCircle2 className="size-4 shrink-0" />
          : <XCircle className="size-4 shrink-0" />
        }
        {message}
      </div>
    </div>
  )
}
