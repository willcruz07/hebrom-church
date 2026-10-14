import { ageOf, isValidDate } from './age.ts'
import { HEALTH_ITEMS, MAX_HEALTH_DETAIL, type KidHealth, type KidHealthItemId } from './health.ts'

export const MAX_CHILD_NAME = 80
export const MAX_CHILD_NOTES = 1000
export const MAX_GUARDIANS = 4
/** A partir desta idade não é mais criança para a Área Kids. */
export const MAX_CHILD_AGE = 18

export interface ChildFormValues {
  name: string
  birth_date: string
  /** Itens com "qual?" marcados guardam texto (vazio enquanto o pai não digita). */
  health: KidHealth
  notes: string
  photo_consent: boolean
  guardian_uids: string[]
}

export interface ChildFormErrors {
  name?: string
  birth_date?: string
  notes?: string
  guardians?: string
  health?: Partial<Record<KidHealthItemId, string>>
}

/** `requiredGuardian`: ao criar, quem cadastra precisa estar entre os responsáveis (regra do Firestore). */
export function validateChild(
  form: ChildFormValues,
  today: string,
  options: { requiredGuardian?: string } = {},
): ChildFormErrors {
  const errors: ChildFormErrors = {}

  const name = form.name.trim()
  if (!name) errors.name = 'Informe o nome.'
  else if (name.length > MAX_CHILD_NAME) errors.name = `Máximo de ${MAX_CHILD_NAME} caracteres.`

  if (
    !isValidDate(form.birth_date) ||
    form.birth_date > today ||
    ageOf(form.birth_date, today).years >= MAX_CHILD_AGE
  ) {
    errors.birth_date = 'Data de nascimento inválida.'
  }

  if (form.notes.trim().length > MAX_CHILD_NOTES) errors.notes = `Máximo de ${MAX_CHILD_NOTES} caracteres.`

  const guardians = new Set(form.guardian_uids).size
  if (guardians < 1) errors.guardians = 'Informe pelo menos um responsável.'
  else if (guardians > MAX_GUARDIANS) errors.guardians = `Máximo de ${MAX_GUARDIANS} responsáveis.`
  else if (options.requiredGuardian && !form.guardian_uids.includes(options.requiredGuardian)) {
    errors.guardians = 'Você precisa ser um dos responsáveis.'
  }

  const health: Partial<Record<KidHealthItemId, string>> = {}
  for (const item of HEALTH_ITEMS) {
    const value = form.health[item.id]
    if (!item.detail || value === undefined) continue
    const text = typeof value === 'string' ? value.trim() : ''
    if (!text) health[item.id] = 'Informe qual.'
    else if (text.length > MAX_HEALTH_DETAIL) health[item.id] = `Máximo de ${MAX_HEALTH_DETAIL} caracteres.`
  }
  if (Object.keys(health).length) errors.health = health

  return errors
}

export const hasErrors = (errors: ChildFormErrors) => Object.keys(errors).length > 0
