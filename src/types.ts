export type BadmintonLevel = "S" | "A" | "B" | "C" | "D"
export type Gender = "male" | "female"
export type SessionStatus = "open" | "closed" | "completed" | "cancelled"
export type ReservationStatus = "confirmed" | "pending" | "waitlisted" | "cancelled"
export type Page = "home" | "sessions" | "session-detail" | "my-reservations" | "profile" | "admin"

export interface Member {
  id: string
  name: string
  birthdate: string
  gender: Gender
  level: BadmintonLevel
  phone: string
  password: string
  joinedAt: string
  isAdmin: boolean
}

export interface SessionParticipant {
  memberId: string
  memberName: string
  gender: Gender
  level: BadmintonLevel
  reservedAt: string
  status: ReservationStatus
}

export interface BbangSession {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  location: string
  address: string
  courtCount: number
  maxParticipants: number
  currentParticipants: number
  status: SessionStatus
  levelRestriction: BadmintonLevel[] | null
  fee: number
  description: string
  organizer: string
  participants: SessionParticipant[]
}

export interface Reservation {
  id: string
  sessionId: string
  sessionTitle: string
  date: string
  startTime: string
  endTime: string
  location: string
  fee: number
  status: ReservationStatus
  createdAt: string
}
