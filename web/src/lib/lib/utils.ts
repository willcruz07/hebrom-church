import { clsx, type ClassValue } from 'clsx';
import dayjs from 'dayjs';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getUUID = () => {
  let dt = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = ((dt + Math.random() * 16) % 16) | 0;
    dt = Math.floor(dt / 16);
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
};

export const formatFirebaseDateToDate = (dateFirebase: any): Date => {
  if (!dateFirebase) return new Date();

  if (typeof dateFirebase?.seconds === 'number') return dayjs.unix(dateFirebase.seconds).toDate();

  if (dateFirebase instanceof Date) return dateFirebase;

  return new Date();
};
