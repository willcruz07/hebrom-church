import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore"
import dayjs from './dayjs'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(
  date: Date | string | number | Timestamp | null | undefined,
  format = "DD/MM/YYYY"
) {
  if (!date) return '-'

  if (date instanceof Timestamp) {
    return dayjs(date.toDate()).format(format)
  }

  const d = dayjs(date)
  if (!d.isValid()) return '-'

  return d.format(format)
}

/**
 * Converte campos created_at/updated_at para Date de forma segura.
 * Documentos do Firestore criados antes da convenção de Timestamp podem
 * não ter o campo, ou tê-lo em outro formato — trata isso como época (data mínima)
 * em vez de estourar, já que TypeScript não garante o formato do dado já persistido.
 */
export function toJsDate(value: Timestamp | Date | string | number | null | undefined): Date {
  if (!value) return new Date(0)
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value

  const d = new Date(value)
  return isNaN(d.getTime()) ? new Date(0) : d
}

const AVATAR_COLORS = [
  'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  'bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
  'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  'bg-sky-100 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400',
  'bg-teal-100 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',
  'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
]

/**
 * Cor determinística (com base num seed, ex. nome/uid) para avatares de fallback.
 * Mesma pessoa sempre cai na mesma cor, mas cores variam entre pessoas diferentes.
 */
export function getAvatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function formatPhone(phone?: string) {
  if (!phone) return '-'
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  
  return phone
}

export function maskPhone(value: string) {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '').substring(0, 14)
  }
  return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '').substring(0, 15)
}

export function maskCPF(value: string) {
  const cleaned = value.replace(/\D/g, '')
  return cleaned
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .substring(0, 14)
}

export function maskCEP(value: string) {
  const cleaned = value.replace(/\D/g, '')
  return cleaned
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 9)
}
