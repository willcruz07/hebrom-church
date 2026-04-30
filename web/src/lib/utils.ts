import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs from './dayjs'

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(
  date: Date | string | number | FirestoreTimestamp | null | undefined, 
  format = "DD/MM/YYYY"
) {
  if (!date) return '-'
  
  // Handle Firestore Timestamp
  if (date && typeof date === 'object' && 'seconds' in date) {
    return dayjs.unix((date as FirestoreTimestamp).seconds).format(format)
  }
  
  // Handle native Date, string or number
  const d = dayjs(date as Date | string | number)
  if (!d.isValid()) return '-'
  
  return d.format(format)
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
