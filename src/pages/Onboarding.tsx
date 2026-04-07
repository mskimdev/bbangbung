import { useState } from "react"
import { CalendarDays, BanknoteIcon, CheckCircle2, Clock, Ticket, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface OnboardingProps {
  userName: string
  onDone: () => void
}

const STEPS = [
  {
    title: (name: string) => `${name}님, 반갑습니다.`,
    subtitle: "배드민턴 정모 예약을 여기서 관리하세요.",
    content: (
      <div className="flex flex-col items-center justify-center gap-6 py-10">
        <div className="flex size-24 items-center justify-center rounded-3xl bg-primary/10">
          <CalendarDays className="size-12 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">빵벙</p>
          <p className="mt-1 text-sm text-muted-foreground">정모 찾기부터 예약 확정까지 한 곳에서.</p>
        </div>
      </div>
    ),
  },
  {
    title: () => "예약 흐름",
    subtitle: "신청 후 계좌이체를 완료하면 관리자가 확정합니다.",
    content: (
      <div className="flex flex-col gap-3">
        {[
          {
            step: "1",
            label: "정모 신청",
            desc: "원하는 정모를 찾아 신청하기를 누릅니다",
            icon: CalendarDays,
            bg: "bg-blue-50 dark:bg-blue-900/20",
            border: "border-blue-200 dark:border-blue-800",
            iconColor: "text-blue-500",
            badge: "bg-blue-500",
          },
          {
            step: "2",
            label: "참가비 계좌이체",
            desc: "안내된 계좌로 참가비를 이체합니다",
            icon: BanknoteIcon,
            bg: "bg-amber-50 dark:bg-amber-900/20",
            border: "border-amber-200 dark:border-amber-800",
            iconColor: "text-amber-500",
            badge: "bg-amber-500",
          },
          {
            step: "3",
            label: "관리자 확정",
            desc: "입금 확인 후 예약이 확정됩니다",
            icon: CheckCircle2,
            bg: "bg-green-50 dark:bg-green-900/20",
            border: "border-green-200 dark:border-green-800",
            iconColor: "text-green-500",
            badge: "bg-green-500",
          },
        ].map(({ step, label, desc, icon: Icon, bg, border, iconColor, badge }) => (
          <div key={step} className={cn("flex items-start gap-4 rounded-xl border p-4", bg, border)}>
            <div className="flex flex-col items-center gap-1.5 pt-0.5">
              <span className={cn("flex size-6 items-center justify-center rounded-full text-xs font-bold text-white", badge)}>
                {step}
              </span>
              {step !== "3" && <span className="h-8 w-px bg-border" />}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <Icon className={cn("size-4 shrink-0", iconColor)} />
                <span className="text-sm font-semibold">{label}</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: () => "알아두면 좋은 것들",
    subtitle: "",
    content: (
      <div className="flex flex-col gap-3">
        {[
          {
            icon: Clock,
            label: "대기 신청",
            desc: "정원이 찼을 때 대기 신청이 가능합니다. 자리가 나면 관리자가 입금 요청을 드립니다.",
          },
          {
            icon: Ticket,
            label: "무료 참여권",
            desc: "10회 참여 시 1장이 적립됩니다. 다음 정모를 참가비 없이 바로 확정할 수 있습니다.",
          },
          {
            icon: BookOpen,
            label: "내 예약",
            desc: "예약 탭에서 예정 모임과 지난 모임 이력을 확인할 수 있습니다.",
          },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <Icon className="size-5 shrink-0 text-primary mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">{desc}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
]

export function Onboarding({ userName, onDone }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pb-8 pt-10">

        {/* 진행 표시 */}
        <div className="mb-7 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step ? "w-8 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted"
              )}
            />
          ))}
        </div>

        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold leading-tight">
            {current.title(userName)}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {current.subtitle}
          </p>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {current.content}
        </div>

        {/* 버튼 */}
        <div className="flex flex-col gap-2 pt-6">
          <Button
            size="lg"
            className="w-full"
            onClick={() => isLast ? onDone() : setStep((s) => s + 1)}
          >
            {isLast ? "시작하기" : "다음"}
          </Button>
          {!isLast && (
            <button
              onClick={onDone}
              className="py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              건너뛰기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
