const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** `YYYY-MM-DD` que existe no calendário. */
export function isValidDate(value: string): boolean {
  const match = DATE_RE.exec(value)
  if (!match) return false
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

export interface Age {
  years: number
  months: number
}

/** Idade completa. Quem nasceu em 29/02 completa ano em 01/03 nos anos não bissextos. */
export function ageOf(birthDate: string, today: string): Age {
  const [by, bm, bd] = birthDate.split('-').map(Number)
  const [ty, tm, td] = today.split('-').map(Number)
  let months = (ty - by) * 12 + (tm - bm)
  if (td < bd) months -= 1
  months = Math.max(0, months)
  return { years: Math.floor(months / 12), months: months % 12 }
}

/** "Recém-nascido", "1 mês", "8 meses", "1 ano", "4 anos". */
export function formatAge(birthDate: string, today: string): string {
  const { years, months } = ageOf(birthDate, today)
  if (years >= 1) return years === 1 ? '1 ano' : `${years} anos`
  if (months >= 1) return months === 1 ? '1 mês' : `${months} meses`
  return 'Recém-nascido'
}
