import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { cn, formatPhone } from "@/lib/utils"
import { LEVEL_COLORS } from "@/lib/badminton"
import type { BadmintonLevel, Gender, Member } from "@/types"

const LEVELS: BadmintonLevel[] = ["S", "A", "B", "C", "D"]

interface AuthProps {
  members: Member[]
  onLogin: (member: Member) => void
  onSignup: (member: Omit<Member, "id" | "joinedAt" | "isAdmin">) => void
}

type Tab = "login" | "signup"

export function Auth({ members, onLogin, onSignup }: AuthProps) {
  const [tab, setTab] = useState<Tab>("login")

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl">🏸</div>
          <h1 className="text-2xl font-bold">빵벙</h1>
          <p className="mt-1 text-sm text-muted-foreground">배드민턴 정모 예약 관리</p>
        </div>

        <div className="mb-6 flex gap-1 rounded-xl bg-muted p-1">
          {(["login", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "login" ? "로그인" : "회원가입"}
            </button>
          ))}
        </div>

        {tab === "login" ? (
          <LoginForm members={members} onLogin={onLogin} onSwitchToSignup={() => setTab("signup")} />
        ) : (
          <SignupForm members={members} onSignup={onSignup} onSwitchToLogin={() => setTab("login")} />
        )}
      </div>
    </div>
  )
}

/* ── 로그인 ───────────────────────────────────────────── */
function LoginForm({
  members,
  onLogin,
  onSwitchToSignup,
}: {
  members: Member[]
  onLogin: (member: Member) => void
  onSwitchToSignup: () => void
}) {
  const [phone, setPhone]       = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const found = members.find((m) => m.phone === phone.trim())
    if (!found) {
      setError("등록되지 않은 전화번호입니다.")
      return
    }
    if (found.password !== password) {
      setError("비밀번호가 올바르지 않습니다.")
      return
    }
    onLogin(found)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="전화번호">
        <input
          type="tel"
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          className={inputClass}
          required
        />
      </Field>

      <Field label="비밀번호">
        <PasswordInput value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw((v) => !v)} placeholder="비밀번호 입력" />
      </Field>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Button type="submit" className="mt-2 w-full" size="lg">로그인</Button>

      <p className="text-center text-sm text-muted-foreground">
        아직 회원이 아니신가요?{" "}
        <button type="button" onClick={onSwitchToSignup} className="text-primary underline-offset-4 hover:underline">
          회원가입
        </button>
      </p>
    </form>
  )
}

/* ── 회원가입 ─────────────────────────────────────────── */
function SignupForm({
  members,
  onSignup,
  onSwitchToLogin,
}: {
  members: Member[]
  onSignup: (member: Omit<Member, "id" | "joinedAt" | "isAdmin">) => void
  onSwitchToLogin: () => void
}) {
  const [name, setName]           = useState("")
  const [birthdate, setBirthdate] = useState("")
  const [gender, setGender]       = useState<Gender | "">("")
  const [level, setLevel]         = useState<BadmintonLevel | "">("")
  const [phone, setPhone]         = useState("")
  const [password, setPassword]   = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [showPw, setShowPw]       = useState(false)
  const [showCPw, setShowCPw]     = useState(false)
  const [error, setError]         = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!name.trim())       { setError("이름을 입력해주세요."); return }
    if (!gender || !level) { setError("성별과 급수를 선택해주세요."); return }
    if (!birthdate)         { setError("생년월일을 입력해주세요."); return }
    if (password.length < 6) { setError("비밀번호는 6자 이상이어야 합니다."); return }
    if (password !== confirmPw) { setError("비밀번호가 일치하지 않습니다."); return }
    if (members.some((m) => m.phone === phone.trim())) {
      setError("이미 가입된 전화번호입니다. 로그인해주세요.")
      return
    }

    onSignup({ name: name.trim(), birthdate, gender, level, phone: phone.trim(), password })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="이름">
        <input type="text" placeholder="홍길동" value={name}
          onChange={(e) => setName(e.target.value)} className={inputClass} required />
      </Field>

      <Field label="생년월일">
        <input type="date" value={birthdate} max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setBirthdate(e.target.value)} className={inputClass} required />
      </Field>

      <Field label="성별">
        <div className="flex gap-2">
          {(["male", "female"] as Gender[]).map((g) => (
            <button key={g} type="button" onClick={() => setGender(g)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors",
                gender === g ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-foreground"
              )}
            >
              {g === "male" ? "남성" : "여성"}
            </button>
          ))}
        </div>
      </Field>

      <Field label="배드민턴 급수">
        <div className="flex gap-2">
          {LEVELS.map((l) => (
            <button key={l} type="button" onClick={() => setLevel(l)}
              className={cn(
                "flex flex-1 items-center justify-center rounded-xl border py-3 text-sm font-bold transition-colors",
                level === l ? cn("border-transparent", LEVEL_COLORS[l]) : "border-border text-muted-foreground hover:border-foreground/30"
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </Field>

      <Field label="전화번호">
        <input type="tel" placeholder="010-0000-0000" value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))} className={inputClass} required />
      </Field>

      <Field label="비밀번호">
        <PasswordInput value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw((v) => !v)} placeholder="6자 이상" />
      </Field>

      <Field label="비밀번호 확인">
        <PasswordInput value={confirmPw} onChange={setConfirmPw} show={showCPw} onToggle={() => setShowCPw((v) => !v)} placeholder="비밀번호 재입력"
          isError={confirmPw.length > 0 && confirmPw !== password}
        />
      </Field>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Button type="submit" className="mt-2 w-full" size="lg">가입하기</Button>

      <p className="text-center text-sm text-muted-foreground">
        이미 회원이신가요?{" "}
        <button type="button" onClick={onSwitchToLogin} className="text-primary underline-offset-4 hover:underline">
          로그인
        </button>
      </p>
    </form>
  )
}

/* ── 공통 컴포넌트 ─────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
