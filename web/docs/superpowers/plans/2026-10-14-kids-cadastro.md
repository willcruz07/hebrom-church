# Área Kids — entrega 1: cadastro de crianças — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pais cadastram no perfil as crianças sob sua responsabilidade (foto, nascimento, anamnese, responsáveis), e secretaria/pastor veem o cadastro oficial em Membros → Kids e no Dashboard.

**Architecture:** Regras puras (idade, sala, anamnese, validação, normalização, contagem, busca) em `src/lib/kids/`, testadas com `node --test`. Serviço Firebase `services/firebase/kids.ts` sobre a coleção `kids_children`; duas stores Zustand (`useMyChildren` para o perfil, `useKidsStore` com listener único para o painel). UI: componentes compartilhados em `src/components/kids/`, seção no perfil, rota `/dashboard/members/kids` com abas Membros | Kids, e um `StatCard` no Dashboard.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4, Firebase JS SDK v12 (Firestore + Storage), Zustand, `node --test` (type stripping do Node 24), lucide-react, sonner, dayjs.

**Spec:** `docs/superpowers/specs/2026-10-14-kids-cadastro-design.md`

## Global Constraints

- Todos os comandos rodam de dentro de `web/` (o repositório git é a pasta pai `D:\Code\hebrom-sys`).
- **Sem `git commit` e sem `git push`** (pedido do usuário). As mudanças ficam no working tree para o usuário testar e commitar.
- Não rodar o app (`npm run dev`). Verificar com `npm run test:kids`, `npx tsc --noEmit` e `npx eslint <arquivos>`.
- `src/lib/kids/*.ts` é importado pelos testes `node --test`: só imports **relativos com extensão `.ts`**, nada de `@/`, Firebase, React ou dayjs, nada de sintaxe TS não-apagável (enum, namespace, parameter properties).
- Coleção `kids_children`; foto no Storage em `kids/{childId}.jpg`.
- O Firestore recusa `undefined`: item desmarcado não tem chave em `health`; `notes`/`photo_url` vazios não têm chave.
- Datas de domínio `created_at`/`updated_at` com `serverTimestamp()`; `birth_date` é string `YYYY-MM-DD`.
- Limites: nome 1–80; observações até 1.000; "qual?" 1–120; responsáveis 1–4; 18 anos ou mais = data inválida.
- Salas: Berçário 0–2, Kids 3–7, Juniores 8–12; 13+ = "Fora das faixas".
- Mensagens exatas: `Nenhuma conta com este e-mail. Peça para a pessoa criar a conta no app primeiro.` · `Esta pessoa já é responsável.` · `Máximo de 4 responsáveis.` · `Data de nascimento inválida.` · `Informe qual.` · `Não foi possível salvar. Verifique sua conexão.` · `Foto não enviada, tente de novo.` · `Responsável removido` · `A equipe Kids usa estas informações para cuidar do seu filho durante o culto.` · confirmação de remoção `O cadastro e o prontuário de {nome} serão apagados.`
- Modais: `Dialog` com `variant="sheet"`; botões no padrão do app — ação principal âmbar primeiro (`h-11 px-8 font-black shadow-amber`), "Cancelar" `variant="ghost"` sem borda depois. Destaque âmbar e overlay com blur (já no `DialogOverlay`).

## Review Focus

1. Marcar "Alergia alimentar", digitar "amendoim", desmarcar e salvar → esperado: nenhuma chave `food_allergy` gravada (teste na Task 2).
2. Criança que faz 3 anos hoje → esperado: sala Kids, não Berçário; véspera ainda Berçário (teste na Task 1).
3. E-mail digitado com espaços e maiúsculas (`" Maria@Gmail.com "`) → esperado: encontra a conta `maria@gmail.com` (teste de `normalizeEmail` na Task 3).
4. Documento corrompido no Firestore (sem `guardian_uids`, data inválida) → esperado: descartado sem quebrar a lista (teste na Task 3).
5. Busca na aba Kids por "joao" encontrando "João" (nome do responsável, sem acento) → esperado: encontra (teste na Task 3).

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/kids/age.ts` (novo) | `isValidDate`, `ageOf`, `formatAge` |
| `src/lib/kids/rooms.ts` (novo) | salas fixas, `suggestRoom`, `roomLabelOf` |
| `src/lib/kids/health.ts` (novo) | catálogo da anamnese, `cleanHealth`, `entriesOf`, `alertsOf` |
| `src/lib/kids/validate.ts` (novo) | limites, `ChildFormValues`, `validateChild`, `hasErrors` |
| `src/lib/kids/child.ts` (novo) | `ChildFields`, `KidChildOf<T>`, `toChildFields`, `normalizeChild`, `normalizeEmail` |
| `src/lib/kids/stats.ts` (novo) | `countByRoom`, `matchesKidSearch` |
| `src/lib/kids/*.test.ts` (novos) | testes das regras |
| `package.json` (modificar) | script `test:kids` |
| `src/types/index.ts` (modificar) | `KidChild = KidChildOf<Timestamp>` |
| `src/services/firebase/kids.ts` (novo) | Firestore/Storage das crianças + busca de usuário por e-mail |
| `src/store/useMyChildren.ts` (novo) | crianças do usuário logado |
| `src/store/useKidsStore.ts` (novo) | listener único do painel |
| `src/components/kids/kids-today.ts` (novo) | `kidsToday()` (data de hoje em `YYYY-MM-DD`) |
| `src/components/kids/KidCard.tsx` (novo) | card da criança |
| `src/components/kids/HealthChips.tsx` (novo) | chips da anamnese + campos "qual?" + consentimento de foto |
| `src/components/kids/GuardiansField.tsx` (novo) | lista de responsáveis + adicionar por e-mail |
| `src/components/kids/KidFormModal.tsx` (novo) | cadastro/edição/remoção |
| `src/components/kids/KidDetailModal.tsx` (novo) | ficha em leitura (secretaria/pastor) |
| `src/app/(protected)/dashboard/profile/components/MyChildrenSection.tsx` (novo) | seção do perfil |
| `src/app/(protected)/dashboard/profile/page.tsx` (modificar) | inclui a seção |
| `src/app/(protected)/dashboard/members/components/MembersTabs.tsx` (novo) | abas Membros \| Kids |
| `src/app/(protected)/dashboard/members/page.tsx` (modificar) | inclui as abas |
| `src/app/(protected)/dashboard/members/kids/page.tsx` (novo) | lista Kids com busca, filtros e ficha |
| `src/app/(protected)/dashboard/page.tsx` (modificar) | `StatCard` "Crianças cadastradas" |
| `AGENTS.md` (modificar) | registra as regras do Firestore/Storage pendentes |

---

### Task 1: Idade e salas

**Files:**
- Create: `src/lib/kids/age.ts`, `src/lib/kids/rooms.ts`
- Test: `src/lib/kids/age.test.ts`, `src/lib/kids/rooms.test.ts`
- Modify: `package.json` (script `test:kids`)

**Interfaces:**
- Produces (`age.ts`): `isValidDate(value: string): boolean`; `interface Age { years: number; months: number }`; `ageOf(birthDate: string, today: string): Age`; `formatAge(birthDate: string, today: string): string`
- Produces (`rooms.ts`): `type RoomId = 'bercario' | 'kids' | 'juniores'`; `interface Room { id: RoomId; label: string; minYears: number; maxYears: number }`; `ROOMS: readonly Room[]`; `OUTSIDE_ROOMS_LABEL = 'Fora das faixas'`; `suggestRoom(birthDate: string, today: string): Room | null`; `roomLabelOf(birthDate: string, today: string): string`

- [ ] **Step 1: Adicionar o script** — em `package.json`, logo abaixo da linha `"test:bible": ...`, acrescentar:

```json
    "test:kids": "node --test src/lib/kids/*.test.ts",
```

(manter a vírgula correta: a linha `test:bible` já termina com vírgula se houver linhas depois; a nova linha também termina com vírgula se não for a última do objeto `scripts`).

- [ ] **Step 2: Escrever os testes que falham** — criar `src/lib/kids/age.test.ts`

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ageOf, formatAge, isValidDate } from './age.ts'

test('isValidDate aceita só datas reais YYYY-MM-DD', () => {
  assert.equal(isValidDate('2020-05-10'), true)
  assert.equal(isValidDate('2024-02-29'), true)
  assert.equal(isValidDate('2023-02-29'), false)
  assert.equal(isValidDate('2020-13-01'), false)
  assert.equal(isValidDate('10/05/2020'), false)
  assert.equal(isValidDate(''), false)
})

test('ageOf conta anos e meses completos', () => {
  assert.deepEqual(ageOf('2020-05-10', '2023-05-10'), { years: 3, months: 0 })
  assert.deepEqual(ageOf('2020-05-10', '2023-05-09'), { years: 2, months: 11 })
  assert.deepEqual(ageOf('2026-02-01', '2026-10-14'), { years: 0, months: 8 })
  assert.deepEqual(ageOf('2026-10-14', '2026-10-14'), { years: 0, months: 0 })
})

test('ageOf: nascido em 29/02 completa ano em 01/03', () => {
  assert.deepEqual(ageOf('2024-02-29', '2025-02-28'), { years: 0, months: 11 })
  assert.deepEqual(ageOf('2024-02-29', '2025-03-01'), { years: 1, months: 0 })
})

test('formatAge', () => {
  assert.equal(formatAge('2026-10-10', '2026-10-14'), 'Recém-nascido')
  assert.equal(formatAge('2026-09-14', '2026-10-14'), '1 mês')
  assert.equal(formatAge('2026-02-01', '2026-10-14'), '8 meses')
  assert.equal(formatAge('2025-10-14', '2026-10-14'), '1 ano')
  assert.equal(formatAge('2022-01-01', '2026-10-14'), '4 anos')
})
```

e `src/lib/kids/rooms.test.ts`

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OUTSIDE_ROOMS_LABEL, roomLabelOf, suggestRoom } from './rooms.ts'

const TODAY = '2026-10-14'
const bornYearsAgo = (years: number) => `${2026 - years}-10-14`

test('suggestRoom pelas faixas de idade', () => {
  assert.equal(suggestRoom(bornYearsAgo(0), TODAY)?.id, 'bercario')
  assert.equal(suggestRoom(bornYearsAgo(2), TODAY)?.id, 'bercario')
  assert.equal(suggestRoom(bornYearsAgo(3), TODAY)?.id, 'kids')
  assert.equal(suggestRoom(bornYearsAgo(7), TODAY)?.id, 'kids')
  assert.equal(suggestRoom(bornYearsAgo(8), TODAY)?.id, 'juniores')
  assert.equal(suggestRoom(bornYearsAgo(12), TODAY)?.id, 'juniores')
  assert.equal(suggestRoom(bornYearsAgo(13), TODAY), null)
})

test('suggestRoom muda de sala no dia do aniversário, não na véspera', () => {
  assert.equal(suggestRoom('2023-10-15', TODAY)?.id, 'bercario') // faz 3 amanhã
  assert.equal(suggestRoom('2023-10-14', TODAY)?.id, 'kids') // faz 3 hoje
})

test('roomLabelOf usa "Fora das faixas" acima de 12', () => {
  assert.equal(roomLabelOf(bornYearsAgo(4), TODAY), 'Kids')
  assert.equal(roomLabelOf(bornYearsAgo(15), TODAY), OUTSIDE_ROOMS_LABEL)
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm run test:kids`
Expected: FAIL — `Cannot find module '.../age.ts'` (e `rooms.ts`).

- [ ] **Step 4: Implementar** — criar `src/lib/kids/age.ts`

```ts
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
```

e `src/lib/kids/rooms.ts`

```ts
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
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm run test:kids`
Expected: PASS (todos os testes de `age` e `rooms`).

- [ ] **Step 6: Sem commit** (preferência do usuário). Seguir para a Task 2.

---

### Task 2: Anamnese (catálogo, limpeza e alertas)

**Files:**
- Create: `src/lib/kids/health.ts`
- Test: `src/lib/kids/health.test.ts`

**Interfaces:**
- Produces: `type HealthGroupId = 'food' | 'health' | 'care'`; `HEALTH_GROUPS: readonly { id: HealthGroupId; label: string }[]`; `HEALTH_ITEMS` (tupla `as const` de `{ id, label, group, alert: boolean, detail: boolean }`); `type KidHealthItemId`; `type KidHealth = Partial<Record<KidHealthItemId, true | string>>`; `MAX_HEALTH_DETAIL = 120`; `cleanHealth(raw: unknown): KidHealth`; `interface HealthEntry { id: KidHealthItemId; label: string; alert: boolean; detail?: string }`; `entriesOf(health: KidHealth): HealthEntry[]`; `alertsOf(health: KidHealth): HealthEntry[]`

- [ ] **Step 1: Escrever os testes que falham** — criar `src/lib/kids/health.test.ts`

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { alertsOf, cleanHealth, entriesOf, HEALTH_ITEMS } from './health.ts'

test('catálogo tem ids únicos', () => {
  const ids = HEALTH_ITEMS.map((i) => i.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('cleanHealth mantém só itens marcados, apara textos e descarta o resto', () => {
  assert.deepEqual(
    cleanHealth({
      asthma: true,
      food_allergy: '  amendoim ',
      drug_allergy: '   ',
      continuous_medication: '',
      lactose: false,
      epilepsy: 'sim',
      desconhecido: true,
    }),
    { asthma: true, food_allergy: 'amendoim' },
  )
})

test('cleanHealth: item com "qual?" desmarcado não deixa chave', () => {
  const form: Record<string, unknown> = { food_allergy: 'amendoim' }
  delete form.food_allergy
  const health = cleanHealth(form)
  assert.equal('food_allergy' in health, false)
  assert.deepEqual(health, {})
})

test('cleanHealth não devolve valores undefined e tolera lixo', () => {
  assert.deepEqual(cleanHealth(null), {})
  assert.deepEqual(cleanHealth('x'), {})
  const health = cleanHealth({ asthma: undefined, diapers: true })
  assert.deepEqual(health, { diapers: true })
  assert.equal(Object.values(health).includes(undefined as never), false)
})

test('alertsOf lista só alertas, na ordem do catálogo, com o detalhe', () => {
  assert.deepEqual(alertsOf({ diabetes: true, lactose: true, food_allergy: 'amendoim' }), [
    { id: 'food_allergy', label: 'Alergia alimentar', alert: true, detail: 'amendoim' },
    { id: 'diabetes', label: 'Diabetes', alert: true },
  ])
  assert.deepEqual(alertsOf({ lactose: true }), [])
})

test('entriesOf lista todos os marcados', () => {
  assert.deepEqual(
    entriesOf({ diapers: true, lactose: true }).map((e) => e.id),
    ['lactose', 'diapers'],
  )
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:kids`
Expected: FAIL — `Cannot find module '.../health.ts'`.

- [ ] **Step 3: Implementar** — criar `src/lib/kids/health.ts`

```ts
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test:kids`
Expected: PASS.

- [ ] **Step 5: Sem commit.** Seguir para a Task 3.

---

### Task 3: Validação, campos do Firestore, normalização, contagem e busca

**Files:**
- Create: `src/lib/kids/validate.ts`, `src/lib/kids/child.ts`, `src/lib/kids/stats.ts`
- Test: `src/lib/kids/validate.test.ts`, `src/lib/kids/child.test.ts`, `src/lib/kids/stats.test.ts`
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: `isValidDate`, `ageOf` (Task 1); `suggestRoom`, `RoomId` (Task 1); `cleanHealth`, `HEALTH_ITEMS`, `MAX_HEALTH_DETAIL`, `KidHealth`, `KidHealthItemId` (Task 2).
- Produces (`validate.ts`): `MAX_CHILD_NAME = 80`, `MAX_CHILD_NOTES = 1000`, `MAX_GUARDIANS = 4`, `MAX_CHILD_AGE = 18`; `interface ChildFormValues { name: string; birth_date: string; health: KidHealth; notes: string; photo_consent: boolean; guardian_uids: string[] }`; `interface ChildFormErrors { name?: string; birth_date?: string; notes?: string; guardians?: string; health?: Partial<Record<KidHealthItemId, string>> }`; `validateChild(form: ChildFormValues, today: string): ChildFormErrors`; `hasErrors(errors: ChildFormErrors): boolean`
- Produces (`child.ts`): `interface ChildFields { name: string; birth_date: string; health: KidHealth; photo_consent: boolean; guardian_uids: string[]; notes?: string }`; `interface KidChildOf<T> extends ChildFields { id: string; photo_url?: string; is_visitor: boolean; created_by: string; created_at: T; updated_at?: T }`; `toChildFields(form: ChildFormValues): ChildFields`; `normalizeChild<T>(id: string, raw: unknown): KidChildOf<T> | null`; `normalizeEmail(email: string): string`
- Produces (`stats.ts`): `type RoomCounts = Record<RoomId, number> & { outside: number; total: number }`; `countByRoom(children: { birth_date: string }[], today: string): RoomCounts`; `matchesKidSearch(term: string, texts: string[]): boolean`
- Produces (`@/types`): `type KidChild = KidChildOf<Timestamp>`

- [ ] **Step 1: Escrever os testes que falham** — criar `src/lib/kids/validate.test.ts`

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hasErrors, validateChild, type ChildFormValues } from './validate.ts'

const TODAY = '2026-10-14'
const form = (over: Partial<ChildFormValues> = {}): ChildFormValues => ({
  name: 'Lucas',
  birth_date: '2022-03-10',
  health: {},
  notes: '',
  photo_consent: false,
  guardian_uids: ['u1'],
  ...over,
})

test('formulário válido não tem erros', () => {
  assert.deepEqual(validateChild(form(), TODAY), {})
  assert.equal(hasErrors(validateChild(form(), TODAY)), false)
})

test('nome obrigatório e com limite', () => {
  assert.equal(validateChild(form({ name: '   ' }), TODAY).name, 'Informe o nome.')
  assert.equal(validateChild(form({ name: 'a'.repeat(81) }), TODAY).name, 'Máximo de 80 caracteres.')
})

test('data de nascimento inválida, futura ou com 18+ anos', () => {
  for (const birth_date of ['', '2026-02-30', '2026-10-15', '2008-10-14']) {
    assert.equal(validateChild(form({ birth_date }), TODAY).birth_date, 'Data de nascimento inválida.', birth_date)
  }
  assert.equal(validateChild(form({ birth_date: '2008-10-15' }), TODAY).birth_date, undefined) // 17 anos
  assert.equal(validateChild(form({ birth_date: TODAY }), TODAY).birth_date, undefined)
})

test('"qual?" vazio ou longo nos itens marcados', () => {
  const errors = validateChild(form({ health: { food_allergy: '  ', drug_allergy: 'x'.repeat(121), asthma: true } }), TODAY)
  assert.deepEqual(errors.health, { food_allergy: 'Informe qual.', drug_allergy: 'Máximo de 120 caracteres.' })
})

test('responsáveis: de 1 a 4', () => {
  assert.equal(validateChild(form({ guardian_uids: [] }), TODAY).guardians, 'Informe pelo menos um responsável.')
  assert.equal(
    validateChild(form({ guardian_uids: ['a', 'b', 'c', 'd', 'e'] }), TODAY).guardians,
    'Máximo de 4 responsáveis.',
  )
  assert.equal(validateChild(form({ guardian_uids: ['a', 'a'] }), TODAY).guardians, undefined)
})

test('observações até 1000', () => {
  assert.equal(validateChild(form({ notes: 'a'.repeat(1001) }), TODAY).notes, 'Máximo de 1000 caracteres.')
})
```

e `src/lib/kids/child.test.ts`

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeChild, normalizeEmail, toChildFields } from './child.ts'

test('toChildFields apara, limpa a anamnese e omite observação vazia', () => {
  const fields = toChildFields({
    name: '  Lucas  ',
    birth_date: '2022-03-10',
    health: { food_allergy: ' amendoim ', asthma: true, drug_allergy: '' },
    notes: '   ',
    photo_consent: true,
    guardian_uids: ['u1', 'u2', 'u1'],
  })
  assert.deepEqual(fields, {
    name: 'Lucas',
    birth_date: '2022-03-10',
    health: { food_allergy: 'amendoim', asthma: true },
    photo_consent: true,
    guardian_uids: ['u1', 'u2'],
  })
  assert.equal('notes' in fields, false)
  assert.equal(toChildFields({ ...fieldsForm(), notes: ' oi ' }).notes, 'oi')
})

function fieldsForm() {
  return { name: 'A', birth_date: '2022-03-10', health: {}, notes: '', photo_consent: false, guardian_uids: ['u1'] }
}

test('normalizeChild lê um documento válido', () => {
  const created = { at: 1 }
  const child = normalizeChild('c1', {
    name: ' Lucas ',
    birth_date: '2022-03-10',
    guardian_uids: ['u1', 'u1', 'u2'],
    health: { asthma: true, lixo: true },
    photo_consent: true,
    notes: 'gosta de desenhar',
    photo_url: 'https://x/y.jpg',
    is_visitor: false,
    created_by: 'u1',
    created_at: created,
  })
  assert.deepEqual(child, {
    id: 'c1',
    name: 'Lucas',
    birth_date: '2022-03-10',
    guardian_uids: ['u1', 'u2'],
    health: { asthma: true },
    photo_consent: true,
    notes: 'gosta de desenhar',
    photo_url: 'https://x/y.jpg',
    is_visitor: false,
    created_by: 'u1',
    created_at: created,
  })
})

test('normalizeChild descarta documentos corrompidos', () => {
  const base = { name: 'Lucas', birth_date: '2022-03-10', guardian_uids: ['u1'] }
  assert.equal(normalizeChild('c', null), null)
  assert.equal(normalizeChild('c', { ...base, guardian_uids: undefined }), null)
  assert.equal(normalizeChild('c', { ...base, guardian_uids: [] }), null)
  assert.equal(normalizeChild('c', { ...base, name: '  ' }), null)
  assert.equal(normalizeChild('c', { ...base, birth_date: '2022-02-30' }), null)
  const minimal = normalizeChild('c', base)
  assert.equal(minimal?.photo_consent, false)
  assert.equal(minimal && 'notes' in minimal, false)
  assert.equal(minimal && 'photo_url' in minimal, false)
})

test('normalizeEmail apara e põe em minúsculas', () => {
  assert.equal(normalizeEmail(' Maria@Gmail.com '), 'maria@gmail.com')
})
```

e `src/lib/kids/stats.test.ts`

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { countByRoom, matchesKidSearch } from './stats.ts'

test('countByRoom conta por sala e total', () => {
  const kids = ['2025-01-01', '2024-01-01', '2021-01-01', '2016-01-01', '2010-01-01'].map((birth_date) => ({ birth_date }))
  assert.deepEqual(countByRoom(kids, '2026-10-14'), { bercario: 2, kids: 1, juniores: 1, outside: 1, total: 5 })
  assert.deepEqual(countByRoom([], '2026-10-14'), { bercario: 0, kids: 0, juniores: 0, outside: 0, total: 0 })
})

test('matchesKidSearch ignora acento e maiúsculas e procura em todos os textos', () => {
  assert.equal(matchesKidSearch('joao', ['Lucas', 'João Souza']), true)
  assert.equal(matchesKidSearch('LUC', ['Lucas']), true)
  assert.equal(matchesKidSearch('  ', ['Lucas']), true)
  assert.equal(matchesKidSearch('maria', ['Lucas', 'João']), false)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:kids`
Expected: FAIL — módulos `validate.ts`, `child.ts`, `stats.ts` não encontrados.

- [ ] **Step 3: Implementar** — criar `src/lib/kids/validate.ts`

```ts
import { ageOf, isValidDate } from './age.ts'
import { HEALTH_ITEMS, MAX_HEALTH_DETAIL, type KidHealth, type KidHealthItemId } from './health.ts'

export const MAX_CHILD_NAME = 80
export const MAX_CHILD_NOTES = 1000
export const MAX_GUARDIANS = 4
/** A partir desta idade não é mais criança para a Área Kids. */
export const MAX_CHILD_AGE = 18

export interface ChildFormValues {
  name: string
  birth_date: string
  /** Itens com "qual?" marcados guardam texto (vazio enquanto o pai não digita). */
  health: KidHealth
  notes: string
  photo_consent: boolean
  guardian_uids: string[]
}

export interface ChildFormErrors {
  name?: string
  birth_date?: string
  notes?: string
  guardians?: string
  health?: Partial<Record<KidHealthItemId, string>>
}

export function validateChild(form: ChildFormValues, today: string): ChildFormErrors {
  const errors: ChildFormErrors = {}

  const name = form.name.trim()
  if (!name) errors.name = 'Informe o nome.'
  else if (name.length > MAX_CHILD_NAME) errors.name = `Máximo de ${MAX_CHILD_NAME} caracteres.`

  if (
    !isValidDate(form.birth_date) ||
    form.birth_date > today ||
    ageOf(form.birth_date, today).years >= MAX_CHILD_AGE
  ) {
    errors.birth_date = 'Data de nascimento inválida.'
  }

  if (form.notes.trim().length > MAX_CHILD_NOTES) errors.notes = `Máximo de ${MAX_CHILD_NOTES} caracteres.`

  const guardians = new Set(form.guardian_uids).size
  if (guardians < 1) errors.guardians = 'Informe pelo menos um responsável.'
  else if (guardians > MAX_GUARDIANS) errors.guardians = `Máximo de ${MAX_GUARDIANS} responsáveis.`

  const health: Partial<Record<KidHealthItemId, string>> = {}
  for (const item of HEALTH_ITEMS) {
    const value = form.health[item.id]
    if (!item.detail || value === undefined) continue
    const text = typeof value === 'string' ? value.trim() : ''
    if (!text) health[item.id] = 'Informe qual.'
    else if (text.length > MAX_HEALTH_DETAIL) health[item.id] = `Máximo de ${MAX_HEALTH_DETAIL} caracteres.`
  }
  if (Object.keys(health).length) errors.health = health

  return errors
}

export const hasErrors = (errors: ChildFormErrors) => Object.keys(errors).length > 0
```

e `src/lib/kids/child.ts`

```ts
import { isValidDate } from './age.ts'
import { cleanHealth, type KidHealth } from './health.ts'
import type { ChildFormValues } from './validate.ts'

/** Campos editáveis prontos para o Firestore (aparados, sem chaves `undefined`). */
export interface ChildFields {
  name: string
  birth_date: string
  health: KidHealth
  photo_consent: boolean
  guardian_uids: string[]
  notes?: string
}

/** Criança como lida do Firestore; `T` é o tipo do Timestamp (permite testar sem Firebase). */
export interface KidChildOf<T> extends ChildFields {
  id: string
  photo_url?: string
  is_visitor: boolean
  created_by: string
  created_at: T
  updated_at?: T
}

export function toChildFields(form: ChildFormValues): ChildFields {
  const notes = form.notes.trim()
  return {
    name: form.name.trim(),
    birth_date: form.birth_date,
    health: cleanHealth(form.health),
    photo_consent: form.photo_consent,
    guardian_uids: [...new Set(form.guardian_uids)],
    ...(notes ? { notes } : {}),
  }
}

const nonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim() !== ''

/** Lê um documento de `kids_children`; devolve `null` se estiver corrompido. */
export function normalizeChild<T>(id: string, raw: unknown): KidChildOf<T> | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const guardians = Array.isArray(r.guardian_uids) ? r.guardian_uids.filter(nonEmptyString) : []
  if (!nonEmptyString(r.name) || typeof r.birth_date !== 'string' || !isValidDate(r.birth_date) || !guardians.length) {
    return null
  }

  return {
    id,
    name: r.name.trim(),
    birth_date: r.birth_date,
    guardian_uids: [...new Set(guardians)],
    health: cleanHealth(r.health),
    photo_consent: r.photo_consent === true,
    ...(nonEmptyString(r.notes) ? { notes: r.notes.trim() } : {}),
    ...(nonEmptyString(r.photo_url) ? { photo_url: r.photo_url } : {}),
    is_visitor: r.is_visitor === true,
    created_by: typeof r.created_by === 'string' ? r.created_by : '',
    created_at: r.created_at as T,
    ...(r.updated_at ? { updated_at: r.updated_at as T } : {}),
  }
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase()
```

e `src/lib/kids/stats.ts`

```ts
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
```

- [ ] **Step 4: Tipo do app** — em `src/types/index.ts`, acrescentar junto dos imports do topo:

```ts
import type { KidChildOf } from '@/lib/kids/child';
```

e, logo após o bloco `export type BibleBookmark = BookmarkOf<Timestamp>;`:

```ts

/** Criança da Área Kids (regras em src/lib/kids/). */
export type KidChild = KidChildOf<Timestamp>;
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm run test:kids && npx tsc --noEmit`
Expected: testes PASS; `tsc` sem saída.

- [ ] **Step 6: Sem commit.** Seguir para a Task 4.

---

### Task 4: Serviço Firebase e stores

**Files:**
- Create: `src/services/firebase/kids.ts`, `src/store/useMyChildren.ts`, `src/store/useKidsStore.ts`

**Interfaces:**
- Consumes: `normalizeChild`, `normalizeEmail`, `ChildFields` (Task 3); `KidChild`, `AppUser` de `@/types`; `uploadFile` de `./storage`; `db`, `storage`, `storageRef` de `./config`.
- Produces (serviço): `interface GuardianInfo { uid: string; name: string; avatar_url: string | null }`; `getMyChildren(uid: string): Promise<KidChild[]>`; `subscribeToChildren(onData: (children: KidChild[]) => void, onError: (error: Error) => void): Unsubscribe`; `createChild(fields: ChildFields, uid: string): Promise<string>`; `updateChild(id: string, fields: ChildFields): Promise<void>`; `setChildPhoto(id: string, blob: Blob): Promise<string>`; `deleteChild(id: string): Promise<void>`; `findUserByEmail(email: string): Promise<GuardianInfo | null>`; `getGuardians(uids: string[]): Promise<Record<string, GuardianInfo | null>>`
- Produces (stores): `useMyChildren(): { uid: string | null; children: KidChild[]; status: 'idle' | 'loading' | 'ready' | 'error'; load(uid: string): Promise<void>; refresh(): Promise<void> }`; `useKidsStore(): { children: KidChild[]; loaded: boolean; error: boolean; startListening(): void }`

- [ ] **Step 1: Criar `src/services/firebase/kids.ts`**

```ts
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { deleteObject } from 'firebase/storage'
import { db, storage, storageRef } from './config'
import { uploadFile } from './storage'
import { getUserById } from './users'
import { normalizeChild, normalizeEmail, type ChildFields } from '@/lib/kids/child'
import type { KidChild } from '@/types'

// Cadastro oficial das crianças da Hebrom. Privado: responsáveis editam; equipe Kids,
// secretaria e pastor só leem (regras no console — ver AGENTS.md).
const KIDS_COLLECTION = 'kids_children'
const kidsCollection = () => collection(db, KIDS_COLLECTION)
const childDoc = (id: string) => doc(db, KIDS_COLLECTION, id)
const photoPath = (id: string) => `kids/${id}.jpg`

export interface GuardianInfo {
  uid: string
  name: string
  avatar_url: string | null
}

const toChildren = (docs: QueryDocumentSnapshot[]) =>
  docs.flatMap((d) => {
    const child = normalizeChild<Timestamp>(d.id, d.data())
    return child ? [child] : []
  })

const byAge = (a: KidChild, b: KidChild) => a.birth_date.localeCompare(b.birth_date)

/** Crianças em que o usuário é responsável (o filtro também é exigido pela regra de leitura). */
export async function getMyChildren(uid: string): Promise<KidChild[]> {
  const snapshot = await getDocs(query(kidsCollection(), where('guardian_uids', 'array-contains', uid)))
  return toChildren(snapshot.docs).sort(byAge)
}

/** Listener de todas as crianças (painel) — quem gerencia o ciclo de vida é o useKidsStore. */
export function subscribeToChildren(
  onData: (children: KidChild[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(kidsCollection(), (snapshot) => onData(toChildren(snapshot.docs)), onError)
}

export async function createChild(fields: ChildFields, uid: string): Promise<string> {
  const ref = await addDoc(kidsCollection(), {
    ...fields,
    is_visitor: false,
    created_by: uid,
    created_at: serverTimestamp(),
  })
  return ref.id
}

export async function updateChild(id: string, fields: ChildFields): Promise<void> {
  await updateDoc(childDoc(id), {
    ...fields,
    notes: fields.notes ?? deleteField(),
    updated_at: serverTimestamp(),
  })
}

export async function setChildPhoto(id: string, blob: Blob): Promise<string> {
  const url = await uploadFile(photoPath(id), blob)
  await updateDoc(childDoc(id), { photo_url: url })
  return url
}

export async function deleteChild(id: string): Promise<void> {
  await deleteDoc(childDoc(id))
  // A foto pode não existir; falhar aqui não impede a remoção do cadastro
  await deleteObject(storageRef(storage, photoPath(id))).catch(() => {})
}

export async function findUserByEmail(email: string): Promise<GuardianInfo | null> {
  const snapshot = await getDocs(
    query(collection(db, 'users'), where('email', '==', normalizeEmail(email)), limit(1)),
  )
  const found = snapshot.docs[0]
  if (!found) return null
  const data = found.data()
  return { uid: found.id, name: data.profile?.full_name ?? data.email, avatar_url: data.profile?.avatar_url ?? null }
}

/** Nome e foto dos responsáveis (no máximo 4 leituras). `null` = conta não existe mais. */
export async function getGuardians(uids: string[]): Promise<Record<string, GuardianInfo | null>> {
  const entries = await Promise.all(
    uids.map(async (uid) => {
      const user = await getUserById(uid).catch(() => null)
      const info: GuardianInfo | null = user
        ? { uid, name: user.profile.full_name, avatar_url: user.profile.avatar_url }
        : null
      return [uid, info] as const
    }),
  )
  return Object.fromEntries(entries)
}
```

- [ ] **Step 2: Criar `src/store/useMyChildren.ts`**

```ts
import { create } from 'zustand'
import { getMyChildren } from '@/services/firebase/kids'
import type { KidChild } from '@/types'

interface MyChildrenState {
  uid: string | null
  children: KidChild[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** Carrega uma vez por usuário; chamadas repetidas não releem o Firestore. */
  load: (uid: string) => Promise<void>
  /** Relê depois de criar, editar ou remover uma criança. */
  refresh: () => Promise<void>
}

export const useMyChildren = create<MyChildrenState>((set, get) => {
  async function fetchFor(uid: string) {
    try {
      const children = await getMyChildren(uid)
      if (get().uid === uid) set({ children, status: 'ready' })
    } catch (error) {
      console.error(error)
      if (get().uid === uid) set({ status: 'error' })
    }
  }

  return {
    uid: null,
    children: [],
    status: 'idle',

    load: async (uid) => {
      const { uid: current, status } = get()
      if (current === uid && (status === 'loading' || status === 'ready')) return
      set({ uid, children: [], status: 'loading' })
      await fetchFor(uid)
    },

    refresh: async () => {
      const { uid } = get()
      if (uid) await fetchFor(uid)
    },
  }
})
```

- [ ] **Step 3: Criar `src/store/useKidsStore.ts`**

```ts
import { create } from 'zustand'
import type { Unsubscribe } from 'firebase/firestore'
import { subscribeToChildren } from '@/services/firebase/kids'
import type { KidChild } from '@/types'

interface KidsState {
  children: KidChild[]
  loaded: boolean
  error: boolean
  startListening: () => void
}

let unsubscribe: Unsubscribe | null = null

// Listener único de `kids_children`, vivo durante a sessão (mesmo padrão do useMembersStore):
// voltar para Membros → Kids ou para o Dashboard mostra os dados na hora.
export const useKidsStore = create<KidsState>((set) => ({
  children: [],
  loaded: false,
  error: false,

  startListening() {
    if (unsubscribe) return
    unsubscribe = subscribeToChildren(
      (children) => set({ children, loaded: true, error: false }),
      (error) => {
        console.error('Erro no listener de crianças:', error)
        unsubscribe = null
        set({ loaded: true, error: true })
      },
    )
  },
}))
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npx eslint src/services/firebase/kids.ts src/store/useMyChildren.ts src/store/useKidsStore.ts`
Expected: `tsc` sem saída; eslint sem erros.

- [ ] **Step 5: Sem commit.** Seguir para a Task 5.

---

### Task 5: Componentes base (card, chips da anamnese, responsáveis)

**Files:**
- Create: `src/components/kids/kids-today.ts`, `src/components/kids/KidCard.tsx`, `src/components/kids/HealthChips.tsx`, `src/components/kids/GuardiansField.tsx`

**Interfaces:**
- Consumes: `formatAge` (Task 1), `roomLabelOf` (Task 1), `alertsOf`, `HEALTH_GROUPS`, `HEALTH_ITEMS`, `MAX_HEALTH_DETAIL`, `KidHealth`, `KidHealthItemId` (Task 2), `MAX_GUARDIANS` (Task 3), `findUserByEmail`, `getGuardians`, `GuardianInfo` (Task 4).
- Produces:
  - `kidsToday(): string`
  - `KidCard({ child: KidChild; subtitle?: string; onClick: () => void })`
  - `HealthChips({ health: KidHealth; onChange: (health: KidHealth) => void; photoConsent: boolean; onPhotoConsentChange: (value: boolean) => void; errors?: Partial<Record<KidHealthItemId, string>> })`
  - `GuardiansField({ currentUid: string; guardianUids: string[]; onChange: (uids: string[]) => void; error?: string })`

- [ ] **Step 1: Criar `src/components/kids/kids-today.ts`**

```ts
import dayjs from '@/lib/dayjs'

/** Hoje em `YYYY-MM-DD` (as regras de src/lib/kids recebem a data por parâmetro). */
export const kidsToday = () => dayjs().format('YYYY-MM-DD')
```

- [ ] **Step 2: Criar `src/components/kids/KidCard.tsx`**

```tsx
'use client'

import { AlertTriangle } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { formatAge } from '@/lib/kids/age'
import { alertsOf } from '@/lib/kids/health'
import { roomLabelOf } from '@/lib/kids/rooms'
import type { KidChild } from '@/types'
import { kidsToday } from './kids-today'

interface KidCardProps {
  child: KidChild
  /** Linha extra, ex.: "Responsáveis: João e Maria". */
  subtitle?: string
  onClick: () => void
}

export function KidCard({ child, subtitle, onClick }: KidCardProps) {
  const today = kidsToday()
  const alerts = alertsOf(child.health).length

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-amber-400 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
    >
      <UserAvatar src={child.photo_url} name={child.name} size={48} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-slate-900 dark:text-white">{child.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatAge(child.birth_date, today)} · {roomLabelOf(child.birth_date, today)}
        </p>
        {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
      </div>
      {alerts > 0 && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle className="h-3 w-3" />
          {alerts} {alerts === 1 ? 'alerta' : 'alertas'}
        </span>
      )}
    </button>
  )
}
```

- [ ] **Step 3: Criar `src/components/kids/HealthChips.tsx`**

```tsx
'use client'

import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import {
  HEALTH_GROUPS,
  HEALTH_ITEMS,
  MAX_HEALTH_DETAIL,
  type KidHealth,
  type KidHealthItemId,
} from '@/lib/kids/health'
import { cn } from '@/lib/utils'

type HealthItem = (typeof HEALTH_ITEMS)[number]

interface HealthChipsProps {
  health: KidHealth
  onChange: (health: KidHealth) => void
  photoConsent: boolean
  onPhotoConsentChange: (value: boolean) => void
  errors?: Partial<Record<KidHealthItemId, string>>
}

/** Anamnese em chips; itens com "qual?" abrem um campo curto quando marcados. */
export function HealthChips({ health, onChange, photoConsent, onPhotoConsentChange, errors }: HealthChipsProps) {
  const toggle = (item: HealthItem) => {
    const next = { ...health }
    if (next[item.id] !== undefined) delete next[item.id]
    else next[item.id] = item.detail ? '' : true
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {HEALTH_GROUPS.map((group) => {
        const items = HEALTH_ITEMS.filter((item) => item.group === group.id)
        const openDetails = items.filter((item) => item.detail && health[item.id] !== undefined)
        return (
          <div key={group.id} className="space-y-2">
            <GroupLabel>{group.label}</GroupLabel>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <Chip key={item.id} active={health[item.id] !== undefined} alert={item.alert} onClick={() => toggle(item)}>
                  {item.label}
                </Chip>
              ))}
            </div>
            {openDetails.map((item) => {
              const value = health[item.id]
              const error = errors?.[item.id]
              return (
                <div key={item.id} className="space-y-1">
                  <Input
                    value={typeof value === 'string' ? value : ''}
                    onChange={(e) => onChange({ ...health, [item.id]: e.target.value })}
                    maxLength={MAX_HEALTH_DETAIL}
                    placeholder={`${item.label}: qual?`}
                    aria-invalid={!!error}
                    className={cn('rounded-xl', error && 'border-red-500 focus-visible:ring-red-500')}
                  />
                  {error && <p className="text-xs font-medium text-red-500">{error}</p>}
                </div>
              )
            })}
          </div>
        )
      })}

      <div className="space-y-2">
        <GroupLabel>Autorizações</GroupLabel>
        <div className="flex flex-wrap gap-2">
          <Chip active={photoConsent} onClick={() => onPhotoConsentChange(!photoConsent)}>
            Pode ser fotografada (redes da igreja)
          </Chip>
        </div>
      </div>
    </div>
  )
}

function GroupLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{children}</p>
}

function Chip({
  active,
  alert = false,
  onClick,
  children,
}: {
  active: boolean
  alert?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition-all active:scale-95',
        active
          ? 'border-amber-600 bg-amber-600 text-white shadow-md shadow-amber-500/25'
          : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
      )}
    >
      {alert && <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-white' : 'bg-red-500')} />}
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Criar `src/components/kids/GuardiansField.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { MAX_GUARDIANS } from '@/lib/kids/validate'
import { findUserByEmail, getGuardians, type GuardianInfo } from '@/services/firebase/kids'

interface GuardiansFieldProps {
  currentUid: string
  guardianUids: string[]
  onChange: (uids: string[]) => void
  error?: string
}

/** Responsáveis da criança: o usuário logado e outros vinculados pelo e-mail da conta. */
export function GuardiansField({ currentUid, guardianUids, onChange, error }: GuardiansFieldProps) {
  const [info, setInfo] = useState<Record<string, GuardianInfo | null>>({})
  const [adding, setAdding] = useState(false)
  const [email, setEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [candidate, setCandidate] = useState<GuardianInfo | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const missing = guardianUids.filter((uid) => !(uid in info))
    if (!missing.length) return
    let cancelled = false
    getGuardians(missing).then((found) => {
      if (!cancelled) setInfo((current) => ({ ...current, ...found }))
    })
    return () => {
      cancelled = true
    }
  }, [guardianUids, info])

  const resetAdd = () => {
    setAdding(false)
    setEmail('')
    setCandidate(null)
    setMessage('')
  }

  const search = async () => {
    setMessage('')
    setCandidate(null)
    if (!email.trim()) return
    setSearching(true)
    try {
      const user = await findUserByEmail(email)
      if (!user) setMessage('Nenhuma conta com este e-mail. Peça para a pessoa criar a conta no app primeiro.')
      else if (guardianUids.includes(user.uid)) setMessage('Esta pessoa já é responsável.')
      else setCandidate(user)
    } catch (err) {
      console.error(err)
      setMessage('Não foi possível buscar agora. Verifique sua conexão.')
    } finally {
      setSearching(false)
    }
  }

  const confirmCandidate = () => {
    if (!candidate) return
    setInfo((current) => ({ ...current, [candidate.uid]: candidate }))
    onChange([...guardianUids, candidate.uid])
    resetAdd()
  }

  // O usuário logado sempre primeiro
  const ordered = [...guardianUids].sort((a, b) => Number(b === currentUid) - Number(a === currentUid))
  const full = guardianUids.length >= MAX_GUARDIANS

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {ordered.map((uid) => {
          const guardian = info[uid]
          const canRemove = uid !== currentUid || guardianUids.length > 1
          return (
            <li
              key={uid}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-2 pr-1 dark:border-slate-800"
            >
              <UserAvatar src={guardian?.avatar_url} name={guardian?.name} size={36} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {guardian === undefined ? '…' : guardian === null ? 'Responsável removido' : guardian.name}
                {uid === currentUid && <span className="ml-1 font-normal text-slate-400">(você)</span>}
              </span>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => onChange(guardianUids.filter((u) => u !== uid))}
                  aria-label="Remover responsável"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {adding ? (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/50 dark:bg-amber-900/10">
          <div className="flex gap-2">
            <Input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  search()
                }
              }}
              placeholder="E-mail da conta do responsável"
              className="rounded-xl bg-white dark:bg-slate-900"
            />
            <Button
              type="button"
              onClick={search}
              disabled={searching || !email.trim()}
              aria-label="Buscar"
              className="h-11 w-11 shrink-0 rounded-xl bg-amber-600 p-0 text-white hover:bg-amber-700"
            >
              {searching ? <HebromSpinner size="sm" className="brightness-200" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {message && <p className="text-xs font-medium text-red-500">{message}</p>}
          {candidate && (
            <div className="flex items-center gap-3 rounded-xl bg-white p-2 dark:bg-slate-900">
              <UserAvatar src={candidate.avatar_url} name={candidate.name} size={36} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{candidate.name}</span>
              <Button
                type="button"
                onClick={confirmCandidate}
                className="h-9 rounded-lg bg-amber-600 px-4 font-bold text-white hover:bg-amber-700"
              >
                Confirmar
              </Button>
            </div>
          )}
          <Button type="button" variant="ghost" onClick={resetAdd} className="h-9 w-full rounded-lg text-slate-500">
            Cancelar
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          disabled={full}
          onClick={() => setAdding(true)}
          className="h-10 w-full justify-start gap-2 rounded-xl font-bold text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
        >
          <Plus className="h-4 w-4" />
          Adicionar responsável
        </Button>
      )}
      {full && <p className="text-xs text-slate-400">Máximo de 4 responsáveis.</p>}
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit && npx eslint src/components/kids`
Expected: `tsc` sem saída; eslint sem erros.

- [ ] **Step 6: Sem commit.** Seguir para a Task 6.

---

### Task 6: Modal de cadastro e seção do perfil

**Files:**
- Create: `src/components/kids/KidFormModal.tsx`, `src/app/(protected)/dashboard/profile/components/MyChildrenSection.tsx`
- Modify: `src/app/(protected)/dashboard/profile/page.tsx`

**Interfaces:**
- Consumes: `validateChild`, `hasErrors`, `ChildFormValues`, `ChildFormErrors`, `MAX_CHILD_NOTES` (Task 3); `toChildFields` (Task 3); `formatAge`, `roomLabelOf` (Task 1); `createChild`, `updateChild`, `setChildPhoto`, `deleteChild` (Task 4); `useMyChildren` (Task 4); `KidCard`, `HealthChips`, `GuardiansField`, `kidsToday` (Task 5); `ImageCropper` (`image`, `open`, `onOpenChange`, `onCropComplete(blob)`); `useMessages().confirm`.
- Produces: `KidFormModal({ open: boolean; onOpenChange: (open: boolean) => void; child: KidChild | null; onSaved: () => void })`; `MyChildrenSection()` (sem props).

- [ ] **Step 1: Criar `src/components/kids/KidFormModal.tsx`**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { ImageCropper } from '@/components/ui/ImageCropper'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useMessages } from '@/hooks/useMessages'
import { formatAge, isValidDate } from '@/lib/kids/age'
import { toChildFields } from '@/lib/kids/child'
import { roomLabelOf } from '@/lib/kids/rooms'
import {
  hasErrors,
  MAX_CHILD_NAME,
  MAX_CHILD_NOTES,
  validateChild,
  type ChildFormErrors,
  type ChildFormValues,
} from '@/lib/kids/validate'
import { cn } from '@/lib/utils'
import { createChild, deleteChild, setChildPhoto, updateChild } from '@/services/firebase/kids'
import { useAuth } from '@/store/useAuth'
import type { KidChild } from '@/types'
import { GuardiansField } from './GuardiansField'
import { HealthChips } from './HealthChips'
import { kidsToday } from './kids-today'

interface KidFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** `null` = nova criança. */
  child: KidChild | null
  /** Chamado depois de salvar ou remover (para recarregar a lista). */
  onSaved: () => void
}

const formFrom = (child: KidChild | null, uid: string): ChildFormValues => ({
  name: child?.name ?? '',
  birth_date: child?.birth_date ?? '',
  health: { ...(child?.health ?? {}) },
  notes: child?.notes ?? '',
  photo_consent: child?.photo_consent ?? false,
  guardian_uids: child ? [...child.guardian_uids] : [uid],
})

export function KidFormModal({ open, onOpenChange, child, onSaved }: KidFormModalProps) {
  const { currentUser } = useAuth()
  const { confirm } = useMessages()
  const uid = currentUser?.uid ?? ''
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<ChildFormValues>(() => formFrom(child, uid))
  const [errors, setErrors] = useState<ChildFormErrors>({})
  const [saving, setSaving] = useState(false)
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [cropperOpen, setCropperOpen] = useState(false)

  // Cada abertura começa do cadastro atual (ou vazio)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setForm(formFrom(child, uid))
      setErrors({})
      setPhoto(null)
      setPhotoPreview(null)
    }
  }

  useEffect(() => {
    if (!photoPreview) return
    return () => URL.revokeObjectURL(photoPreview)
  }, [photoPreview])

  const today = kidsToday()
  const update = (patch: Partial<ChildFormValues>) => setForm((f) => ({ ...f, ...patch }))

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Formato inválido', { description: 'Por favor, selecione uma imagem.' })
      return
    }
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setImageToCrop(reader.result as string)
      setCropperOpen(true)
    })
    reader.readAsDataURL(file)
  }

  const save = async () => {
    const found = validateChild(form, today)
    setErrors(found)
    if (hasErrors(found) || !uid) return

    setSaving(true)
    try {
      const fields = toChildFields(form)
      let id = child?.id
      if (id) await updateChild(id, fields)
      else id = await createChild(fields, uid)

      if (photo) {
        try {
          await setChildPhoto(id, photo)
        } catch (error) {
          console.error(error)
          toast.error('Foto não enviada, tente de novo.')
        }
      }
      toast.success(child ? 'Cadastro atualizado' : 'Criança cadastrada')
      onSaved()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível salvar. Verifique sua conexão.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!child) return
    const confirmed = await confirm({
      title: 'Remover criança',
      description: `O cadastro e o prontuário de ${child.name} serão apagados.`,
      confirmText: 'Remover',
      destructive: true,
    })
    if (!confirmed) return
    try {
      await deleteChild(child.id)
      toast.success('Cadastro removido')
      onSaved()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível remover. Verifique sua conexão.')
    }
  }

  const validBirth = isValidDate(form.birth_date) && form.birth_date <= today

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent variant="sheet" className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-base font-black md:text-xl">
              {child ? child.name : 'Nova criança'}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Só você, os outros responsáveis, a equipe Kids, a secretaria e o pastor veem estas informações.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative rounded-full transition-transform active:scale-95"
                aria-label="Escolher foto"
              >
                <UserAvatar src={photoPreview ?? child?.photo_url} name={form.name} size={72} />
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-white shadow-lg">
                  <Camera className="h-3.5 w-3.5" />
                </span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
              <p className="text-xs text-slate-500">Uma foto ajuda a equipe Kids a reconhecer a criança.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input
                  value={form.name}
                  maxLength={MAX_CHILD_NAME}
                  onChange={(e) => update({ name: e.target.value })}
                  aria-invalid={!!errors.name}
                  className={cn('rounded-xl', errors.name && 'border-red-500')}
                />
                {errors.name && <p className="text-xs font-medium text-red-500">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Data de nascimento</Label>
                <Input
                  type="date"
                  max={today}
                  value={form.birth_date}
                  onChange={(e) => update({ birth_date: e.target.value })}
                  aria-invalid={!!errors.birth_date}
                  className={cn('rounded-xl', errors.birth_date && 'border-red-500')}
                />
                {errors.birth_date ? (
                  <p className="text-xs font-medium text-red-500">{errors.birth_date}</p>
                ) : (
                  validBirth && (
                    <p className="text-xs text-slate-500">
                      {formatAge(form.birth_date, today)} · sala {roomLabelOf(form.birth_date, today)}
                    </p>
                  )
                )}
              </div>
            </div>

            <HealthChips
              health={form.health}
              onChange={(health) => update({ health })}
              photoConsent={form.photo_consent}
              onPhotoConsentChange={(photo_consent) => update({ photo_consent })}
              errors={errors.health}
            />

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                value={form.notes}
                maxLength={MAX_CHILD_NOTES}
                onChange={(e) => update({ notes: e.target.value })}
                placeholder="Algo mais que a equipe Kids deve saber?"
                className="min-h-[96px] rounded-xl"
              />
              <p className="text-right text-[11px] text-slate-400">
                {form.notes.length}/{MAX_CHILD_NOTES}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Responsáveis</Label>
              <GuardiansField
                currentUid={uid}
                guardianUids={form.guardian_uids}
                onChange={(guardian_uids) => update({ guardian_uids })}
                error={errors.guardians}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={save}
              disabled={saving}
              className="h-11 w-full rounded-xl bg-amber-600 px-8 font-black text-white shadow-lg shadow-amber-500/25 hover:bg-amber-700 active:scale-95 sm:w-auto"
            >
              {saving ? <HebromSpinner size="sm" className="brightness-200" /> : 'Salvar'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-11 w-full rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 sm:w-auto"
            >
              Cancelar
            </Button>
            {child && (
              <Button
                type="button"
                variant="ghost"
                onClick={remove}
                className="h-11 w-full gap-2 rounded-xl font-bold text-red-600 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20 sm:order-first sm:mr-auto sm:w-auto"
              >
                <Trash2 className="h-4 w-4" /> Remover criança
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          open={cropperOpen}
          onOpenChange={setCropperOpen}
          onCropComplete={(blob) => {
            setPhoto(blob)
            setPhotoPreview(URL.createObjectURL(blob))
          }}
          title="Foto da criança"
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Criar `src/app/(protected)/dashboard/profile/components/MyChildrenSection.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Baby, Plus } from 'lucide-react'
import { KidCard } from '@/components/kids/KidCard'
import { KidFormModal } from '@/components/kids/KidFormModal'
import { useAuth } from '@/store/useAuth'
import { useMyChildren } from '@/store/useMyChildren'
import type { KidChild } from '@/types'

export function MyChildrenSection() {
  const { currentUser } = useAuth()
  const { children, status, load, refresh } = useMyChildren()
  // A criança fica guardada ao fechar, para o modal não esvaziar durante a animação de saída
  const [modal, setModal] = useState<{ open: boolean; child: KidChild | null }>({ open: false, child: null })

  useEffect(() => {
    if (currentUser) load(currentUser.uid)
  }, [currentUser, load])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white md:text-lg">
        <Baby className="h-5 w-5 text-amber-500" />
        Crianças sob minha responsabilidade
      </h3>
      <p className="mb-5 text-sm text-slate-500">
        A equipe Kids usa estas informações para cuidar do seu filho durante o culto.
      </p>

      {status === 'error' && (
        <p className="mb-4 text-sm text-red-500">Não foi possível carregar as crianças agora.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {children.map((child) => (
          <KidCard key={child.id} child={child} onClick={() => setModal({ open: true, child })} />
        ))}
        <button
          type="button"
          onClick={() => setModal({ open: true, child: null })}
          className="flex min-h-[74px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-500 transition-colors hover:border-amber-400 hover:text-amber-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-amber-400"
        >
          <Plus className="h-4 w-4" />
          Adicionar criança
        </button>
      </div>

      <KidFormModal
        open={modal.open}
        child={modal.child}
        onOpenChange={(open) => setModal((m) => ({ ...m, open }))}
        onSaved={refresh}
      />
    </div>
  )
}
```

- [ ] **Step 3: Incluir a seção no perfil** — em `src/app/(protected)/dashboard/profile/page.tsx`:

1. Acrescentar o import junto dos outros:
```ts
import { MyChildrenSection } from './components/MyChildrenSection'
```
2. Localizar o fim do card "Dados Ministeriais" — o trecho

```tsx
                  haja alguma inconsistência, entre em contato.
                </p>
              </div>
            </div>
          </div>
        </div>
```

e trocar por (a seção entra dentro da mesma coluna, logo depois do card):

```tsx
                  haja alguma inconsistência, entre em contato.
                </p>
              </div>
            </div>
          </div>

          <MyChildrenSection />
        </div>
```

Conferir antes de editar que a `</div>` logo após o card fecha a coluna da esquerda (a próxima linha não vazia é `<div className="space-y-6">` da coluna "Dica de Perfil"). Se a coluna da esquerda não tiver `space-y-*`, acrescentar `space-y-6` à classe dela para manter o espaçamento entre os cards.

- [ ] **Step 4: Verificar**

Run: `npm run test:kids && npx tsc --noEmit && npx eslint src/components/kids "src/app/(protected)/dashboard/profile"`
Expected: testes PASS; `tsc` sem saída; eslint sem erros (avisos antigos do `profile/page.tsx` aceitos).

- [ ] **Step 5: Sem commit.** Seguir para a Task 7.

---

### Task 7: Ficha em leitura e aba Kids em Membros

**Files:**
- Create: `src/components/kids/KidDetailModal.tsx`, `src/app/(protected)/dashboard/members/components/MembersTabs.tsx`, `src/app/(protected)/dashboard/members/kids/page.tsx`
- Modify: `src/app/(protected)/dashboard/members/page.tsx`

**Interfaces:**
- Consumes: `entriesOf`, `alertsOf` (Task 2); `formatAge`, `roomLabelOf`, `suggestRoom`, `ROOMS`, `RoomId` (Task 1); `matchesKidSearch` (Task 3); `useKidsStore` (Task 4); `KidCard`, `kidsToday` (Task 5); `useMembersStore` (`members`, `loaded`, `startListening`); `formatPhone`, `whatsappUrl` de `@/lib/utils`; `ROUTES.AUTHENTICATED.MEMBERS`; `PermissionGuard`.
- Produces: `KidDetailModal({ child: KidChild | null; open: boolean; onOpenChange: (open: boolean) => void; guardianOf: (uid: string) => AppUser | undefined; guardiansLoaded: boolean })`; `MembersTabs()`; `MEMBERS_KIDS_HREF = '/dashboard/members/kids'`; página `/dashboard/members/kids`.

- [ ] **Step 1: Criar `src/components/kids/KidDetailModal.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { AlertTriangle, MessageCircle, Phone } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { formatAge } from '@/lib/kids/age'
import { entriesOf } from '@/lib/kids/health'
import { roomLabelOf } from '@/lib/kids/rooms'
import { formatPhone, whatsappUrl } from '@/lib/utils'
import { ROUTES } from '@/paths'
import type { AppUser, KidChild } from '@/types'
import { kidsToday } from './kids-today'

interface KidDetailModalProps {
  /** Mantida pelo pai durante o fechamento, para o conteúdo não sumir na animação. */
  child: KidChild | null
  open: boolean
  onOpenChange: (open: boolean) => void
  guardianOf: (uid: string) => AppUser | undefined
  /** Enquanto a lista de membros carrega, não dá para afirmar que um responsável foi removido. */
  guardiansLoaded: boolean
}

/** Ficha da criança em modo leitura (secretaria/pastor). */
export function KidDetailModal({ child, open, onOpenChange, guardianOf, guardiansLoaded }: KidDetailModalProps) {
  const today = kidsToday()
  const entries = child ? entriesOf(child.health) : []
  const alerts = entries.filter((e) => e.alert)
  const others = entries.filter((e) => !e.alert)
  const describe = (e: (typeof entries)[number]) => (e.detail ? `${e.label}: ${e.detail}` : e.label)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="sheet" className="sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <UserAvatar src={child?.photo_url} name={child?.name} size={64} />
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-black md:text-xl">{child?.name ?? ''}</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                {child ? `${formatAge(child.birth_date, today)} · ${roomLabelOf(child.birth_date, today)}` : ''}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {child && (
          <div className="space-y-5">
            {alerts.length > 0 && (
              <div className="space-y-1 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-900/15">
                <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-3.5 w-3.5" /> Alertas
                </p>
                {alerts.map((e) => (
                  <p key={e.id} className="text-sm font-semibold text-red-700 dark:text-red-300">
                    {describe(e)}
                  </p>
                ))}
              </div>
            )}

            <Section title="Cuidados e restrições">
              {others.length ? (
                <div className="flex flex-wrap gap-2">
                  {others.map((e) => (
                    <span
                      key={e.id}
                      className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                    >
                      {describe(e)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Nenhum item marcado.</p>
              )}
            </Section>

            {child.notes && (
              <Section title="Observações">
                <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{child.notes}</p>
              </Section>
            )}

            <Section title="Autorizações">
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {child.photo_consent ? 'Pode ser fotografada para as redes da igreja.' : 'Não autorizada a ser fotografada.'}
              </p>
            </Section>

            <Section title="Responsáveis">
              <ul className="space-y-2">
                {child.guardian_uids.map((uid) => {
                  const guardian = guardianOf(uid)
                  if (!guardian) {
                    return (
                      <li key={uid} className="text-sm text-slate-400">
                        {guardiansLoaded ? 'Responsável removido' : '…'}
                      </li>
                    )
                  }
                  const phone = guardian.profile.phone
                  const whatsapp = whatsappUrl(phone)
                  return (
                    <li
                      key={uid}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 p-2 dark:border-slate-800"
                    >
                      <UserAvatar src={guardian.profile.avatar_url} name={guardian.profile.full_name} size={40} />
                      <Link
                        href={`${ROUTES.AUTHENTICATED.MEMBERS}/${uid}`}
                        onClick={() => onOpenChange(false)}
                        className="min-w-0 flex-1"
                      >
                        <span className="block truncate text-sm font-bold text-slate-900 hover:text-amber-700 dark:text-white">
                          {guardian.profile.full_name}
                        </span>
                        <span className="block text-xs text-slate-500">{formatPhone(phone)}</span>
                      </Link>
                      {phone && (
                        <a
                          href={`tel:${phone.replace(/\D/g, '')}`}
                          aria-label="Ligar"
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      {whatsapp && (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="WhatsApp"
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Criar `src/app/(protected)/dashboard/members/components/MembersTabs.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Baby, Users } from 'lucide-react'
import { ROUTES } from '@/paths'
import { cn } from '@/lib/utils'

export const MEMBERS_KIDS_HREF = `${ROUTES.AUTHENTICATED.MEMBERS}/kids`

const TABS = [
  { label: 'Membros', href: ROUTES.AUTHENTICATED.MEMBERS, icon: Users },
  { label: 'Kids', href: MEMBERS_KIDS_HREF, icon: Baby },
]

/** Abas Membros | Kids — cada aba é uma rota. */
export function MembersTabs() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Seção Membros"
      className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800 md:w-[440px]"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-all md:h-12 md:text-base',
              active
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                : 'text-slate-500 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-white',
            )}
          >
            <Icon className="h-4 w-4 shrink-0 md:h-5 md:w-5" />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 3: Incluir as abas em Membros** — em `src/app/(protected)/dashboard/members/page.tsx`:

1. Import: `import { MembersTabs } from './components/MembersTabs'`
2. Trocar

```tsx
    <PermissionGuard permission="canManageUsers">
      <div className="space-y-6">
```

por

```tsx
    <PermissionGuard permission="canManageUsers">
      <div className="space-y-6">
        <MembersTabs />
```

- [ ] **Step 4: Criar `src/app/(protected)/dashboard/members/kids/page.tsx`**

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Baby, Filter, Search } from 'lucide-react'
import { toast } from 'sonner'
import { PermissionGuard } from '@/components/PermissionGuard'
import { KidCard } from '@/components/kids/KidCard'
import { KidDetailModal } from '@/components/kids/KidDetailModal'
import { kidsToday } from '@/components/kids/kids-today'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { Input } from '@/components/ui/input'
import { PageTitle } from '@/components/ui/page-title'
import { alertsOf } from '@/lib/kids/health'
import { ROOMS, suggestRoom, type RoomId } from '@/lib/kids/rooms'
import { matchesKidSearch } from '@/lib/kids/stats'
import { useKidsStore } from '@/store/useKidsStore'
import { useMembersStore } from '@/store/useMembersStore'
import { MembersTabs } from '../components/MembersTabs'

type KidFilter = 'all' | RoomId | 'alerts'

const FILTERS: { id: KidFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  ...ROOMS.map((room) => ({ id: room.id, label: room.label })),
  { id: 'alerts', label: 'Com alertas' },
]

export default function MembersKidsPage() {
  const children = useKidsStore((s) => s.children)
  const loaded = useKidsStore((s) => s.loaded)
  const listenerError = useKidsStore((s) => s.error)
  const startKids = useKidsStore((s) => s.startListening)
  const members = useMembersStore((s) => s.members)
  const membersLoaded = useMembersStore((s) => s.loaded)
  const startMembers = useMembersStore((s) => s.startListening)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<KidFilter>('all')
  // id fica guardado ao fechar, para a ficha não esvaziar durante a animação de saída
  const [detail, setDetail] = useState<{ id: string | null; open: boolean }>({ id: null, open: false })

  useEffect(() => {
    startKids()
    startMembers()
  }, [startKids, startMembers])

  useEffect(() => {
    if (listenerError) toast.error('Erro ao carregar crianças')
  }, [listenerError])

  const memberById = useMemo(() => new Map(members.map((m) => [m.uid, m])), [members])
  const guardianNames = (uids: string[]) =>
    uids.map((uid) => memberById.get(uid)?.profile.full_name).filter((n): n is string => !!n)

  const today = kidsToday()
  const filtered = useMemo(
    () =>
      children
        .filter((child) => {
          if (filter === 'alerts' && alertsOf(child.health).length === 0) return false
          if (filter !== 'all' && filter !== 'alerts' && suggestRoom(child.birth_date, today)?.id !== filter) return false
          const names = child.guardian_uids
            .map((uid) => memberById.get(uid)?.profile.full_name)
            .filter((n): n is string => !!n)
          return matchesKidSearch(search, [child.name, ...names])
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [children, filter, search, memberById, today],
  )

  const selected = children.find((c) => c.id === detail.id) ?? null

  return (
    <PermissionGuard permission="canManageUsers">
      <div className="space-y-6">
        <MembersTabs />
        <PageTitle
          title="Kids"
          description="Crianças cadastradas pelos responsáveis."
        />

        <div className="flex flex-col items-center gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row">
          <div className="relative w-full flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por criança ou responsável..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-xl bg-white pl-10 dark:bg-slate-900"
            />
          </div>
          <div className="no-scrollbar -mx-4 w-full overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0 md:w-auto">
            <div className="flex min-w-max items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Filter className="h-4 w-4" />
              </div>
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 md:text-xs ${
                    filter === f.id
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20 dark:shadow-none'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!loaded ? (
          <div className="flex justify-center py-20">
            <HebromSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
            <Baby className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">
              {children.length === 0 ? 'Nenhuma criança cadastrada ainda.' : 'Nenhuma criança encontrada.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((child) => {
              const names = guardianNames(child.guardian_uids)
              return (
                <KidCard
                  key={child.id}
                  child={child}
                  subtitle={names.length ? `Responsáveis: ${names.join(' e ')}` : undefined}
                  onClick={() => setDetail({ id: child.id, open: true })}
                />
              )
            })}
          </div>
        )}

        <KidDetailModal
          child={selected}
          open={detail.open && !!selected}
          onOpenChange={(open) => setDetail((d) => ({ ...d, open }))}
          guardianOf={(uid) => memberById.get(uid)}
          guardiansLoaded={membersLoaded}
        />
      </div>
    </PermissionGuard>
  )
}
```

- [ ] **Step 5: Verificar**

Run: `npm run test:kids && npx tsc --noEmit && npx eslint src/components/kids "src/app/(protected)/dashboard/members"`
Expected: testes PASS; `tsc` sem saída; eslint sem erros (avisos antigos aceitos).

- [ ] **Step 6: Sem commit.** Seguir para a Task 8.

---

### Task 8: Card no Dashboard, registro das regras e verificação final

**Files:**
- Modify: `src/app/(protected)/dashboard/page.tsx`, `AGENTS.md` (deste pacote `web/`)

**Interfaces:**
- Consumes: `useKidsStore` (Task 4); `countByRoom` (Task 3); `kidsToday` (Task 5); `MEMBERS_KIDS_HREF` (Task 7).

- [ ] **Step 1: Dashboard** — em `src/app/(protected)/dashboard/page.tsx`:

1. Imports: acrescentar `Baby` à lista de ícones de `lucide-react`, e:
```ts
import Link from 'next/link'
import { kidsToday } from '@/components/kids/kids-today'
import { countByRoom } from '@/lib/kids/stats'
import { useKidsStore } from '@/store/useKidsStore'
import { MEMBERS_KIDS_HREF } from './members/components/MembersTabs'
```
2. No `StatCardProps`, acrescentar `subText?: string`; no `StatCard`, desestruturar `subText` e, logo depois do bloco `{subValue !== undefined && (...)}`, acrescentar:
```tsx
        {subText && <p className="mt-1 text-xs text-slate-500">{subText}</p>}
```
3. Dentro do componente da página, depois da linha `const { permissions, isPastor } = usePermissions()`:
```tsx
  const kids = useKidsStore((s) => s.children)
  const startKids = useKidsStore((s) => s.startListening)
  useEffect(() => {
    if (permissions.canViewDashboardOverview) startKids()
  }, [permissions.canViewDashboardOverview, startKids])
  const kidCounts = useMemo(() => countByRoom(kids, kidsToday()), [kids])
```
(Se esse trecho ficar antes de algum `return` antecipado, ok; ele precisa estar antes do `if (!permissions.canViewDashboardOverview) return null` para respeitar a ordem dos hooks.)
4. Logo depois do bloco do `StatCard` "Total de Membros" (o `{permissions.canViewMetrics && (...)}` que termina em `)}`), acrescentar:
```tsx
        <Link href={MEMBERS_KIDS_HREF} className="block">
          <StatCard
            title="Crianças cadastradas"
            value={kidCounts.total}
            icon={Baby}
            colorClass="text-amber-500"
            subText={`${kidCounts.bercario} berçário · ${kidCounts.kids} kids · ${kidCounts.juniores} juniores`}
          />
        </Link>
```
5. Na grade dos cards, trocar `grid gap-6 md:grid-cols-2 lg:grid-cols-4` por `grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`.

- [ ] **Step 2: Registrar as regras pendentes** — em `web/AGENTS.md`, ao fim da lista "Riscos de segurança conhecidos (não resolvidos)", acrescentar:

```md
- `kids_children` guarda **dados de saúde de crianças** (Área Kids): a privacidade depende das regras do Firestore e do Storage descritas em `docs/superpowers/specs/2026-10-14-kids-cadastro-design.md` (seção "Privacidade") estarem aplicadas no console. A foto (`kids/{childId}.jpg`) aceita escrita de qualquer usuário autenticado — risco aceito.
```

- [ ] **Step 3: Verificação completa**

Run: `npm run test:kids && npm run test:bible && npx tsc --noEmit && npm run lint`
Expected: testes PASS; `tsc` sem saída; lint com **0 errors** (avisos antigos aceitos).

- [ ] **Step 4: Sem commit.** Entregar ao usuário a lista de arquivos alterados (`git status --short`) e o roteiro de teste no aparelho:

- Perfil → "Crianças sob minha responsabilidade" → Adicionar criança → foto, nome, nascimento (ver idade e sala), marcar "Alergia alimentar" e digitar "amendoim", salvar.
- Tentar salvar com "Alergia alimentar" marcada e vazia → campo vermelho "Informe qual."
- Adicionar responsável pelo e-mail de outra conta → confirmar → salvar; entrar com a outra conta e ver a criança no perfil.
- Editar → remover criança → confirmação → some da lista.
- Com conta de secretaria/pastor: Membros → aba Kids → filtro "Com alertas" → abrir a ficha → Ligar/WhatsApp do responsável.
- Dashboard → card "Crianças cadastradas" com a divisão por sala → toque leva a Membros → Kids.
- Aplicar no console as regras do Firestore e do Storage da spec.
