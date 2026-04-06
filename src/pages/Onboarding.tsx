import { useState } from "react"
import { CalendarDays, BanknoteIcon, CheckCircle2, MapPin, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface OnboardingProps {
  userName: string
  onDone: () => void
}

const STEPS = [
  {
    title: (name: string) => `${name}님, 환영해요!`,
    subtitle: "빵벙은 배드민턴 정모를 쉽게 찾고 예약할 수 있는 서비스예요.",
    content: (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-primary/5 py-8">
          <span className="text-6xl">🏸</span>
          <p className="text-base font-semibold">배드민턴 정모 예약 관리</p>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { icon: CalendarDays, text: "원하는 날짜와 장소의 정모를 찾을 수 있어요" },
            { icon: Users,        text: "참가자 현황과 레벨 분포를 한눈에 확인해요" },
            { icon: MapPin,       text: "장소 정보와 상세 안내를 미리 볼 수 있어요" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <Icon className="size-5 shrink-0 text-primary" />
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: () => "예약은 이렇게 해요",
    subtitle: "신청 후 계좌이체까지 완료해야 예약이 최종 확정돼요.",
    content: (
      <div className="flex flex-col gap-3">
        {[
          {
            step: "1",
            label: "정모 신청",
            desc: "원하는 정모를 찾아 신청하기 버튼을 눌러요",
            icon: CalendarDays,
            bg: "bg-blue-50 dark:bg-blue-900/20",
            border: "border-blue-200 dark:border-blue-800",
            iconColor: "text-blue-500",
            badge: "bg-blue-500",
          },
          {
            step: "2",
            label: "참가비 계좌이체",
            desc: "세션에 안내된 계좌로 참가비를 이체해요",
            icon: BanknoteIcon,
            bg: "bg-amber-50 dark:bg-amber-900/20",
            border: "border-amber-200 dark:border-amber-800",
            iconColor: "text-amber-500",
            badge: "bg-amber-500",
          },
          {
            step: "3",
            label: "관리자 확인 후 확정",
            desc: "관리자가 입금을 확인하면 예약이 확정돼요",
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
    title: () => "이런 것도 있어요",
    subtitle: "알아두면 유용한 빵벙의 기능들을 소개할게요.",
    content: (
      <div className="flex flex-col gap-3">
        {[
          {
            icon: "⏳",
            label: "대기 신청",
            desc: "정원이 찼어도 대기 신청을 할 수 있어요. 자리가 나면 관리자가 입금 요청을 드려요.",
          },
          {
            icon: "🔔",
            label: "입금 대기 알림",
            desc: "홈 화면에서 입금 대기 중인 예약을 바로 확인할 수 있어요.",
          },
          {
            icon: "🎟️",
            label: "무료 참여권",
            desc: "10회 참여 시 무료 참여권 1장이 적립돼요. 다음 정모 신청 시 참가비 없이 바로 확정할 수 있어요.",
          },
          {
            icon: "📋",
            label: "내 예약 관리",
            desc: "예약 탭에서 예정 모임과 지난 모임 이력을 한눈에 볼 수 있어요.",
          },
          {
            icon: "👤",
            label: "프로필 수정",
            desc: "급수나 연락처는 내 정보 탭에서 언제든지 수정할 수 있어요.",
          },
        ].map(({ icon, label, desc }) => (
          <div key={label} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <span className="text-xl leading-none">{icon}</span>
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
            {isLast ? "빵벙 시작하기 🏸" : "다음"}
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
