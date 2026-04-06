import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ message, confirmLabel = "확인", onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-24 sm:items-center sm:pb-0">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-xl">
        <p className="text-center text-sm leading-relaxed">{message}</p>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>돌아가기</Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
