/** Minúsculas e sem acento — base da busca e do parser de referência. */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Posição [início, fim) do termo no texto original, ignorando acento/maiúscula. */
export function findMatch(text: string, query: string): [number, number] | null {
  const q = normalize(query.trim())
  if (!q) return null

  let normalized = ''
  const origin: number[] = []
  for (let i = 0; i < text.length; i++) {
    const n = normalize(text[i])
    for (let k = 0; k < n.length; k++) origin.push(i)
    normalized += n
  }

  const at = normalized.indexOf(q)
  if (at < 0) return null
  return [origin[at], origin[at + q.length - 1] + 1]
}
