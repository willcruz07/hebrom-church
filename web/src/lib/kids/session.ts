import { OUTSIDE_ROOMS_LABEL, ROOMS, type RoomId } from './rooms.ts'

/** O que as regras precisam de um Timestamp do Firestore (permite testar sem Firebase). */
export interface TimestampLike {
  toMillis(): number
}

export type PassRoom = RoomId | 'outside'
export type PassStatus = 'in' | 'out' | 'no_checkout'
export type EntryVia = 'qr' | 'manual'

export interface Person {
  uid: string
  name: string
}

/** `uid` ausente = "Outra pessoa" (nome digitado pela tia). */
export interface PickedBy {
  uid?: string
  name: string
}

export interface StaffMember {
  uid: string
  name: string
  avatar_url: string | null
}

export interface PreviousPassOf<T> {
  room: PassRoom
  dropped_by: Person
  checked_in_at: T
  checked_out_at: T | null
  picked_by: PickedBy | null
}

/** `kids_sessions/{id}/attendance/{childId}` — uma passagem ativa por criança por sessão. */
export interface KidPassOf<T> {
  child_id: string
  child_name: string
  child_photo_url?: string
  birth_date: string
  room: PassRoom
  guardian_uids: string[]
  is_visitor: boolean
  status: PassStatus
  dropped_by: Person
  checked_in_at: T
  checked_in_by: Person
  checkin_via: EntryVia
  checked_out_at?: T
  checked_out_by?: Person
  checkout_via?: EntryVia
  picked_by?: PickedBy
  previous_passes?: PreviousPassOf<T>[]
}

/** `kids_sessions/{id}` — status público da Área Kids. */
export interface KidSessionOf<T> {
  id: string
  status: 'open' | 'closed'
  opened_at: T
  opened_by: Person
  closed_at?: T
  closed_by?: Person
  staff: StaffMember[]
  staff_uids: string[]
}

/** Aberta há mais que isso, a sessão aparece como fechada para os membros. */
export const SESSION_STALE_MS = 12 * 60 * 60 * 1000

export const ROOM_LABELS = {
  ...Object.fromEntries(ROOMS.map((room) => [room.id, room.label])),
  outside: OUTSIDE_ROOMS_LABEL,
} as Record<PassRoom, string>

export const isSessionStale = (openedAtMs: number, nowMs: number) => nowMs - openedAtMs > SESSION_STALE_MS

export function roomCounts(passes: { status: PassStatus; room: PassRoom }[]): Record<PassRoom, number> {
  const counts: Record<PassRoom, number> = { bercario: 0, kids: 0, juniores: 0, outside: 0 }
  for (const pass of passes) if (pass.status === 'in') counts[pass.room] += 1
  return counts
}

/** Texto de status da criança para quem está vendo (pai ou equipe). */
export function passLabel(
  pass: KidPassOf<TimestampLike> | null,
  viewerUid: string,
  formatTime: (ms: number) => string,
): string {
  if (!pass) return 'Fora da sala'
  const who = (person: { uid?: string; name: string }) => (person.uid && person.uid === viewerUid ? 'você' : person.name)
  if (pass.status === 'in') {
    return `Na sala ${ROOM_LABELS[pass.room]} desde ${formatTime(pass.checked_in_at.toMillis())} · deixado por ${who(pass.dropped_by)}`
  }
  if (pass.status === 'out') {
    const at = pass.checked_out_at ? ` às ${formatTime(pass.checked_out_at.toMillis())}` : ''
    return pass.picked_by ? `Retirado${at} por ${who(pass.picked_by)}` : `Retirado${at}`
  }
  return 'Saída não registrada'
}

/** Passagens que viram "saída não registrada" ao encerrar. */
export const passesToClose = <P extends { status: PassStatus }>(passes: P[]) => passes.filter((p) => p.status === 'in')
