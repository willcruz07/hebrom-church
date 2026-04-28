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
  format = "DD [de] MMM, YYYY"
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
