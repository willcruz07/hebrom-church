import { suggestRoom, type RoomId } from './rooms.ts'

export type RoomCounts = Record<RoomId, number> & { outside: number; total: number }

export function countByRoom(children: { birth_date: string }[], today: string): RoomCounts {
  const counts: RoomCounts = { bercario: 0, kids: 0, juniores: 0, outside: 0, total: children.length }
  for (const child of children) {
    const room = suggestRoom(child.birth_date, today)
    if (room) counts[room.id] += 1
    else counts.outside += 1
  }
  return counts
}

const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Busca sem acento/maiúsculas em qualquer um dos textos (nome da criança, responsáveis). */
export function matchesKidSearch(term: string, texts: string[]): boolean {
  const needle = fold(term.trim())
  return !needle || texts.some((text) => fold(text).includes(needle))
}
