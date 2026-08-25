import { EventCategory } from '@/types'

export const CATEGORIES: { name: EventCategory; color: string; dot: string }[] = [
  { name: 'Culto', color: 'bg-amber-500', dot: 'bg-amber-500' },
  { name: 'Homens', color: 'bg-blue-600', dot: 'bg-blue-600' },
  { name: 'Mulheres', color: 'bg-rose-500', dot: 'bg-rose-500' },
  { name: 'Jovens', color: 'bg-purple-600', dot: 'bg-purple-600' },
  { name: 'Imersão', color: 'bg-emerald-600', dot: 'bg-emerald-600' },
  { name: 'Batismo', color: 'bg-sky-500', dot: 'bg-sky-500' },
  { name: 'Outro', color: 'bg-slate-500', dot: 'bg-slate-500' },
]

export function getCategory(name: EventCategory) {
  return CATEGORIES.find((c) => c.name === name) || CATEGORIES[CATEGORIES.length - 1]
}
