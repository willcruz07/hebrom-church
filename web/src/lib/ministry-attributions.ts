// Lista e paleta de atribuições ministeriais — ver specs/ministerios-carteirinha.md
export const MINISTRY_ATTRIBUTIONS = [
  'Ministério de Dança',
  'Ministério Kids e Juniores',
  'Obreiro',
  'Evangelista (a)',
  'Presbítero (a)',
  'Mídia',
  'Diácono (a)',
  'Cantina',
  'Músico',
  'Ministério de Louvor',
  'Intercessão',
  'Missionário (a)',
  'Pastor (a)',
  'Líder Intercessão',
  'Líder Cantina',
  'Líder Músico',
  'Líder Mídia',
  'Líder Kids',
  'Líder Obreiro',
  'Líder Louvor',
] as const

export type MinistryAttribution = (typeof MINISTRY_ATTRIBUTIONS)[number]

interface MinistryAttributionTheme {
  bg: string
  text: string
  isLeader: boolean
}

// Cores pensadas para o fundo escuro fixo da carteirinha (id-card) — variante "dark" da tabela em specs/ministerios-carteirinha.md
export const MINISTRY_ATTRIBUTION_THEME: Record<MinistryAttribution, MinistryAttributionTheme> = {
  'Ministério de Dança': { bg: '#EC4899', text: '#FAFAFA', isLeader: false },
  'Ministério Kids e Juniores': { bg: '#FFDD85', text: '#2B2E4A', isLeader: false },
  Obreiro: { bg: '#D97706', text: '#FFF7ED', isLeader: false },
  'Evangelista (a)': { bg: '#22C55E', text: '#FAFAFA', isLeader: false },
  'Presbítero (a)': { bg: '#4C3A66', text: '#F5F0E6', isLeader: false },
  Mídia: { bg: '#0EA5E9', text: '#FAFAFA', isLeader: false },
  'Diácono (a)': { bg: '#EA580C', text: '#FFF7ED', isLeader: false },
  Cantina: { bg: '#F43F5E', text: '#FAFAFA', isLeader: false },
  Músico: { bg: '#A855F7', text: '#FAFAFA', isLeader: false },
  'Ministério de Louvor': { bg: '#8B5CF6', text: '#FAFAFA', isLeader: false },
  Intercessão: { bg: '#4F46E5', text: '#FAFAFA', isLeader: false },
  'Missionário (a)': { bg: '#14B8A6', text: '#FAFAFA', isLeader: false },
  'Pastor (a)': { bg: '#2A2A33', text: '#F5F0E6', isLeader: false },
  'Líder Intercessão': { bg: '#312C85', text: '#FAFAFA', isLeader: true },
  'Líder Cantina': { bg: '#BE123C', text: '#FAFAFA', isLeader: true },
  'Líder Músico': { bg: '#7E22CE', text: '#FAFAFA', isLeader: true },
  'Líder Mídia': { bg: '#0369A1', text: '#FAFAFA', isLeader: true },
  'Líder Kids': { bg: '#FFDD85', text: '#2B2E4A', isLeader: true },
  'Líder Obreiro': { bg: '#92400E', text: '#FFF7ED', isLeader: true },
  'Líder Louvor': { bg: '#6D28D9', text: '#FAFAFA', isLeader: true },
}

// Acento dourado compartilhado por todo "Líder X" (mesma regra da carteirinha)
export const MINISTRY_LEADER_ACCENT = '#E8C55A'

// ID determinístico de grupo (ChurchGroup) por atribuição — ver specs/mural-grupos.md
const DIACRITICS_RANGE = String.fromCharCode(0x0300, 0x002d, 0x036f) // "̀-ͯ" as literal range chars

export function slugifyAttribution(value: string): string {
  const diacriticsPattern = new RegExp(`[${DIACRITICS_RANGE}]`, 'g')
  return value
    .normalize('NFD')
    .replace(diacriticsPattern, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const FIXED_GROUP_SEEDS: { id: string; name: MinistryAttribution }[] =
  MINISTRY_ATTRIBUTIONS.map((name) => ({ id: slugifyAttribution(name), name }))

export function resolveAttributionGroupIds(
  principal?: MinistryAttribution,
  secundarias: MinistryAttribution[] = [],
): string[] {
  const all = [principal, ...secundarias].filter(
    (a): a is MinistryAttribution => Boolean(a),
  )
  return Array.from(new Set(all.map(slugifyAttribution)))
}
