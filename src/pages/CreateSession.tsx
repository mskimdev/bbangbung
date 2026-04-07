import { useState } from "react"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"
import { LEVEL_COLORS } from "@/lib/badminton"
import type { BadmintonLevel, BbangSession } from "@/types"

const LEVELS: BadmintonLevel[] = ["S", "A", "B", "C", "D"]

interface CreateSessionProps {
  organizer: string
  initialData?: BbangSession
  onSubmit: (session: Omit<BbangSession, "id" | "currentParticipants" | "participants" | "status">) => void
  onBack: () => void
}

export function CreateSession({ organizer, initialData, onSubmit, onBack }: CreateSessionProps) {
  const isEdit = !!initialData

  const [title, setTitle]               = useState(initialData?.title ?? "")
  const [date, setDate]                 = useState(initialData?.date ?? "")
  const [startTime, setStartTime]       = useState(initialData?.startTime ?? "")
  const [endTime, setEndTime]           = useState(initialData?.endTime ?? "")
  const [location, setLocation]         = useState(initialData?.location ?? "민턴하우스")
  const [address, setAddress]           = useState(initialData?.address ?? "부산 강서구 제도로 36")
  const [courtCount, setCourtCount]     = useState(String(initialData?.courtCount ?? "4"))
  const [maxParticipants, setMax]       = useState(String(initialData?.maxParticipants ?? "24"))
  const [fee, setFee]                   = useState(String(initialData?.fee ?? "7000"))
  const [description, setDescription]  = useState(initialData?.description ?? "")
  const [levelRestriction, setLevelRestriction] = useState<BadmintonLevel[]>(initialData?.levelRestriction ?? [])
  const [error, setError]               = useState("")
  const [showBackConfirm, setShowBackConfirm] = useState(false)
  const [isDirty, setIsDirty]           = useState(false)

  function toggleLevel(level: BadmintonLevel) {
    setLevelRestriction((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!startTime || !endTime) {
      setError("시작 시간과 종료 시간을 입력해주세요.")
      return
    }
    if (endTime === startTime) {
      setError("시작 시간과 종료 시간이 같을 수 없습니다.")
      return
    }
    if (!isEdit && date < today) {
      setError("과거 날짜로는 정모를 생성할 수 없습니다.")
      return
    }
    if (parseInt(maxParticipants) < 2) {
      setError("최대 인원은 2명 이상이어야 합니다.")
      return
    }
    if (parseInt(courtCount) < 1) {
      setError("코트 수는 1개 이상이어야 합니다.")
      return
    }
    if (!fee.trim() || parseInt(fee) < 0) {
      setError("참가비를 올바르게 입력해주세요.")
      return
    }

    onSubmit({
      title: title.trim(),
      date,
      startTime,
      endTime,
      location: location.trim(),
      address: address.trim(),
      courtCount: parseInt(courtCount),
      maxParticipants: parseInt(maxParticipants),
      fee: parseInt(fee) || 0,
      description: description.trim(),
      organizer,
      levelRestriction: levelRestriction.length > 0 ? levelRestriction : null,
    })
  }

  const today = new Date().toISOString().slice(0, 10)

  function handleBack() {
    if (isDirty) {
      setShowBackConfirm(true)
    } else {
      onBack()
    }
  }

  return (
    <form onSubmit={handleSubmit} onChange={() => setIsDirty(true)} className="flex flex-col gap-5 pb-4">
      {/* 헤더 */}
      <button
        type="button"
        onClick={handleBack}
        className="-mx-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        관리자
      </button>
      <h2 className="text-xl font-bold">{isEdit ? "정모 수정" : "정모 생성"}</h2>

      {/* 제목 */}
      <Field label="정모 제목" required>
        <input
          type="text"
          placeholder="예) 4월 첫째 주 정모"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          required
        />
      </Field>

      {/* 날짜 / 시간 */}
      <div className="grid grid-cols-1 gap-4">
        <Field label="날짜" required>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="시작 시간" required>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputClass}
              required
            />
          </Field>
          <Field label="종료 시간" required>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputClass}
              required
            />
          </Field>
        </div>
      </div>

      {/* 장소 */}
      <Field label="장소명" required>
        <input
          type="text"
          placeholder="예) 강서 실내배드민턴장"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={inputClass}
          required
        />
      </Field>
      <Field label="주소">
        <input
          type="text"
          placeholder="예) 서울 강서구 화곡로 68길 14"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={inputClass}
        />
      </Field>

      {/* 코트 수 / 최대 인원 */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="코트 수" required>
          <input
            type="number"
            min="1"
            max="20"
            value={courtCount}
            onChange={(e) => setCourtCount(e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label="최대 인원" required>
          <input
            type="number"
            min="2"
            max="100"
            value={maxParticipants}
            onChange={(e) => setMax(e.target.value)}
            className={inputClass}
            required
          />
        </Field>
      </div>

      {/* 참가비 */}
      <Field label="참가비 (원)">
        <div className="relative">
          <input
            type="number"
            min="0"
            step="500"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className={cn(inputClass, "pr-10")}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">원</span>
        </div>
      </Field>

      {/* 급수 제한 */}
      <Field label="급수 제한 (선택 안 하면 전체 허용)">
        <div className="flex gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => toggleLevel(l)}
              className={cn(
                "flex flex-1 items-center justify-center rounded-xl border py-3 text-sm font-bold transition-colors",
                levelRestriction.includes(l)
                  ? cn("border-transparent", LEVEL_COLORS[l])
                  : "border-border text-muted-foreground hover:border-foreground/30"
              )}
            >
              {l}
            </button>
          ))}
        </div>
        {levelRestriction.length > 0 && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            선택된 급수: {levelRestriction.sort().join(", ")} 만 참가 가능
          </p>
        )}
      </Field>

      {/* 설명 */}
      <Field label="모임 설명">
        <textarea
          placeholder="정모에 대한 안내 사항을 입력하세요"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={cn(inputClass, "resize-none")}
        />
      </Field>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" size="lg" className="w-full">
        {isEdit ? "수정 완료" : "정모 생성하기"}
      </Button>

      {showBackConfirm && (
        <ConfirmDialog
          message="작성 중인 내용이 사라집니다. 나가시겠습니까?"
          confirmLabel="나가기"
          onConfirm={onBack}
          onCancel={() => setShowBackConfirm(false)}
        />
      )}
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
