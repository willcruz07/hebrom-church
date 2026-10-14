import { ageOf } from './age.ts'

export type RoomId = 'bercario' | 'kids' | 'juniores'

export interface Room {
  id: RoomId
  label: string
  minYears: number
  maxYears: number
}

/** Salas da Área Kids por idade (anos completos). */
export const ROOMS: readonly Room[] = [
  { id: 'bercario', label: 'Berçário', minYears: 0, maxYears: 2 },
  { id: 'kids', label: 'Kids', minYears: 3, maxYears: 7 },
  { id: 'juniores', label: 'Juniores', minYears: 8, maxYears: 12 },
]

export const OUTSIDE_ROOMS_LABEL = 'Fora das faixas'

export function suggestRoom(birthDate: string, today: string): Room | null {
  const { years } = ageOf(birthDate, today)
  return ROOMS.find((room) => years >= room.minYears && years <= room.maxYears) ?? null
}

export const roomLabelOf = (birthDate: string, today: string) =>
  suggestRoom(birthDate, today)?.label ?? OUTSIDE_ROOMS_LABEL
