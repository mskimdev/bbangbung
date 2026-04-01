import { useReducer } from "react"
import { Sun, Moon, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Toast } from "@/components/ui/toast"
import { cn, formatPhone } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { useTheme } from "@/components/theme-provider"
import { LEVEL_COLORS } from "@/lib/badminton"
import type { BadmintonLevel, Member } from "@/types"

const LEVELS: BadmintonLevel[] = ["S", "A", "B", "C", "D"]

interface MyProfileProps {
  currentUser: Member
  onUpdate: (updated: Pick<Member, "level" | "phone" | "password">) => void
  onLogout: () => void
}

interface ProfileState {
  level: BadmintonLevel
  phone: string
  infoError: string
  currentPw: string
  newPw: string
  confirmPw: string
  showCur: boolean
  showNew: boolean
  showCon: boolean
  pwError: string
}

type ProfileAction =
  | { type: "SET_LEVEL"; level: BadmintonLevel }
  | { type: "SET_PHONE"; phone: string }
  | { type: "SET_INFO_ERROR"; error: string }
  | { type: "SET_CURRENT_PW"; value: string }
  | { type: "SET_NEW_PW"; value: string }
  | { type: "SET_CONFIRM_PW"; value: string }
  | { type: "TOGGLE_SHOW_CUR" }
  | { type: "TOGGLE_SHOW_NEW" }
  | { type: "TOGGLE_SHOW_CON" }
  | { type: "SET_PW_ERROR"; error: string }
  | { type: "RESET_PW_FIELDS" }

function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case "SET_LEVEL":       return { ...state, level: action.level }
    case "SET_PHONE":       return { ...state, phone: action.phone }
    case "SET_INFO_ERROR":  return { ...state, infoError: action.error }
    case "SET_CURRENT_PW":  return { ...state, currentPw: action.value }
    case "SET_NEW_PW":      return { ...state, newPw: action.value }
    case "SET_CONFIRM_PW":  return { ...state, confirmPw: action.value }
    case "TOGGLE_SHOW_CUR": return { ...state, showCur: !state.showCur }
    case "TOGGLE_SHOW_NEW": return { ...state, showNew: !state.showNew }
    case "TOGGLE_SHOW_CON": return { ...state, showCon: !state.showCon }
    case "SET_PW_ERROR":    return { ...state, pwError: action.error }
    case "RESET_PW_FIELDS": return { ...state, currentPw: "", newPw: "", confirmPw: "", pwError: "" }
  }
}

export function MyProfile({ currentUser, onUpdate, onLogout }: MyProfileProps) {
  const { theme, setTheme } = useTheme()
  const { toast, showToast, hideToast } = useToast()
  const [state, dispatch] = useReducer(profileReducer, {
    level: currentUser.level,
    phone: currentUser.phone,
    infoError: "",
    currentPw: "",
    newPw: "",
    confirmPw: "",
    showCur: false,
    showNew: false,
    showCon: false,
    pwError: "",
  })

  const { level, phone, infoError, currentPw, newPw, confirmPw, showCur, showNew, showCon, pwError } = state
  const isInfoDirty = level !== currentUser.level || phone !== currentUser.phone

  function handleInfoSave() {
    dispatch({ type: "SET_INFO_ERROR", error: "" })
    if (!phone.trim()) { dispatch({ type: "SET_INFO_ERROR", error: "전화번호를 입력해주세요." }); return }
    onUpdate({ level, phone: phone.trim(), password: currentUser.password })
    showToast("저장되었습니다")
  }

  function handlePasswordSave() {
    dispatch({ type: "SET_PW_ERROR", error: "" })
    if (currentPw !== currentUser.password) { dispatch({ type: "SET_PW_ERROR", error: "현재 비밀번호가 올바르지 않습니다." }); return }
    if (newPw.length < 6)                   { dispatch({ type: "SET_PW_ERROR", error: "새 비밀번호는 6자 이상이어야 합니다." }); return }
    if (newPw !== confirmPw)                { dispatch({ type: "SET_PW_ERROR", error: "새 비밀번호가 일치하지 않습니다." }); return }
    onUpdate({ level, phone, password: newPw })
    dispatch({ type: "RESET_PW_FIELDS" })
    showToast("비밀번호가 변경되었습니다")
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <h1 className="text-xl font-bold">내 정보</h1>

      {/* 읽기 전용 */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <Row label="이름"     value={currentUser.name} />
        <Row label="생년월일" value={currentUser.birthdate.replace(/-/g, ".")} />
        <Row label="성별"     value={currentUser.gender === "male" ? "남성" : "여성"} />
        {currentUser.isAdmin && <Row label="권한" value="관리자" highlight />}
      </div>

      {/* 급수 · 전화번호 수정 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-muted-foreground">기본 정보 수정</h2>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">배드민턴 급수</label>
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <button key={l} onClick={() => dispatch({ type: "SET_LEVEL", level: l })}
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
            onChange={(e) => dispatch({ type: "SET_PHONE", phone: formatPhone(e.target.value) })}
            className={inputClass}
          />
        </div>

        {infoError && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{infoError}</p>}

        <Button className="w-full" size="lg" disabled={!isInfoDirty} onClick={handleInfoSave}>
          저장하기
        </Button>
      </section>

      {/* 비밀번호 변경 */}
      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-muted-foreground">비밀번호 변경</h2>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">현재 비밀번호</label>
          <PasswordInput value={currentPw} onChange={(v) => dispatch({ type: "SET_CURRENT_PW", value: v })} show={showCur} onToggle={() => dispatch({ type: "TOGGLE_SHOW_CUR" })} placeholder="현재 비밀번호" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">새 비밀번호</label>
          <PasswordInput value={newPw} onChange={(v) => dispatch({ type: "SET_NEW_PW", value: v })} show={showNew} onToggle={() => dispatch({ type: "TOGGLE_SHOW_NEW" })} placeholder="6자 이상" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">새 비밀번호 확인</label>
          <PasswordInput value={confirmPw} onChange={(v) => dispatch({ type: "SET_CONFIRM_PW", value: v })} show={showCon} onToggle={() => dispatch({ type: "TOGGLE_SHOW_CON" })} placeholder="새 비밀번호 재입력"
            isError={confirmPw.length > 0 && confirmPw !== newPw}
          />
        </div>

        {pwError && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{pwError}</p>}

        <Button variant="outline" className="w-full" disabled={!currentPw || !newPw || !confirmPw} onClick={handlePasswordSave}>
          비밀번호 변경
        </Button>
      </section>

      {/* 화면 모드 */}
      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-muted-foreground">화면 모드</h2>
        <div className="flex gap-2">
          {([
            { value: "light",  label: "라이트", icon: Sun },
            { value: "dark",   label: "다크",   icon: Moon },
            { value: "system", label: "시스템", icon: Monitor },
          ] as const).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                "flex flex-1 flex-col items-center gap-2 rounded-xl border py-3 text-xs font-medium transition-colors",
                theme === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-foreground/30"
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* 로그아웃 */}
      <div className="border-t border-border pt-4">
        <Button variant="destructive" className="w-full" onClick={onLogout}>로그아웃</Button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
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
