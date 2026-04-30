import { useState } from "react"
import bbangbungLogo from "@/assets/bbangbung_logo.png"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { cn, formatPhone, formatBirthdate, birthdateToISO } from "@/lib/utils"
import { LEVEL_COLORS } from "@/lib/badminton"
import { getErrorMessage } from "@/lib/api"
import type { BadmintonLevel, Gender } from "@/types"

const LEVELS: BadmintonLevel[] = ["S", "A", "B", "C", "D"]

interface AuthProps {
  onLogin: (phone: string, password: string) => Promise<unknown>
  onSignup: (data: {
    name: string
    birthdate: string
    gender: string
    level: string
    phone: string
    password: string
  }) => Promise<unknown>
  onResetPassword: (data: {
    name: string
    phone: string
    birthdate: string
    newPassword: string
  }) => Promise<void>
}

type Tab = "login" | "signup"

export function Auth({ onLogin, onSignup, onResetPassword }: AuthProps) {
  const [tab, setTab] = useState<Tab>("login")
  const [showReset, setShowReset] = useState(false)

  if (showReset) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <img src={bbangbungLogo} alt="빵벙" className="mx-auto mb-3 h-16 w-auto" />
            <h1 className="text-2xl font-bold">비밀번호 찾기</h1>
            <p className="mt-1 text-sm text-muted-foreground">가입 시 등록한 정보로 본인을 확인해요</p>
          </div>
          <ResetPasswordForm
            onReset={onResetPassword}
            onBack={() => setShowReset(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src={bbangbungLogo} alt="빵벙" className="mx-auto mb-3 h-16 w-auto" />
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
          <LoginForm onLogin={onLogin} onSwitchToSignup={() => setTab("signup")} onForgotPassword={() => setShowReset(true)} />
        ) : (
          <SignupForm onSignup={onSignup} onSwitchToLogin={() => setTab("login")} />
        )}
      </div>
    </div>
  )
}

/* ── 로그인 ───────────────────────────────────────────── */
function LoginForm({
  onLogin,
  onSwitchToSignup,
  onForgotPassword,
}: {
  onLogin: (phone: string, password: string) => Promise<unknown>
  onSwitchToSignup: () => void
  onForgotPassword: () => void
}) {
  const [phone, setPhone]       = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await onLogin(phone.replace(/-/g, ""), password)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
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

      <Button type="submit" className="mt-2 w-full" size="lg" disabled={loading}>
        {loading ? "로그인 중..." : "로그인"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <button type="button" onClick={onForgotPassword} className="text-muted-foreground underline-offset-4 hover:underline">
          비밀번호를 잊으셨나요?
        </button>
      </p>

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
  onSignup,
  onSwitchToLogin,
}: {
  onSignup: (data: {
    name: string
    birthdate: string
    gender: string
    level: string
    phone: string
    password: string
  }) => Promise<unknown>
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
  const [loading, setLoading]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!name.trim())         { setError("이름을 입력해주세요."); return }
    if (!gender || !level)    { setError("성별과 급수를 선택해주세요."); return }
    if (!birthdate)           { setError("생년월일을 입력해주세요."); return }
    if (password.length < 6)  { setError("비밀번호는 6자 이상이어야 합니다."); return }
    if (password !== confirmPw) { setError("비밀번호가 일치하지 않습니다."); return }

    setLoading(true)
    try {
      await onSignup({
        name: name.trim(),
        birthdate: birthdateToISO(birthdate),
        gender,
        level,
        phone: phone.replace(/-/g, ""),
        password,
      })
    } catch (e) {
      console.error("[signup error]", e)
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="이름">
        <input type="text" placeholder="홍길동" value={name}
          onChange={(e) => setName(e.target.value)} className={inputClass} required />
      </Field>

      <Field label="생년월일">
        <input
          type="text"
          inputMode="numeric"
          placeholder="20010112"
          value={birthdate}
          onChange={(e) => setBirthdate(formatBirthdate(e.target.value))}
          className={inputClass}
          required
        />
      </Field>

      <Field label="성별">
        <div className="flex gap-2">
          {(["male", "female"] as Gender[]).map((g) => (
            <button key={g} type="button" onClick={() => setGender(g)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors",
                gender === g && g === "male"   ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/40 dark:text-blue-300" :
                gender === g && g === "female" ? "border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-500 dark:bg-pink-900/40 dark:text-pink-300" :
                "border-border text-muted-foreground hover:border-foreground"
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

      <Button type="submit" className="mt-2 w-full" size="lg" disabled={loading}>
        {loading ? "가입 중..." : "가입하기"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        이미 회원이신가요?{" "}
        <button type="button" onClick={onSwitchToLogin} className="text-primary underline-offset-4 hover:underline">
          로그인
        </button>
      </p>
    </form>
  )
}

/* ── 비밀번호 찾기 ─────────────────────────────────────── */
function ResetPasswordForm({
  onReset,
  onBack,
}: {
  onReset: (data: { name: string; phone: string; birthdate: string; newPassword: string }) => Promise<void>
  onBack: () => void
}) {
  const [name, setName]             = useState("")
  const [phone, setPhone]           = useState("")
  const [birthdate, setBirthdate]   = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPw, setConfirmPw]   = useState("")
  const [showPw, setShowPw]         = useState(false)
  const [showCPw, setShowCPw]       = useState(false)
  const [error, setError]           = useState("")
  const [loading, setLoading]       = useState(false)
  const [done, setDone]             = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (newPassword.length < 6) { setError("비밀번호는 6자 이상이어야 합니다."); return }
    if (newPassword !== confirmPw) { setError("비밀번호가 일치하지 않습니다."); return }
    setLoading(true)
    try {
      await onReset({
        name: name.trim(),
        phone: phone.replace(/-/g, ""),
        birthdate: birthdateToISO(birthdate),
        newPassword,
      })
      setDone(true)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold">비밀번호가 변경되었습니다</p>
          <p className="mt-1 text-sm text-muted-foreground">새 비밀번호로 로그인해 주세요.</p>
        </div>
        <Button className="w-full" size="lg" onClick={onBack}>로그인으로 돌아가기</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="이름">
        <input type="text" placeholder="홍길동" value={name}
          onChange={(e) => setName(e.target.value)} className={inputClass} required />
      </Field>

      <Field label="전화번호">
        <input type="tel" placeholder="010-0000-0000" value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))} className={inputClass} required />
      </Field>

      <Field label="생년월일">
        <input
          type="text"
          inputMode="numeric"
          placeholder="20010112"
          value={birthdate}
          onChange={(e) => setBirthdate(formatBirthdate(e.target.value))}
          className={inputClass}
          required
        />
      </Field>

      <Field label="새 비밀번호">
        <PasswordInput value={newPassword} onChange={setNewPassword} show={showPw} onToggle={() => setShowPw((v) => !v)} placeholder="6자 이상" />
      </Field>

      <Field label="새 비밀번호 확인">
        <PasswordInput value={confirmPw} onChange={setConfirmPw} show={showCPw} onToggle={() => setShowCPw((v) => !v)} placeholder="비밀번호 재입력"
          isError={confirmPw.length > 0 && confirmPw !== newPassword}
        />
      </Field>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Button type="submit" className="mt-2 w-full" size="lg" disabled={loading}>
        {loading ? "확인 중..." : "비밀번호 재설정"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <button type="button" onClick={onBack} className="text-muted-foreground underline-offset-4 hover:underline">
          로그인으로 돌아가기
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
