import type { UserRole } from '@/types'

export type Option<T extends string = string> = { value: T; label: string }

export const GENDER_OPTIONS: Option<'M' | 'F' | 'O'>[] = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'O', label: 'Outro' },
]

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'separated'

/** Radical de cada estado civil — recebe "o", "a" ou "o(a)" conforme o gênero. */
const MARITAL_STATUS_STEMS: Record<MaritalStatus, string> = {
  single: 'Solteir',
  married: 'Casad',
  divorced: 'Divorciad',
  widowed: 'Viúv',
  separated: 'Separad',
}

/** Ex.: ('married', 'F') → "Casada"; sem gênero → "Casado(a)". */
export function formatMaritalStatus(status?: MaritalStatus, gender?: 'M' | 'F' | 'O') {
  if (!status) return '-'
  const suffix = gender === 'M' ? 'o' : gender === 'F' ? 'a' : 'o(a)'
  return MARITAL_STATUS_STEMS[status] + suffix
}

export const MARITAL_STATUS_OPTIONS: Option<MaritalStatus>[] = (
  Object.keys(MARITAL_STATUS_STEMS) as MaritalStatus[]
).map((value) => ({ value, label: formatMaritalStatus(value) }))

export const ROLE_OPTIONS: Option<UserRole>[] = [
  { value: 'member', label: 'Membro' },
  { value: 'secretary', label: 'Secretária' },
  { value: 'pastor', label: 'Pastor' },
  { value: 'visitor', label: 'Visitante' },
  { value: 'pending_member', label: 'Pendente' },
]

export function getRoleLabel(role?: UserRole) {
  return ROLE_OPTIONS.find((o) => o.value === role)?.label ?? 'Membro'
}

export const BLOOD_TYPE_OPTIONS: Option[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(
  (t) => ({ value: t, label: t }),
)
