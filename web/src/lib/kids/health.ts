export type HealthGroupId = 'food' | 'health' | 'care'

export const HEALTH_GROUPS: readonly { id: HealthGroupId; label: string }[] = [
  { id: 'food', label: 'Alimentação' },
  { id: 'health', label: 'Saúde' },
  { id: 'care', label: 'Cuidados' },
]

interface HealthItem {
  id: string
  label: string
  group: HealthGroupId
  /** Aparece em destaque (vermelho) para a equipe Kids. */
  alert: boolean
  /** Pede o campo "qual?". */
  detail: boolean
}

/** Anamnese da criança. Marcar um item sempre indica restrição/condição. */
export const HEALTH_ITEMS = [
  { id: 'food_allergy', label: 'Alergia alimentar', group: 'food', alert: true, detail: true },
  { id: 'lactose', label: 'Intolerância à lactose', group: 'food', alert: false, detail: false },
  { id: 'gluten', label: 'Intolerância ao glúten', group: 'food', alert: false, detail: false },
  { id: 'no_sugar', label: 'Não pode açúcar', group: 'food', alert: false, detail: false },
  { id: 'vegetarian', label: 'Vegetariana', group: 'food', alert: false, detail: false },
  { id: 'no_church_snack', label: 'Não pode comer o lanche da igreja', group: 'food', alert: false, detail: false },
  { id: 'asthma', label: 'Asma/bronquite', group: 'health', alert: true, detail: false },
  { id: 'epilepsy', label: 'Epilepsia/convulsão', group: 'health', alert: true, detail: false },
  { id: 'diabetes', label: 'Diabetes', group: 'health', alert: true, detail: false },
  { id: 'drug_allergy', label: 'Alergia a medicamento', group: 'health', alert: true, detail: true },
  { id: 'continuous_medication', label: 'Medicação contínua', group: 'health', alert: false, detail: true },
  { id: 'insect_allergy', label: 'Alergia a picada de inseto', group: 'health', alert: false, detail: false },
  { id: 'autism', label: 'TEA (autismo)', group: 'care', alert: false, detail: false },
  { id: 'adhd', label: 'TDAH', group: 'care', alert: false, detail: false },
  { id: 'special_needs', label: 'Necessidade especial/mobilidade', group: 'care', alert: false, detail: false },
  { id: 'diapers', label: 'Usa fralda', group: 'care', alert: false, detail: false },
  { id: 'bathroom_help', label: 'Precisa de ajuda no banheiro', group: 'care', alert: false, detail: false },
  { id: 'separation_anxiety', label: 'Fica ansiosa longe dos pais', group: 'care', alert: false, detail: false },
] as const satisfies readonly HealthItem[]

export type KidHealthItemId = (typeof HEALTH_ITEMS)[number]['id']

/** Só itens marcados: `true` nos simples, texto nos que pedem "qual?". */
export type KidHealth = Partial<Record<KidHealthItemId, true | string>>

export const MAX_HEALTH_DETAIL = 120

/** Lê `health` do formulário ou do Firestore: sem desmarcados, sem textos vazios, sem `undefined`. */
export function cleanHealth(raw: unknown): KidHealth {
  if (!raw || typeof raw !== 'object') return {}
  const r = raw as Record<string, unknown>
  const health: KidHealth = {}
  for (const item of HEALTH_ITEMS) {
    const value = r[item.id]
    if (item.detail) {
      const text = typeof value === 'string' ? value.trim() : ''
      if (text) health[item.id] = text
    } else if (value === true) {
      health[item.id] = true
    }
  }
  return health
}

export interface HealthEntry {
  id: KidHealthItemId
  label: string
  alert: boolean
  detail?: string
}

/** Itens marcados, na ordem do catálogo. */
export function entriesOf(health: KidHealth): HealthEntry[] {
  return HEALTH_ITEMS.flatMap((item): HealthEntry[] => {
    const value = health[item.id]
    if (value === undefined) return []
    const entry: HealthEntry = { id: item.id, label: item.label, alert: item.alert }
    return [typeof value === 'string' ? { ...entry, detail: value } : entry]
  })
}

export const alertsOf = (health: KidHealth) => entriesOf(health).filter((e) => e.alert)
