import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { deleteObject } from 'firebase/storage'
import { db, storage, storageRef } from './config'
import { uploadFile } from './storage'
import { getUserById } from './users'
import { emailLookupCandidates, normalizeChild, type ChildFields } from '@/lib/kids/child'
import type { KidChild } from '@/types'

// Cadastro oficial das crianças da Hebrom. Privado: responsáveis editam; equipe Kids,
// secretaria e pastor só leem (regras no console — ver AGENTS.md).
const KIDS_COLLECTION = 'kids_children'
const kidsCollection = () => collection(db, KIDS_COLLECTION)
const childDoc = (id: string) => doc(db, KIDS_COLLECTION, id)
const photoPath = (id: string) => `kids/${id}.jpg`

export interface GuardianInfo {
  uid: string
  name: string
  avatar_url: string | null
  phone?: string
}

const toChildren = (docs: QueryDocumentSnapshot[]) =>
  docs.flatMap((d) => {
    const child = normalizeChild<Timestamp>(d.id, d.data())
    return child ? [child] : []
  })

const byAge = (a: KidChild, b: KidChild) => a.birth_date.localeCompare(b.birth_date)

/** Crianças em que o usuário é responsável (o filtro também é exigido pela regra de leitura). */
export async function getMyChildren(uid: string): Promise<KidChild[]> {
  const snapshot = await getDocs(query(kidsCollection(), where('guardian_uids', 'array-contains', uid)))
  return toChildren(snapshot.docs).sort(byAge)
}

/** Listener de todas as crianças (painel) — quem gerencia o ciclo de vida é o useKidsStore. */
export function subscribeToChildren(
  onData: (children: KidChild[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(kidsCollection(), (snapshot) => onData(toChildren(snapshot.docs)), onError)
}

export async function createChild(fields: ChildFields, uid: string): Promise<string> {
  const ref = await addDoc(kidsCollection(), {
    ...fields,
    is_visitor: false,
    created_by: uid,
    created_at: serverTimestamp(),
  })
  return ref.id
}

export async function updateChild(id: string, fields: ChildFields): Promise<void> {
  await updateDoc(childDoc(id), {
    ...fields,
    notes: fields.notes ?? deleteField(),
    updated_at: serverTimestamp(),
  })
}

export async function setChildPhoto(id: string, blob: Blob): Promise<string> {
  const url = await uploadFile(photoPath(id), blob)
  await updateDoc(childDoc(id), { photo_url: url })
  return url
}

export async function deleteChild(id: string): Promise<void> {
  await deleteDoc(childDoc(id))
  // A foto pode não existir; falhar aqui não impede a remoção do cadastro
  await deleteObject(storageRef(storage, photoPath(id))).catch(() => {})
}

export async function findUserByEmail(email: string): Promise<GuardianInfo | null> {
  const snapshot = await getDocs(
    query(collection(db, 'users'), where('email', 'in', emailLookupCandidates(email)), limit(1)),
  )
  const found = snapshot.docs[0]
  if (!found) return null
  const data = found.data()
  return {
    uid: found.id,
    name: data.profile?.full_name ?? data.email,
    avatar_url: data.profile?.avatar_url ?? null,
    ...(data.profile?.phone ? { phone: data.profile.phone } : {}),
  }
}

/**
 * Nome, foto e telefone dos responsáveis (no máximo 4 leituras).
 * `null` = conta não existe mais; `undefined` = falha de leitura (tentar de novo depois).
 */
export async function getGuardians(uids: string[]): Promise<Record<string, GuardianInfo | null | undefined>> {
  const entries = await Promise.all(
    uids.map(async (uid) => {
      let user: Awaited<ReturnType<typeof getUserById>>
      try {
        user = await getUserById(uid)
      } catch (error) {
        console.error(error)
        return [uid, undefined] as const
      }
      const info: GuardianInfo | null = user
        ? {
            uid,
            name: user.profile.full_name,
            avatar_url: user.profile.avatar_url,
            ...(user.profile.phone ? { phone: user.profile.phone } : {}),
          }
        : null
      return [uid, info] as const
    }),
  )
  return Object.fromEntries(entries)
}
