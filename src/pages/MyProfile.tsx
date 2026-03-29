import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, formatPhone } from "@/lib/utils"
import { LEVEL_COLORS } from "@/lib/badminton"
import type { BadmintonLevel, Member } from "@/types"

const LEVELS: BadmintonLevel[] = ["S", "A", "B", "C", "D"]

interface MyProfileProps {
  currentUser: Member
  onUpdate: (updated: Pick<Member, "level" | "phone" | "password">) => void
  onLogout: () => void
}

export function MyProfile({ currentUser, onUpdate, onLogout }: MyProfileProps) {
  // 기본 정보
  const [level, setLevel] = useState<BadmintonLevel>(currentUser.level)
  const [phone, setPhone] = useState(currentUser.phone)
  const [infoSaved, setInfoSaved] = useState(false)
  const [infoError, setInfoError] = useState("")

  const isInfoDirty = level !== currentUser.level || phone !== currentUser.phone

  // 비밀번호 변경
  const [currentPw, setCurrentPw]   = useState("")
  const [newPw, setNewPw]           = useState("")
  const [confirmPw, setConfirmPw]   = useState("")
  const [showCur, setShowCur]       = useState(false)
  const [showNew, setShowNew]       = useState(false)
  const [showCon, setShowCon]       = useState(false)
  const [pwSaved, setPwSaved]       = useState(false)
  const [pwError, setPwError]       = useState("")

  function handleInfoSave() {
    setInfoError("")
    if (!phone.trim()) { setInfoError("전화번호를 입력해주세요."); return }
    onUpdate({ level, phone: phone.trim(), password: currentUser.password })
    setInfoSaved(true)
    setTimeout(() => setInfoSaved(false), 2000)
  }

  function handlePasswordSave() {
    setPwError("")
    if (currentPw !== currentUser.password) { setPwError("현재 비밀번호가 올바르지 않습니다."); return }
    if (newPw.length < 6)                   { setPwError("새 비밀번호는 6자 이상이어야 합니다."); return }
    if (newPw !== confirmPw)                { setPwError("새 비밀번호가 일치하지 않습니다."); return }
    onUpdate({ level, phone, password: newPw })
    setCurrentPw(""); setNewPw(""); setConfirmPw("")
    setPwSaved(true)
    setTimeout(() => setPwSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <h1 className="text-xl font-bold">내 정보</h1>

      {/* 읽기 전용 */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <Row label="이름"     value={currentUser.name} />
        <Row label="생년월일" value={currentUser.birthdate.replace(/-/g, ".")} />
        <Row label="성별"     value={currentUser.gender === "male" ? "👨 남성" : "👩 여성"} />
        {currentUser.isAdmin && <Row label="권한" value="관리자" highlight />}
      </div>

      {/* 급수 · 전화번호 수정 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-muted-foreground">기본 정보 수정</h2>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">배드민턴 급수</label>
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <button key={l} onClick={() => setLevel(l)}
                className={cn(
                  "flex flex-1 items-center justify-center rounded-xl border py-3 text-sm font-bold transition-colors",
                  level === l ? cn("border-transparent", LEVEL_COLORS[l]) : "border-border text-muted-foreground hover:border-foreground/30"
                )}
              >{l}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">전화번호</label>
          <input type="tel" value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            className={inputClass}
          />
        </div>

        {infoError && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{infoError}</p>}

        <Button className="w-full" size="lg" disabled={!isInfoDirty} onClick={handleInfoSave}>
          {infoSaved ? "저장 완료!" : "저장하기"}
        </Button>
      </section>

      {/* 비밀번호 변경 */}
      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-muted-foreground">비밀번호 변경</h2>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">현재 비밀번호</label>
          <PasswordInput value={currentPw} onChange={setCurrentPw} show={showCur} onToggle={() => setShowCur((v) => !v)} placeholder="현재 비밀번호" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">새 비밀번호</label>
          <PasswordInput value={newPw} onChange={setNewPw} show={showNew} onToggle={() => setShowNew((v) => !v)} placeholder="6자 이상" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">새 비밀번호 확인</label>
          <PasswordInput value={confirmPw} onChange={setConfirmPw} show={showCon} onToggle={() => setShowCon((v) => !v)} placeholder="새 비밀번호 재입력"
            isError={confirmPw.length > 0 && confirmPw !== newPw}
          />
        </div>

        {pwError && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{pwError}</p>}
        {pwSaved && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">비밀번호가 변경되었습니다.</p>}

        <Button variant="outline" className="w-full" disabled={!currentPw || !newPw || !confirmPw} onClick={handlePasswordSave}>
          비밀번호 변경
        </Button>
      </section>

      {/* 로그아웃 */}
      <div className="border-t border-border pt-4">
        <Button variant="destructive" className="w-full" onClick={onLogout}>로그아웃</Button>
      </div>
    </div>
  )
}

function PasswordInput({
  value, onChange, show, onToggle, placeholder, isError,
}: {
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  placeholder?: string
  isError?: boolean
}) {
  return (
    <div className={cn("flex items-center rounded-xl border bg-background transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20", isError ? "border-destructive" : "border-border")}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
      />
      <button type="button" onClick={onToggle} className="px-3 text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", highlight && "text-primary")}>{value}</span>
    </div>
  )
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
