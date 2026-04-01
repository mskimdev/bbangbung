import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface PasswordInputProps {
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  placeholder?: string
  isError?: boolean
  required?: boolean
}

export function PasswordInput({ value, onChange, show, onToggle, placeholder, isError, required }: PasswordInputProps) {
  return (
    <div className={cn(
      "flex items-center rounded-xl border bg-background transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
      isError ? "border-destructive" : "border-border",
    )}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
      />
      <button type="button" onClick={onToggle} className="px-3 text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
