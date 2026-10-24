import { suggestRoom } from './rooms.ts'
import type { EntryVia, KidPassOf, PassRoom, PassStatus, Person, PickedBy, PreviousPassOf } from './session.ts'

/** O que a entrada precisa de uma criança (KidChild satisfaz). */
export interface ChildLike {
  id: string
  name: string
  birth_date: string
  guardian_uids: string[]
  is_visitor: boolean
  photo_url?: string
}

export const roomFor = (birthDate: string, today: string): PassRoom => suggestRoom(birthDate, today)?.id ?? 'outside'

/** Crianças de um responsável, da mais velha à mais nova. */
export const childrenOf = <C extends ChildLike>(children: C[], adultUid: string) =>
  children.filter((c) => c.guardian_uids.includes(adultUid)).sort((a, b) => a.birth_date.localeCompare(b.birth_date))

export interface CheckInCandidate<C> {
  child: C
  suggestedRoom: PassRoom
  alreadyIn: boolean
}

export function checkInCandidates<C extends ChildLike>(
  children: C[],
  passes: { child_id: string; status: PassStatus }[],
  today: string,
): CheckInCandidate<C>[] {
  const inRoom = new Set(passes.filter((p) => p.status === 'in').map((p) => p.child_id))
  return [...children]
    .sort((a, b) => a.birth_date.localeCompare(b.birth_date))
    .map((child) => ({ child, suggestedRoom: roomFor(child.birth_date, today), alreadyIn: inRoom.has(child.id) }))
}

/**
 * Quem pode constar como "deixado por": responsáveis das crianças, com o adulto escaneado primeiro.
 * Só entra quem já tem o nome carregado, para nunca gravar um nome provisório na passagem.
 */
export function droppedByOptions(
  children: ChildLike[],
  names: Record<string, string | undefined>,
  firstUid?: string | null,
): Person[] {
  const uids = [...new Set([...(firstUid ? [firstUid] : []), ...children.flatMap((c) => c.guardian_uids)])]
  return uids.flatMap((uid) => {
    const name = names[uid]
    return name ? [{ uid, name }] : []
  })
}

export interface CheckInInput<T> {
  child: ChildLike
  room: PassRoom
  droppedBy: Person
  staff: Person
  via: EntryVia
  now: T
}

export function buildCheckIn<T>(input: CheckInInput<T>): KidPassOf<T> {
  const { child, room, droppedBy, staff, via, now } = input
  return {
    child_id: child.id,
    child_name: child.name,
    ...(child.photo_url ? { child_photo_url: child.photo_url } : {}),
    birth_date: child.birth_date,
    room,
    guardian_uids: [...child.guardian_uids],
    is_visitor: child.is_visitor,
    status: 'in',
    dropped_by: { uid: droppedBy.uid, name: droppedBy.name },
    checked_in_at: now,
    checked_in_by: { uid: staff.uid, name: staff.name },
    checkin_via: via,
  }
}

/** Saiu e voltou no mesmo culto: a ida anterior vai para `previous_passes`. */
export function buildReentry<T>(existing: KidPassOf<T>, input: CheckInInput<T>): KidPassOf<T> {
  const previous: PreviousPassOf<T> = {
    room: existing.room,
    dropped_by: existing.dropped_by,
    checked_in_at: existing.checked_in_at,
    checked_out_at: existing.checked_out_at ?? null,
    picked_by: existing.picked_by ?? null,
  }
  return { ...buildCheckIn(input), previous_passes: [...(existing.previous_passes ?? []), previous] }
}

export interface CheckOutFields<T> {
  status: 'out'
  checked_out_at: T
  checked_out_by: Person
  checkout_via: EntryVia
  picked_by: PickedBy
}

export function buildCheckOut<T>(input: { pickedBy: PickedBy; staff: Person; via: EntryVia; now: T }): CheckOutFields<T> {
  const name = input.pickedBy.name.trim()
  return {
    status: 'out',
    checked_out_at: input.now,
    checked_out_by: { uid: input.staff.uid, name: input.staff.name },
    checkout_via: input.via,
    picked_by: input.pickedBy.uid ? { uid: input.pickedBy.uid, name } : { name },
  }
}

/** Crianças marcadas que ainda podem entrar (outra tia pode ter registrado alguma no meio-tempo). */
export function selectableEntries<C extends ChildLike>(
  selected: Record<string, PassRoom>,
  candidates: CheckInCandidate<C>[],
): { child: C; room: PassRoom }[] {
  return candidates.filter((c) => c.child.id in selected && !c.alreadyIn).map((c) => ({ child: c.child, room: selected[c.child.id] }))
}

export interface StatusRow<P> {
  id: string
  name: string
  photo_url?: string
  pass: P | null
}

/**
 * Linhas de "Meus filhos": os cadastrados e também crianças que só aparecem nas passagens
 * (ex.: cadastro rápido feito pela equipe depois que a lista do pai foi carregada).
 */
export function statusRows<P extends { child_id: string; child_name: string; child_photo_url?: string }>(
  children: { id: string; name: string; photo_url?: string }[],
  passes: P[],
): StatusRow<P>[] {
  const byChild = new Map(passes.map((p) => [p.child_id, p]))
  const known = new Set(children.map((c) => c.id))
  const rows: StatusRow<P>[] = children.map((c) => ({
    id: c.id,
    name: c.name,
    ...(c.photo_url ? { photo_url: c.photo_url } : {}),
    pass: byChild.get(c.id) ?? null,
  }))
  for (const pass of passes) {
    if (known.has(pass.child_id)) continue
    rows.push({
      id: pass.child_id,
      name: pass.child_name,
      ...(pass.child_photo_url ? { photo_url: pass.child_photo_url } : {}),
      pass,
    })
  }
  return rows
}
