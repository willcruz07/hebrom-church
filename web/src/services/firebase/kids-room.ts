import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import { buildCheckIn, buildCheckOut, buildReentry } from '@/lib/kids/checkin'
import type { ChildFields } from '@/lib/kids/child'
import { newToken, parseQrPayload, TOKEN_BYTES } from '@/lib/kids/qr'
import type { EntryVia, PassRoom, Person, PickedBy, StaffMember } from '@/lib/kids/session'
import type { KidChild, KidPass, KidSession } from '@/types'

// Área Kids no culto. Status público (kids_sessions) e passagens restritas
// (attendance: equipe Kids, secretaria, pastor e os responsáveis). Regras no console — ver AGENTS.md.
const QR_COLLECTION = 'kids_qr'
const SESSIONS = 'kids_sessions'
const metaDoc = () => doc(db, 'kids_meta', 'current')
const sessionDoc = (id: string) => doc(db, SESSIONS, id)
const passesCollection = (sessionId: string) => collection(db, SESSIONS, sessionId, 'attendance')
const passDoc = (sessionId: string, childId: string) => doc(db, SESSIONS, sessionId, 'attendance', childId)

/** A sessão foi encerrada (por outra tia) antes da gravação. */
export class SessionClosed extends Error {
  constructor() {
    super('session-closed')
  }
}

/** A criança já está na sala (outra tia registrou antes). */
export class PassAlreadyIn extends Error {
  readonly childName: string
  readonly byName: string
  readonly atMs: number
  constructor(childName: string, byName: string, atMs: number) {
    super('pass-already-in')
    this.childName = childName
    this.byName = byName
    this.atMs = atMs
  }
}

// ── QR ────────────────────────────────────────────────────────────────

export async function regenerateQrToken(uid: string): Promise<string> {
  const token = newToken(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)))
  await setDoc(doc(db, QR_COLLECTION, uid), { token, updated_at: serverTimestamp() })
  return token
}

export async function getOrCreateQrToken(uid: string): Promise<string> {
  const token = (await getDoc(doc(db, QR_COLLECTION, uid))).data()?.token
  return typeof token === 'string' && token ? token : regenerateQrToken(uid)
}

export type QrResolution = { ok: true; uid: string } | { ok: false; reason: 'invalid' | 'replaced' }

export async function resolveQr(text: string): Promise<QrResolution> {
  const payload = parseQrPayload(text)
  if (!payload) return { ok: false, reason: 'invalid' }
  const saved = (await getDoc(doc(db, QR_COLLECTION, payload.uid))).data()?.token
  return saved === payload.token ? { ok: true, uid: payload.uid } : { ok: false, reason: 'replaced' }
}

// ── Sessão ────────────────────────────────────────────────────────────

const toSession = (id: string, data: DocumentData): KidSession => ({
  id,
  status: data.status === 'open' ? 'open' : 'closed',
  opened_at: data.opened_at,
  opened_by: data.opened_by,
  ...(data.closed_at ? { closed_at: data.closed_at } : {}),
  ...(data.closed_by ? { closed_by: data.closed_by } : {}),
  staff: Array.isArray(data.staff) ? data.staff : [],
  staff_uids: Array.isArray(data.staff_uids) ? data.staff_uids : [],
})

/** Sessão aberta (no máximo uma) — quem gerencia o ciclo de vida é o useKidsSession. */
export function subscribeToOpenSession(
  onData: (session: KidSession | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, SESSIONS), where('status', '==', 'open'), limit(1)),
    (snapshot) => {
      const found = snapshot.docs[0]
      onData(found ? toSession(found.id, found.data()) : null)
    },
    onError,
  )
}

/** Abre a Área Kids, ou entra servindo na que já estiver aberta. */
export function openSession(member: StaffMember): Promise<string> {
  return runTransaction(db, async (tx) => {
    const currentId = (await tx.get(metaDoc())).data()?.session_id
    if (typeof currentId === 'string' && currentId) {
      const current = await tx.get(sessionDoc(currentId))
      const data = current.data()
      if (data?.status === 'open') {
        const staff: StaffMember[] = Array.isArray(data.staff) ? data.staff : []
        if (!staff.some((s) => s.uid === member.uid)) {
          const next = [...staff, member]
          tx.update(current.ref, { staff: next, staff_uids: next.map((s) => s.uid) })
        }
        return currentId
      }
    }
    const ref = doc(collection(db, SESSIONS))
    tx.set(ref, {
      status: 'open',
      opened_at: Timestamp.now(),
      opened_by: { uid: member.uid, name: member.name },
      staff: [member],
      staff_uids: [member.uid],
    })
    tx.set(metaDoc(), { session_id: ref.id })
    return ref.id
  })
}

export async function setServing(sessionId: string, member: StaffMember, serving: boolean): Promise<void> {
  await runTransaction(db, async (tx) => {
    const snapshot = await tx.get(sessionDoc(sessionId))
    const data = snapshot.data()
    if (data?.status !== 'open') throw new SessionClosed()
    const others = (Array.isArray(data.staff) ? (data.staff as StaffMember[]) : []).filter((s) => s.uid !== member.uid)
    const next = serving ? [...others, member] : others
    tx.update(snapshot.ref, { staff: next, staff_uids: next.map((s) => s.uid) })
  })
}

/**
 * Encerra: quem encerra passa a constar como servindo (a regra exige), as crianças ainda
 * na sala viram "saída não registrada" e só então a sessão fecha.
 */
export async function closeSession(sessionId: string, member: StaffMember): Promise<void> {
  await setServing(sessionId, member, true)
  const remaining = await getDocs(query(passesCollection(sessionId), where('status', '==', 'in')))
  if (!remaining.empty) {
    const batch = writeBatch(db)
    remaining.docs.forEach((d) => batch.update(d.ref, { status: 'no_checkout' }))
    await batch.commit()
  }
  await runTransaction(db, async (tx) => {
    tx.update(sessionDoc(sessionId), {
      status: 'closed',
      closed_at: Timestamp.now(),
      closed_by: { uid: member.uid, name: member.name },
    })
    tx.set(metaDoc(), { session_id: null })
  })
}

// ── Passagens ─────────────────────────────────────────────────────────

const toPasses = (docs: { data: () => DocumentData }[]) => docs.map((d) => d.data() as KidPass)

export function subscribeToSessionPasses(
  sessionId: string,
  onData: (passes: KidPass[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(passesCollection(sessionId), (snapshot) => onData(toPasses(snapshot.docs)), onError)
}

/** Passagens dos filhos do usuário (o filtro também é exigido pela regra de leitura). */
export function subscribeToMyChildrenPasses(
  sessionId: string,
  uid: string,
  onData: (passes: KidPass[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(passesCollection(sessionId), where('guardian_uids', 'array-contains', uid)),
    (snapshot) => onData(toPasses(snapshot.docs)),
    onError,
  )
}

export async function checkIn(
  sessionId: string,
  entries: { child: KidChild; room: PassRoom }[],
  droppedBy: Person,
  staff: Person,
  via: EntryVia,
): Promise<void> {
  const now = Timestamp.now()
  await runTransaction(db, async (tx) => {
    if ((await tx.get(sessionDoc(sessionId))).data()?.status !== 'open') throw new SessionClosed()
    const refs = entries.map((e) => passDoc(sessionId, e.child.id))
    const existing = (await Promise.all(refs.map((ref) => tx.get(ref)))).map((s) => s.data() as KidPass | undefined)
    for (const pass of existing) {
      if (pass?.status === 'in') {
        throw new PassAlreadyIn(pass.child_name, pass.checked_in_by.name, pass.checked_in_at.toMillis())
      }
    }
    entries.forEach((entry, i) => {
      const input = { child: entry.child, room: entry.room, droppedBy, staff, via, now }
      const previous = existing[i]
      tx.set(refs[i], previous ? buildReentry(previous, input) : buildCheckIn(input))
    })
  })
}

export async function checkOut(
  sessionId: string,
  childIds: string[],
  pickedBy: PickedBy,
  staff: Person,
  via: EntryVia,
): Promise<void> {
  const now = Timestamp.now()
  await runTransaction(db, async (tx) => {
    if ((await tx.get(sessionDoc(sessionId))).data()?.status !== 'open') throw new SessionClosed()
    const refs = childIds.map((id) => passDoc(sessionId, id))
    const snapshots = await Promise.all(refs.map((ref) => tx.get(ref)))
    snapshots.forEach((snapshot, i) => {
      if (snapshot.data()?.status === 'in') tx.update(refs[i], { ...buildCheckOut({ pickedBy, staff, via, now }) })
    })
  })
}

export async function changeRoom(sessionId: string, childId: string, room: PassRoom): Promise<void> {
  await updateDoc(passDoc(sessionId, childId), { room })
}

/** Cadastro rápido feito pela equipe na entrada (sempre ligado a um adulto com conta). */
export async function createVisitorChild(fields: ChildFields, staffUid: string): Promise<string> {
  const ref = await addDoc(collection(db, 'kids_children'), {
    ...fields,
    is_visitor: true,
    created_by: staffUid,
    created_at: serverTimestamp(),
  })
  return ref.id
}
