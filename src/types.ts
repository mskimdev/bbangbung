export type BadmintonLevel = "S" | "A" | "B" | "C" | "D"
export type Gender = "male" | "female"
export type SessionStatus = "open" | "closed" | "in_progress" | "completed" | "cancelled"
export type ReservationStatus = "confirmed" | "pending" | "waitlisted" | "cancelled"
export type Page = "home" | "sessions" | "session-detail" | "session-match" | "session-play" | "my-reservations" | "profile" | "admin"

export interface Member {
  id: string
  name: string
  birthdate: string
  gender: Gender
  level: BadmintonLevel
  phone: string
  joinedAt: string
  isAdmin: boolean
  freeTickets: number
  totalAttendance: number
  monthlyAttendance: number
}

export interface SessionParticipant {
  memberId: string
  memberName: string
  gender: Gender
  level: BadmintonLevel
  reservedAt: string
  status: ReservationStatus
  usedFreeTicket: boolean
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

export interface CourtSlotApi {
  courtNumber: number
  status: "idle" | "playing" | "pending"
  slots: (string | null)[]  // 4 elements — member IDs, null for empty
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
  usedFreeTicket: boolean
  createdAt: string
}
