import type { UserRole } from '@/types'

export type Option<T extends string = string> = { value: T; label: string }

export const GENDER_OPTIONS: Option<'M' | 'F' | 'O'>[] = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'O', label: 'Outro' },
]

export const MARITAL_STATUS_OPTIONS: Option<'single' | 'married' | 'divorced' | 'widowed' | 'separated'>[] = [
  { value: 'single', label: 'Solteiro(a)' },
  { value: 'married', label: 'Casado(a)' },
  { value: 'divorced', label: 'Divorciado(a)' },
  { value: 'widowed', label: 'Viúvo(a)' },
  { value: 'separated', label: 'Separado(a)' },
]

export const ROLE_OPTIONS: Option<UserRole>[] = [
  { value: 'member', label: 'Membro' },
  { value: 'secretary', label: 'Secretária' },
  { value: 'pastor', label: 'Pastor' },
  { value: 'visitor', label: 'Visitante' },
  { value: 'pending_member', label: 'Pendente' },
]

export const BLOOD_TYPE_OPTIONS: Option[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(
  (t) => ({ value: t, label: t }),
)
