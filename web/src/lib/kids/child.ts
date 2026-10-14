import { isValidDate } from './age.ts'
import { cleanHealth, type KidHealth } from './health.ts'
import type { ChildFormValues } from './validate.ts'

/** Campos editáveis prontos para o Firestore (aparados, sem chaves `undefined`). */
export interface ChildFields {
  name: string
  birth_date: string
  health: KidHealth
  photo_consent: boolean
  guardian_uids: string[]
  notes?: string
}

/** Criança como lida do Firestore; `T` é o tipo do Timestamp (permite testar sem Firebase). */
export interface KidChildOf<T> extends ChildFields {
  id: string
  photo_url?: string
  is_visitor: boolean
  created_by: string
  created_at: T
  updated_at?: T
}

export function toChildFields(form: ChildFormValues): ChildFields {
  const notes = form.notes.trim()
  return {
    name: form.name.trim(),
    birth_date: form.birth_date,
    health: cleanHealth(form.health),
    photo_consent: form.photo_consent,
    guardian_uids: [...new Set(form.guardian_uids)],
    ...(notes ? { notes } : {}),
  }
}

const nonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim() !== ''

/** Lê um documento de `kids_children`; devolve `null` se estiver corrompido. */
export function normalizeChild<T>(id: string, raw: unknown): KidChildOf<T> | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const guardians = Array.isArray(r.guardian_uids) ? r.guardian_uids.filter(nonEmptyString) : []
  if (!nonEmptyString(r.name) || typeof r.birth_date !== 'string' || !isValidDate(r.birth_date) || !guardians.length) {
    return null
  }

  return {
    id,
    name: r.name.trim(),
    birth_date: r.birth_date,
    guardian_uids: [...new Set(guardians)],
    health: cleanHealth(r.health),
    photo_consent: r.photo_consent === true,
    ...(nonEmptyString(r.notes) ? { notes: r.notes.trim() } : {}),
    ...(nonEmptyString(r.photo_url) ? { photo_url: r.photo_url } : {}),
    is_visitor: r.is_visitor === true,
    created_by: typeof r.created_by === 'string' ? r.created_by : '',
    created_at: r.created_at as T,
    ...(r.updated_at ? { updated_at: r.updated_at as T } : {}),
  }
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

/**
 * E-mails a procurar em `users`: em minúsculas (contas novas) e como digitado
 * (contas antigas criadas pela secretaria com maiúsculas).
 */
export const emailLookupCandidates = (email: string) => [...new Set([normalizeEmail(email), email.trim()])]
