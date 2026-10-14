# Bíblia — marcadores de trecho e anotações — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir marcar trechos (vários versículos de um capítulo) com nota opcional no leitor da Bíblia, e listar os marcadores agrupados por livro na tela principal.

**Architecture:** Toda a regra (formato, fusão, limites, agrupamento) fica em funções puras em `src/lib/bible/bookmarks.ts`, testadas com `node --test`. A camada Firebase (`services/firebase/bible.ts`) e a store Zustand (`useBibleBookmarks`) só aplicam essas funções — a store de forma otimista, o serviço dentro de uma transação no documento `bible_bookmarks/{uid}`. A UI do leitor ganha seleção múltipla com barra flutuante e dois sheets (`Dialog variant="sheet"`); a tela principal troca o carrossel por cards por livro + modal.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4, Firebase JS SDK v12 (Firestore), Zustand, `node --test` (type stripping do Node 24), lucide-react, sonner.

**Spec:** `docs/superpowers/specs/2026-10-14-biblia-marcadores-notas-design.md`

## Global Constraints

- Todos os comandos rodam de dentro de `web/` (o repositório git é a pasta pai `D:\Code\hebrom-sys`).
- `src/lib/bible/*.ts` é importado pelos testes `node --test`: só imports **relativos com extensão `.ts`**, nada de `@/`, nada de Firebase/React, nada de sintaxe TS não-apagável (enum, parameter properties, namespace).
- Armazenamento: documento `bible_bookmarks/{uid}`, campo `items`, `updated_at: serverTimestamp()`.
- Datas dentro de `items` usam `Timestamp.now()` (serverTimestamp não resolve em arrays — `AGENTS.md`).
- O Firestore recusa campos `undefined`: um marcador sem nota **não tem a chave `note`**; sem edição, **não tem a chave `updated_at`**.
- `MAX_BIBLE_BOOKMARKS = 200`; `MAX_BOOKMARK_NOTE_LENGTH = 2000`.
- Mensagens exatas: limite → `Limite de 200 marcadores atingido. Remova algum para continuar.`; nota unida longa → `A nota unida passaria de 2.000 caracteres. Encurte a anotação antes de unir.`; confirmação de remoção com nota → `A anotação deste trecho também será apagada.`
- Modais/sheets: `Dialog` com `variant="sheet"`; botões no padrão do app — ação principal âmbar primeiro, "Cancelar" `variant="ghost"` sem borda depois.
- Não rodar o app (`npm run dev`) para verificar: verificar com `npm run test:bible`, `npx tsc --noEmit` e `npx eslint <arquivos>`; o usuário testa no aparelho.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Marcador sem nota gravado com `note: undefined` → o Firestore lança erro e nada salva; esperado: a chave não existe (teste na Task 2).
2. Nota só com espaços/quebras de linha → esperado: tratada como sem nota, chave ausente (testes nas Tasks 2 e 3).
3. URL `?v=1-100000` ou `?v=abc` digitada/compartilhada → esperado: ignorada sem travar a página (teste na Task 1).
4. Marcador removido em outro aparelho e editado neste → esperado: `setNote`/remoção sobre `id` inexistente não quebram e devolvem a lista sem mudança (teste na Task 3).
5. Seleção em ordem de toque (7, 1, 3) → esperado: referência, cópia e gravação sempre em ordem crescente (testes nas Tasks 1, 2 e 3).

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/bible/types.ts` (modificar) | `TimestampLike`, `BibleBookmark<T>` (formato de trecho) |
| `src/lib/bible/bookmarks.ts` (novo) | regras puras: formatação, parse de `?v=`, normalização, fusão, nota, agrupamento, citação, href |
| `src/lib/bible/bookmarks.test.ts` (novo) | testes das regras |
| `src/types/index.ts` (modificar) | `BibleBookmark` do app = `BibleBookmark<Timestamp>` |
| `src/services/firebase/bible.ts` (modificar) | transação: `saveSelection`, `updateNote`, `removeBookmark(id)` |
| `src/store/useBibleBookmarks.ts` (modificar) | otimista + rollback + toasts |
| `src/app/(protected)/dashboard/bible/[book]/[chapter]/page.tsx` (modificar) | `?v=` com trecho → `focusVerses` |
| `src/app/(protected)/dashboard/bible/components/NoteEditor.tsx` (novo) | campo de nota com contador |
| `.../components/SelectionBar.tsx` (novo) | barra flutuante da seleção |
| `.../components/VerseActionsSheet.tsx` (novo) | ações de uma seleção nova |
| `.../components/BookmarkSheet.tsx` (novo) | nota/editar/remover de um marcador existente |
| `.../components/ChapterReader.tsx` (modificar) | seleção, estados visuais, destaque de trecho |
| `.../components/BookmarksByBook.tsx` (novo) | cards por livro |
| `.../components/BookBookmarksModal.tsx` (novo) | lista do livro com notas |
| `.../components/BookmarksStrip.tsx` (remover) | substituído por `BookmarksByBook` |
| `src/app/(protected)/dashboard/bible/page.tsx` (modificar) | usa `BookmarksByBook` |

---

### Task 1: Tipos e funções de formatação/leitura

**Files:**
- Modify: `src/lib/bible/types.ts`
- Create: `src/lib/bible/bookmarks.ts`
- Test: `src/lib/bible/bookmarks.test.ts`

**Interfaces:**
- Produces (em `types.ts`):
  - `interface TimestampLike { toMillis(): number }`
  - `interface BibleBookmark<T extends TimestampLike = TimestampLike> { id: string; bookId: string; chapter: number; verses: number[]; note?: string; created_at: T; updated_at?: T }`
- Produces (em `bookmarks.ts`):
  - `MAX_BIBLE_BOOKMARKS = 200`, `MAX_BOOKMARK_NOTE_LENGTH = 2000`
  - `interface VerseSelection { bookId: string; chapter: number; verses: number[] }`
  - `sortedUnique(verses: number[]): number[]`
  - `cleanNote(note: string | undefined): string | undefined`
  - `formatVerses(verses: number[]): string` — `[1,2,3,7]` → `"1-3, 7"`
  - `formatBookmarkRef(sel: VerseSelection): string` — `"Levítico 27:1-3, 7"`
  - `parseVerseParam(param: string | undefined): number[]`
  - `normalizeBookmarks<T extends TimestampLike>(raw: unknown): BibleBookmark<T>[]`
  - `findBookmarkForVerse<T extends TimestampLike>(items: BibleBookmark<T>[], bookId: string, chapter: number, verse: number): BibleBookmark<T> | null`

- [ ] **Step 1: Adicionar os tipos em `src/lib/bible/types.ts`** (ao final do arquivo)

```ts
/** O que as regras precisam de um Timestamp do Firestore (permite testar sem Firebase). */
export interface TimestampLike {
  toMillis(): number
}

/** Marcador de trecho: versículos de um único capítulo, com nota opcional. */
export interface BibleBookmark<T extends TimestampLike = TimestampLike> {
  id: string
  bookId: string
  chapter: number
  /** Ordenado crescente, sem repetição, pelo menos 1. */
  verses: number[]
  /** Ausente = sem nota (o Firestore recusa `undefined`). */
  note?: string
  created_at: T
  updated_at?: T
}
```

- [ ] **Step 2: Escrever os testes que falham** — criar `src/lib/bible/bookmarks.test.ts`

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  cleanNote,
  findBookmarkForVerse,
  formatBookmarkRef,
  formatVerses,
  normalizeBookmarks,
  parseVerseParam,
} from './bookmarks.ts'
import type { BibleBookmark, TimestampLike } from './types.ts'

const ts = (ms: number): TimestampLike => ({ toMillis: () => ms })

const bm = (over: Partial<BibleBookmark> & Pick<BibleBookmark, 'id' | 'verses'>): BibleBookmark => ({
  bookId: 'LEV',
  chapter: 27,
  created_at: ts(1000),
  ...over,
})

test('formatVerses agrupa sequências', () => {
  assert.equal(formatVerses([7]), '7')
  assert.equal(formatVerses([1, 2, 3]), '1-3')
  assert.equal(formatVerses([1, 2, 3, 7]), '1-3, 7')
  assert.equal(formatVerses([1, 3, 5]), '1, 3, 5')
  assert.equal(formatVerses([7, 1, 3, 2]), '1-3, 7')
  assert.equal(formatVerses([]), '')
})

test('formatBookmarkRef usa o nome do livro', () => {
  assert.equal(formatBookmarkRef({ bookId: 'LEV', chapter: 27, verses: [3, 1, 2, 7] }), 'Levítico 27:1-3, 7')
  assert.equal(formatBookmarkRef({ bookId: 'JHN', chapter: 3, verses: [16] }), 'João 3:16')
})

test('parseVerseParam aceita versículo e trecho', () => {
  assert.deepEqual(parseVerseParam('3'), [3])
  assert.deepEqual(parseVerseParam('1-3,7'), [1, 2, 3, 7])
  assert.deepEqual(parseVerseParam('7,1-2'), [1, 2, 7])
})

test('parseVerseParam ignora entradas inválidas ou enormes', () => {
  assert.deepEqual(parseVerseParam(undefined), [])
  assert.deepEqual(parseVerseParam(''), [])
  assert.deepEqual(parseVerseParam('abc'), [])
  assert.deepEqual(parseVerseParam('3-1'), [])
  assert.deepEqual(parseVerseParam('1-100000'), [])
  assert.deepEqual(parseVerseParam('1,,2'), [])
  assert.deepEqual(parseVerseParam('0'), [])
})

test('cleanNote apara e trata vazio como sem nota', () => {
  assert.equal(cleanNote('  oi  '), 'oi')
  assert.equal(cleanNote('   \n  '), undefined)
  assert.equal(cleanNote(undefined), undefined)
})

test('normalizeBookmarks converte o formato antigo', () => {
  const created = ts(5)
  const [item] = normalizeBookmarks([{ ref: 'LEV.27.1', created_at: created }])
  assert.deepEqual(item, { id: 'LEV.27.1', bookId: 'LEV', chapter: 27, verses: [1], created_at: created })
  assert.equal('note' in item, false)
})

test('normalizeBookmarks preserva o formato novo e ordena versículos', () => {
  const created = ts(5)
  const updated = ts(9)
  const [item] = normalizeBookmarks([
    { id: 'a', bookId: 'LEV', chapter: 27, verses: [3, 1, 3], note: ' nota ', created_at: created, updated_at: updated },
  ])
  assert.deepEqual(item, { id: 'a', bookId: 'LEV', chapter: 27, verses: [1, 3], note: 'nota', created_at: created, updated_at: updated })
})

test('normalizeBookmarks descarta itens inválidos', () => {
  const created = ts(5)
  assert.deepEqual(
    normalizeBookmarks([
      { ref: 'XXX.1.1', created_at: created },
      { ref: 'LEV.27.99', created_at: created },
      { id: 'b', bookId: 'LEV', chapter: 27, verses: [], created_at: created },
      { id: 'c', bookId: 'LEV', chapter: 27, verses: [999], created_at: created },
      { id: 'd', bookId: 'LEV', chapter: 27, verses: [1] },
      null,
      'lixo',
    ]),
    [],
  )
  assert.deepEqual(normalizeBookmarks(undefined), [])
})

test('normalizeBookmarks remove nota só com espaços', () => {
  const [item] = normalizeBookmarks([{ id: 'a', bookId: 'LEV', chapter: 27, verses: [1], note: '   ', created_at: ts(1) }])
  assert.equal('note' in item, false)
})

test('findBookmarkForVerse encontra só no mesmo capítulo', () => {
  const items = [bm({ id: 'a', verses: [1, 2, 3] }), bm({ id: 'b', verses: [7] })]
  assert.equal(findBookmarkForVerse(items, 'LEV', 27, 2)?.id, 'a')
  assert.equal(findBookmarkForVerse(items, 'LEV', 27, 7)?.id, 'b')
  assert.equal(findBookmarkForVerse(items, 'LEV', 27, 5), null)
  assert.equal(findBookmarkForVerse(items, 'LEV', 26, 2), null)
  assert.equal(findBookmarkForVerse(items, 'JHN', 27, 2), null)
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm run test:bible`
Expected: FAIL — `Cannot find module '.../bookmarks.ts'`.

- [ ] **Step 4: Implementar** — criar `src/lib/bible/bookmarks.ts`

```ts
import { findBookById, isValidVerse, parseRefKey } from './catalog.ts'
import type { BibleBookmark, TimestampLike } from './types.ts'

export const MAX_BIBLE_BOOKMARKS = 200
export const MAX_BOOKMARK_NOTE_LENGTH = 2000
/** Maior trecho aceito num `?v=` (o maior capítulo da Bíblia tem 176 versículos). */
const MAX_VERSE_RANGE = 200

export interface VerseSelection {
  bookId: string
  chapter: number
  verses: number[]
}

export const sortedUnique = (verses: number[]) => [...new Set(verses)].sort((a, b) => a - b)

/** Nota aparada; vazia ou só espaços vira "sem nota". */
export function cleanNote(note: string | undefined): string | undefined {
  const trimmed = note?.trim()
  return trimmed ? trimmed : undefined
}

/** Monta o marcador sem chaves `undefined` (o Firestore recusa `undefined`). */
export function buildBookmark<T extends TimestampLike>(fields: {
  id: string
  bookId: string
  chapter: number
  verses: number[]
  note?: string
  created_at: T
  updated_at?: T
}): BibleBookmark<T> {
  const { note, updated_at, ...rest } = fields
  return {
    ...rest,
    ...(note ? { note } : {}),
    ...(updated_at ? { updated_at } : {}),
  }
}

/** [1, 2, 3, 7] → "1-3, 7" */
export function formatVerses(verses: number[]): string {
  const sorted = sortedUnique(verses)
  if (!sorted.length) return ''
  const parts: string[] = []
  let start = sorted[0]
  let prev = sorted[0]
  for (const verse of sorted.slice(1)) {
    if (verse === prev + 1) {
      prev = verse
      continue
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`)
    start = verse
    prev = verse
  }
  parts.push(start === prev ? `${start}` : `${start}-${prev}`)
  return parts.join(', ')
}

/** "Levítico 27:1-3, 7" */
export function formatBookmarkRef(sel: VerseSelection): string {
  const name = findBookById(sel.bookId)?.name ?? sel.bookId
  return `${name} ${sel.chapter}:${formatVerses(sel.verses)}`
}

/** "1-3,7" → [1, 2, 3, 7]. Qualquer parte inválida invalida tudo (devolve []). */
export function parseVerseParam(param: string | undefined): number[] {
  if (!param) return []
  const verses: number[] = []
  for (const part of param.split(',')) {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part.trim())
    if (!match) return []
    const start = Number(match[1])
    const end = match[2] ? Number(match[2]) : start
    if (start < 1 || end < start || end - start > MAX_VERSE_RANGE) return []
    for (let v = start; v <= end; v++) verses.push(v)
  }
  return sortedUnique(verses)
}

const isTimestamp = (value: unknown): value is TimestampLike =>
  !!value && typeof (value as TimestampLike).toMillis === 'function'

/** Lê `items` do Firestore: converte o formato antigo `{ ref }` e descarta o que for inválido. */
export function normalizeBookmarks<T extends TimestampLike>(raw: unknown): BibleBookmark<T>[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item): BibleBookmark<T>[] => {
    if (!item || typeof item !== 'object') return []
    const r = item as Record<string, unknown>
    if (!isTimestamp(r.created_at)) return []
    const created_at = r.created_at as T

    // Formato antigo: um versículo por item, endereço "LEV.27.1"
    if (typeof r.ref === 'string') {
      const ref = parseRefKey(r.ref)
      if (!ref) return []
      return [buildBookmark({ id: r.ref, bookId: ref.bookId, chapter: ref.chapter, verses: [ref.verse], created_at })]
    }

    const book = typeof r.bookId === 'string' ? findBookById(r.bookId) : null
    const chapter = typeof r.chapter === 'number' ? r.chapter : NaN
    if (!book || typeof r.id !== 'string' || !Array.isArray(r.verses)) return []
    const verses = sortedUnique(
      r.verses.filter((v): v is number => typeof v === 'number' && isValidVerse(book, chapter, v)),
    )
    if (!verses.length) return []

    return [
      buildBookmark({
        id: r.id,
        bookId: book.id,
        chapter,
        verses,
        note: typeof r.note === 'string' ? cleanNote(r.note) : undefined,
        created_at,
        updated_at: isTimestamp(r.updated_at) ? (r.updated_at as T) : undefined,
      }),
    ]
  })
}

export function findBookmarkForVerse<T extends TimestampLike>(
  items: BibleBookmark<T>[],
  bookId: string,
  chapter: number,
  verse: number,
): BibleBookmark<T> | null {
  return items.find((b) => b.bookId === bookId && b.chapter === chapter && b.verses.includes(verse)) ?? null
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm run test:bible`
Expected: PASS (todos os testes, inclusive os antigos de `catalog`, `reference` e `search`).

- [ ] **Step 6: Commit**

```bash
git add src/lib/bible/types.ts src/lib/bible/bookmarks.ts src/lib/bible/bookmarks.test.ts
git commit -m "feat(biblia): tipos e formatação de marcadores de trecho

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Fusão de seleção (`mergeSelection`)

**Files:**
- Modify: `src/lib/bible/bookmarks.ts`
- Test: `src/lib/bible/bookmarks.test.ts`

**Interfaces:**
- Consumes: `buildBookmark`, `cleanNote`, `sortedUnique`, `MAX_*`, `VerseSelection` (Task 1).
- Produces:
  - `type BookmarkRuleError = 'limit' | 'note-too-long'`
  - `type BookmarkResult<T extends TimestampLike> = { ok: true; items: BibleBookmark<T>[] } | { ok: false; error: BookmarkRuleError }`
  - `overlappingBookmarks<T extends TimestampLike>(items: BibleBookmark<T>[], sel: VerseSelection): BibleBookmark<T>[]`
  - `mergeSelection<T extends TimestampLike>(items: BibleBookmark<T>[], sel: VerseSelection, options: { now: T; newId: string; note?: string }): BookmarkResult<T>`

- [ ] **Step 1: Escrever os testes que falham** — acrescentar a `bookmarks.test.ts`

Acrescentar `mergeSelection, overlappingBookmarks, MAX_BIBLE_BOOKMARKS` ao import de `./bookmarks.ts`, e então:

```ts
const sel = (verses: number[]) => ({ bookId: 'LEV', chapter: 27, verses })
const okItems = <T>(r: { ok: true; items: T[] } | { ok: false; error: string }) => {
  assert.equal(r.ok, true, 'esperava ok')
  return (r as { ok: true; items: T[] }).items
}

test('mergeSelection cria marcador novo sem chave note', () => {
  const now = ts(50)
  const items = okItems(mergeSelection([], sel([3, 1]), { now, newId: 'n1' }))
  assert.deepEqual(items, [{ id: 'n1', bookId: 'LEV', chapter: 27, verses: [1, 3], created_at: now }])
  assert.equal('note' in items[0], false)
  assert.equal('updated_at' in items[0], false)
})

test('mergeSelection grava nota aparada e ignora nota só com espaços', () => {
  const now = ts(50)
  assert.equal(okItems(mergeSelection([], sel([1]), { now, newId: 'n', note: '  boa  ' }))[0].note, 'boa')
  assert.equal('note' in okItems(mergeSelection([], sel([1]), { now, newId: 'n', note: ' \n ' }))[0], false)
})

test('mergeSelection funde com um marcador que encosta', () => {
  const now = ts(50)
  // Mesma instância nos dois lados: deepEqual compara as funções toMillis por referência
  const createdA = ts(10)
  const existing = bm({ id: 'a', verses: [2, 3], note: 'antiga', created_at: createdA })
  const other = bm({ id: 'z', chapter: 26, verses: [2] })
  const items = okItems(mergeSelection([existing, other], sel([1, 2]), { now, newId: 'n', note: 'nova' }))
  assert.equal(items.length, 2)
  const merged = items.find((i) => i.chapter === 27)!
  assert.deepEqual(merged, {
    id: 'a',
    bookId: 'LEV',
    chapter: 27,
    verses: [1, 2, 3],
    note: 'antiga\n\nnova',
    created_at: createdA,
    updated_at: now,
  })
})

test('mergeSelection funde dois marcadores mantendo id e data do mais antigo', () => {
  const now = ts(50)
  const a = bm({ id: 'a', verses: [5], note: 'cinco', created_at: ts(30) })
  const b = bm({ id: 'b', verses: [1], note: 'um', created_at: ts(20) })
  const items = okItems(mergeSelection([a, b], sel([1, 3, 5]), { now, newId: 'n' }))
  assert.equal(items.length, 1)
  assert.equal(items[0].id, 'b')
  assert.equal(items[0].created_at.toMillis(), 20)
  assert.deepEqual(items[0].verses, [1, 3, 5])
  assert.equal(items[0].note, 'um\n\ncinco')
})

test('overlappingBookmarks só pega o mesmo capítulo com versículo em comum', () => {
  const items = [bm({ id: 'a', verses: [1] }), bm({ id: 'b', verses: [4] }), bm({ id: 'c', chapter: 26, verses: [1] })]
  assert.deepEqual(overlappingBookmarks(items, sel([1, 2])).map((b) => b.id), ['a'])
})

test('mergeSelection bloqueia o marcador além do limite, mas permite fundir', () => {
  const full = Array.from({ length: MAX_BIBLE_BOOKMARKS }, (_, i) => bm({ id: `x${i}`, chapter: 1, verses: [1] }))
  full[0] = bm({ id: 'x0', verses: [1] })
  assert.deepEqual(mergeSelection(full, sel([9]), { now: ts(1), newId: 'n' }), { ok: false, error: 'limit' })
  assert.equal(okItems(mergeSelection(full, sel([1, 2]), { now: ts(1), newId: 'n' })).length, MAX_BIBLE_BOOKMARKS)
})

test('mergeSelection recusa nota (nova ou unida) acima de 2000', () => {
  const long = 'a'.repeat(1500)
  assert.deepEqual(mergeSelection([], sel([1]), { now: ts(1), newId: 'n', note: 'b'.repeat(2001) }), { ok: false, error: 'note-too-long' })
  assert.deepEqual(
    mergeSelection([bm({ id: 'a', verses: [1], note: long })], sel([1]), { now: ts(1), newId: 'n', note: long }),
    { ok: false, error: 'note-too-long' },
  )
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:bible`
Expected: FAIL — `mergeSelection` / `overlappingBookmarks` não exportados.

- [ ] **Step 3: Implementar** — acrescentar ao final de `bookmarks.ts`

```ts
export type BookmarkRuleError = 'limit' | 'note-too-long'

export type BookmarkResult<T extends TimestampLike> =
  | { ok: true; items: BibleBookmark<T>[] }
  | { ok: false; error: BookmarkRuleError }

/** Marcadores do mesmo capítulo com pelo menos um versículo da seleção. */
export function overlappingBookmarks<T extends TimestampLike>(
  items: BibleBookmark<T>[],
  sel: VerseSelection,
): BibleBookmark<T>[] {
  return items.filter(
    (b) => b.bookId === sel.bookId && b.chapter === sel.chapter && b.verses.some((v) => sel.verses.includes(v)),
  )
}

/**
 * Salva a seleção: cria um marcador ou funde com os que ela encosta
 * (versículos unidos, notas mantidas uma embaixo da outra, id/data do mais antigo).
 */
export function mergeSelection<T extends TimestampLike>(
  items: BibleBookmark<T>[],
  sel: VerseSelection,
  options: { now: T; newId: string; note?: string },
): BookmarkResult<T> {
  const { now, newId } = options
  const newNote = cleanNote(options.note)
  const hit = overlappingBookmarks(items, sel)

  if (!hit.length) {
    if (items.length >= MAX_BIBLE_BOOKMARKS) return { ok: false, error: 'limit' }
    if (newNote && newNote.length > MAX_BOOKMARK_NOTE_LENGTH) return { ok: false, error: 'note-too-long' }
    const created = buildBookmark({
      id: newId,
      bookId: sel.bookId,
      chapter: sel.chapter,
      verses: sortedUnique(sel.verses),
      note: newNote,
      created_at: now,
    })
    return { ok: true, items: [...items, created] }
  }

  const note = [...hit]
    .sort((a, b) => a.verses[0] - b.verses[0])
    .map((b) => b.note)
    .concat(newNote)
    .filter((n): n is string => !!n)
    .join('\n\n')
  if (note.length > MAX_BOOKMARK_NOTE_LENGTH) return { ok: false, error: 'note-too-long' }

  const oldest = hit.reduce((a, b) => (b.created_at.toMillis() < a.created_at.toMillis() ? b : a))
  const merged = buildBookmark({
    id: oldest.id,
    bookId: sel.bookId,
    chapter: sel.chapter,
    verses: sortedUnique([...sel.verses, ...hit.flatMap((b) => b.verses)]),
    note: note || undefined,
    created_at: oldest.created_at,
    updated_at: now,
  })
  return { ok: true, items: [...items.filter((i) => !hit.includes(i)), merged] }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test:bible`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/bible/bookmarks.ts src/lib/bible/bookmarks.test.ts
git commit -m "feat(biblia): fusão de seleção em marcadores de trecho

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Nota, remoção, agrupamento, citação e link

**Files:**
- Modify: `src/lib/bible/bookmarks.ts`
- Test: `src/lib/bible/bookmarks.test.ts`

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces:
  - `setNote<T extends TimestampLike>(items: BibleBookmark<T>[], id: string, note: string, now: T): BookmarkResult<T>`
  - `withoutBookmark<T extends TimestampLike>(items: BibleBookmark<T>[], id: string): BibleBookmark<T>[]`
  - `interface BookmarkGroup<T extends TimestampLike = TimestampLike> { bookId: string; count: number; withNote: number; lastActivity: number; bookmarks: BibleBookmark<T>[] }` (`bookmarks` em ordem canônica)
  - `groupByBook<T extends TimestampLike>(items: BibleBookmark<T>[]): BookmarkGroup<T>[]` (mais recente primeiro)
  - `interface QuoteEntry { verse: number; text: string }`
  - `buildQuote(entries: QuoteEntry[], label: string): string`
  - `bookmarkHref(sel: VerseSelection): string` — `/dashboard/bible/levitico/27?v=1-3,7`

- [ ] **Step 1: Escrever os testes que falham** — acrescentar a `bookmarks.test.ts`

Acrescentar `setNote, withoutBookmark, groupByBook, buildQuote, bookmarkHref` ao import de `./bookmarks.ts`, e então:

```ts
test('setNote edita, limpa e ignora id inexistente', () => {
  const now = ts(99)
  const items = [bm({ id: 'a', verses: [1], note: 'velha' })]
  const edited = okItems(setNote(items, 'a', '  nova ', now))
  assert.equal(edited[0].note, 'nova')
  assert.equal(edited[0].updated_at?.toMillis(), 99)
  const cleared = okItems(setNote(items, 'a', '   ', now))
  assert.equal('note' in cleared[0], false)
  assert.deepEqual(okItems(setNote(items, 'sumiu', 'x', now)), items)
  assert.deepEqual(setNote(items, 'a', 'x'.repeat(2001), now), { ok: false, error: 'note-too-long' })
})

test('withoutBookmark remove pelo id e tolera id inexistente', () => {
  const items = [bm({ id: 'a', verses: [1] }), bm({ id: 'b', verses: [2] })]
  assert.deepEqual(withoutBookmark(items, 'a').map((b) => b.id), ['b'])
  assert.equal(withoutBookmark(items, 'sumiu').length, 2)
})

test('groupByBook conta, ordena por atividade e lista em ordem canônica', () => {
  const groups = groupByBook([
    bm({ id: 'l2', chapter: 27, verses: [5], created_at: ts(10) }),
    bm({ id: 'l1', chapter: 3, verses: [2], note: 'n', created_at: ts(20) }),
    bm({ id: 'l3', chapter: 27, verses: [1], created_at: ts(5), updated_at: ts(500) }),
    bm({ id: 'j1', bookId: 'JHN', chapter: 3, verses: [16], created_at: ts(100) }),
  ])
  assert.deepEqual(groups.map((g) => g.bookId), ['LEV', 'JHN'])
  assert.equal(groups[0].count, 3)
  assert.equal(groups[0].withNote, 1)
  assert.equal(groups[0].lastActivity, 500)
  assert.deepEqual(groups[0].bookmarks.map((b) => b.id), ['l1', 'l3', 'l2'])
})

test('buildQuote: um versículo sem número, vários com sobrescrito', () => {
  assert.equal(buildQuote([{ verse: 16, text: 'Porque Deus' }], 'João 3:16'), '"Porque Deus"\n— João 3:16')
  assert.equal(
    buildQuote([{ verse: 12, text: 'B' }, { verse: 1, text: 'A' }], 'Levítico 27:1, 12'),
    '"¹ A ¹² B"\n— Levítico 27:1, 12',
  )
})

test('bookmarkHref aponta o trecho no leitor', () => {
  assert.equal(bookmarkHref({ bookId: 'LEV', chapter: 27, verses: [7, 1, 2, 3] }), '/dashboard/bible/levitico/27?v=1-3,7')
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:bible`
Expected: FAIL — funções não exportadas.

- [ ] **Step 3: Implementar** — em `bookmarks.ts`, trocar o import de `./catalog.ts` por:

```ts
import { bookHref, findBookById, isValidVerse, parseRefKey } from './catalog.ts'
```

e acrescentar ao final:

```ts
/** Edita a nota (vazia/espaços remove a nota). Id inexistente devolve a lista sem mudança. */
export function setNote<T extends TimestampLike>(
  items: BibleBookmark<T>[],
  id: string,
  note: string,
  now: T,
): BookmarkResult<T> {
  const cleaned = cleanNote(note)
  if (cleaned && cleaned.length > MAX_BOOKMARK_NOTE_LENGTH) return { ok: false, error: 'note-too-long' }
  return {
    ok: true,
    items: items.map((b) => (b.id === id ? buildBookmark({ ...b, note: cleaned, updated_at: now }) : b)),
  }
}

export const withoutBookmark = <T extends TimestampLike>(items: BibleBookmark<T>[], id: string) =>
  items.filter((b) => b.id !== id)

export interface BookmarkGroup<T extends TimestampLike = TimestampLike> {
  bookId: string
  count: number
  withNote: number
  /** Maior `created_at`/`updated_at` do livro, em ms. */
  lastActivity: number
  /** Ordem do texto: capítulo, depois primeiro versículo. */
  bookmarks: BibleBookmark<T>[]
}

const activityOf = (b: BibleBookmark) => Math.max(b.created_at.toMillis(), b.updated_at?.toMillis() ?? 0)

/** Cards da tela principal: um por livro, o de atividade mais recente primeiro. */
export function groupByBook<T extends TimestampLike>(items: BibleBookmark<T>[]): BookmarkGroup<T>[] {
  const byBook = new Map<string, BibleBookmark<T>[]>()
  for (const b of items) byBook.set(b.bookId, [...(byBook.get(b.bookId) ?? []), b])

  return [...byBook.entries()]
    .map(([bookId, bookmarks]) => ({
      bookId,
      count: bookmarks.length,
      withNote: bookmarks.filter((b) => b.note).length,
      lastActivity: Math.max(...bookmarks.map(activityOf)),
      bookmarks: [...bookmarks].sort((a, b) => a.chapter - b.chapter || a.verses[0] - b.verses[0]),
    }))
    .sort((a, b) => b.lastActivity - a.lastActivity)
}

export interface QuoteEntry {
  verse: number
  text: string
}

const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const superscript = (n: number) => [...String(n)].map((d) => SUPERSCRIPT[Number(d)]).join('')

/** Texto para copiar/compartilhar; com mais de um versículo, numera cada um. */
export function buildQuote(entries: QuoteEntry[], label: string): string {
  const sorted = [...entries].sort((a, b) => a.verse - b.verse)
  const body =
    sorted.length === 1 ? sorted[0].text : sorted.map((e) => `${superscript(e.verse)} ${e.text}`).join(' ')
  return `"${body}"\n— ${label}`
}

/** Leitor no capítulo do trecho, destacando todos os versículos (`?v=1-3,7`). */
export function bookmarkHref(sel: VerseSelection): string {
  const slug = findBookById(sel.bookId)?.slug ?? ''
  return `${bookHref(slug)}/${sel.chapter}?v=${formatVerses(sel.verses).replace(/ /g, '')}`
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test:bible`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/bible/bookmarks.ts src/lib/bible/bookmarks.test.ts
git commit -m "feat(biblia): nota, agrupamento por livro e citação de trechos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Serviço Firebase, store e adaptação dos consumidores atuais

O app precisa continuar compilando ao fim desta task: `ChapterReader` e `BookmarksStrip` recebem uma adaptação mínima (serão reescritos nas Tasks 7 e 8).

**Files:**
- Modify: `src/types/index.ts:158-162`
- Modify: `src/services/firebase/bible.ts` (arquivo inteiro)
- Modify: `src/store/useBibleBookmarks.ts` (arquivo inteiro)
- Modify: `src/app/(protected)/dashboard/bible/components/ChapterReader.tsx`
- Modify: `src/app/(protected)/dashboard/bible/components/BookmarksStrip.tsx`

**Interfaces:**
- Consumes: `normalizeBookmarks`, `mergeSelection`, `setNote`, `withoutBookmark`, `BookmarkRuleError`, `BookmarkResult`, `VerseSelection`, `findBookmarkForVerse`, `formatBookmarkRef`, `bookmarkHref` (Tasks 1–3).
- Produces:
  - `type BibleBookmark = BookmarkOf<Timestamp>` em `@/types`
  - serviço: `getBookmarks(uid): Promise<BibleBookmark[]>`, `saveSelection(uid, sel: VerseSelection, options: { newId: string; note?: string }): Promise<BibleBookmark[]>`, `updateNote(uid, id, note): Promise<BibleBookmark[]>`, `removeBookmark(uid, id): Promise<BibleBookmark[]>`, `class BookmarkRuleViolation extends Error { rule: BookmarkRuleError }`
  - store `useBibleBookmarks`: `{ uid, items: BibleBookmark[], status, load(uid), saveSelection(uid, sel, note?): Promise<boolean>, updateNote(uid, id, note): Promise<boolean>, remove(uid, id): Promise<boolean> }` — `true` = gravou.

- [ ] **Step 1: Trocar o tipo do app** — em `src/types/index.ts`, substituir o bloco

```ts
/** Marcador da Bíblia — `ref` no formato "JHN.3.16" (ver src/lib/bible/catalog.ts). */
export interface BibleBookmark {
  ref: string;
  created_at: Timestamp;
}
```

por

```ts
/** Marcador de trecho da Bíblia (regras em src/lib/bible/bookmarks.ts). */
export type BibleBookmark = BookmarkOf<Timestamp>;
```

e acrescentar no topo do arquivo, junto dos imports:

```ts
import type { BibleBookmark as BookmarkOf } from '@/lib/bible/types';
```

- [ ] **Step 2: Reescrever `src/services/firebase/bible.ts`**

```ts
import { doc, getDoc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from './config'
import {
  mergeSelection,
  normalizeBookmarks,
  setNote,
  withoutBookmark,
  type BookmarkResult,
  type BookmarkRuleError,
  type VerseSelection,
} from '@/lib/bible/bookmarks'
import type { BibleBookmark } from '@/types'

// Um documento por usuário (fora de `users`, para não pesar nas listas de membros):
// carregar todos os marcadores, com as notas, custa 1 leitura. Privado: só o dono lê/grava.
const BIBLE_BOOKMARKS_COLLECTION = 'bible_bookmarks'

const bookmarksDoc = (uid: string) => doc(db, BIBLE_BOOKMARKS_COLLECTION, uid)

/** Regra violada no servidor (ex.: o limite foi atingido em outro aparelho). */
export class BookmarkRuleViolation extends Error {
  readonly rule: BookmarkRuleError
  constructor(rule: BookmarkRuleError) {
    super(rule)
    this.rule = rule
  }
}

export async function getBookmarks(uid: string): Promise<BibleBookmark[]> {
  return normalizeBookmarks<Timestamp>((await getDoc(bookmarksDoc(uid))).data()?.items)
}

function updateBookmarks(uid: string, change: (items: BibleBookmark[]) => BibleBookmark[]) {
  return runTransaction(db, async (tx) => {
    const snapshot = await tx.get(bookmarksDoc(uid))
    const items = change(normalizeBookmarks<Timestamp>(snapshot.data()?.items))
    tx.set(bookmarksDoc(uid), { items, updated_at: serverTimestamp() })
    return items
  })
}

const unwrap = (result: BookmarkResult<Timestamp>) => {
  if (!result.ok) throw new BookmarkRuleViolation(result.error)
  return result.items
}

export const saveSelection = (uid: string, sel: VerseSelection, options: { newId: string; note?: string }) =>
  updateBookmarks(uid, (items) => unwrap(mergeSelection(items, sel, { ...options, now: Timestamp.now() })))

export const updateNote = (uid: string, id: string, note: string) =>
  updateBookmarks(uid, (items) => unwrap(setNote(items, id, note, Timestamp.now())))

export const removeBookmark = (uid: string, id: string) =>
  updateBookmarks(uid, (items) => withoutBookmark(items, id))
```

- [ ] **Step 3: Reescrever `src/store/useBibleBookmarks.ts`**

```ts
import { create } from 'zustand'
import { toast } from 'sonner'
import { Timestamp } from 'firebase/firestore'
import {
  mergeSelection,
  setNote,
  withoutBookmark,
  type BookmarkResult,
  type BookmarkRuleError,
  type VerseSelection,
} from '@/lib/bible/bookmarks'
import {
  BookmarkRuleViolation,
  getBookmarks,
  removeBookmark,
  saveSelection as saveSelectionRemote,
  updateNote as updateNoteRemote,
} from '@/services/firebase/bible'
import type { BibleBookmark } from '@/types'

const RULE_MESSAGES: Record<BookmarkRuleError, string> = {
  limit: 'Limite de 200 marcadores atingido. Remova algum para continuar.',
  'note-too-long': 'A nota unida passaria de 2.000 caracteres. Encurte a anotação antes de unir.',
}

interface BibleBookmarksState {
  uid: string | null
  items: BibleBookmark[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** Carrega uma vez por usuário; chamadas repetidas não releem o Firestore. */
  load: (uid: string) => Promise<void>
  /** Marca a seleção (cria ou funde), com nota opcional. `true` = gravou. */
  saveSelection: (uid: string, sel: VerseSelection, note?: string) => Promise<boolean>
  updateNote: (uid: string, id: string, note: string) => Promise<boolean>
  remove: (uid: string, id: string) => Promise<boolean>
}

export const useBibleBookmarks = create<BibleBookmarksState>((set, get) => {
  /** Aplica na hora (otimista); desfaz e avisa se a gravação falhar. */
  async function commit(
    uid: string,
    local: BookmarkResult<Timestamp>,
    remote: () => Promise<BibleBookmark[]>,
    successMessage: string,
  ): Promise<boolean> {
    if (!local.ok) {
      toast.error(RULE_MESSAGES[local.error])
      return false
    }
    const previous = get().items
    set({ items: local.items })
    try {
      const items = await remote()
      if (get().uid === uid) set({ items, status: 'ready' })
      toast.success(successMessage)
      return true
    } catch (error) {
      console.error(error)
      set({ items: previous })
      toast.error(
        error instanceof BookmarkRuleViolation
          ? RULE_MESSAGES[error.rule]
          : 'Não foi possível salvar. Verifique sua conexão.',
      )
      return false
    }
  }

  return {
    uid: null,
    items: [],
    status: 'idle',

    load: async (uid) => {
      const { uid: current, status } = get()
      if (current === uid && (status === 'loading' || status === 'ready')) return

      set({ uid, items: [], status: 'loading' })
      try {
        const items = await getBookmarks(uid)
        if (get().uid === uid) set({ items, status: 'ready' })
      } catch (error) {
        console.error(error)
        if (get().uid === uid) set({ status: 'error' })
      }
    },

    saveSelection: (uid, sel, note) => {
      const newId = crypto.randomUUID()
      return commit(
        uid,
        mergeSelection(get().items, sel, { now: Timestamp.now(), newId, note }),
        () => saveSelectionRemote(uid, sel, { newId, note }),
        note?.trim() ? 'Marcador e anotação salvos' : 'Marcador adicionado',
      )
    },

    updateNote: (uid, id, note) =>
      commit(uid, setNote(get().items, id, note, Timestamp.now()), () => updateNoteRemote(uid, id, note), 'Anotação salva'),

    remove: (uid, id) =>
      commit(uid, { ok: true, items: withoutBookmark(get().items, id) }, () => removeBookmark(uid, id), 'Marcador removido'),
  }
})
```

- [ ] **Step 4: Adaptar o `ChapterReader` (mínimo, será reescrito na Task 8)**

Em `ChapterReader.tsx`:

1. Trocar `import { adjacentChapter, bookHref, chapterHref, findBookBySlug, toRefKey } from '@/lib/bible/catalog'` por:
```ts
import { adjacentChapter, bookHref, chapterHref, findBookBySlug } from '@/lib/bible/catalog'
import { findBookmarkForVerse } from '@/lib/bible/bookmarks'
```
2. Trocar `const { items, load, toggle } = useBibleBookmarks()` por `const { items, load, saveSelection, remove } = useBibleBookmarks()`.
3. Trocar as linhas
```ts
  const bookmarked = useMemo(() => new Set(items.map((i) => i.ref)), [items])
  const refKey = (verse: number) => toRefKey({ bookId: book.id, chapter, verse })
```
por
```ts
  const bookmarkOf = (verse: number) => findBookmarkForVerse(items, book.id, chapter, verse)
```
4. Trocar `const selectedMarked = selected !== null && bookmarked.has(refKey(selected))` por `const selectedBookmark = selected !== null ? bookmarkOf(selected) : null` e, no JSX, `selectedMarked` por `!!selectedBookmark` (dois lugares).
5. Trocar `{bookmarked.has(refKey(verse)) && (` por `{bookmarkOf(verse) && (`.
6. Trocar o `onClick` do botão de marcador por:
```tsx
              onClick={() => {
                if (currentUser && selected) {
                  if (selectedBookmark) remove(currentUser.uid, selectedBookmark.id)
                  else saveSelection(currentUser.uid, { bookId: book.id, chapter, verses: [selected] })
                }
                setSelected(null)
              }}
```
7. Remover `useMemo` do import do React se ficar sem uso.

- [ ] **Step 5: Adaptar o `BookmarksStrip` (mínimo, será removido na Task 9)**

Em `BookmarksStrip.tsx`:

1. Trocar `import { findBookById, formatRef, parseRefKey, verseHref } from '@/lib/bible/catalog'` por:
```ts
import { findBookById } from '@/lib/bible/catalog'
import { bookmarkHref, formatBookmarkRef } from '@/lib/bible/bookmarks'
```
2. Trocar o `useMemo` de `bookmarks` por:
```ts
  const bookmarks = useMemo(
    () =>
      [...items]
        .sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis())
        .slice(0, MAX_SHOWN)
        .map((item) => ({ key: item.id, item, createdAt: item.created_at })),
    [items],
  )
```
3. No efeito de textos, trocar o loop por:
```ts
    for (const { key, item } of bookmarks) {
      const book = findBookById(item.bookId)
      if (!book) continue
      getBook(book.slug)
        .then((b) => {
          if (!cancelled) setTexts((t) => ({ ...t, [key]: b.chapters[item.chapter - 1][item.verses[0] - 1] }))
        })
        .catch(() => {})
    }
```
4. No JSX: `bookmarks.map(({ key, item, createdAt }) => (`, `href={bookmarkHref(item)}` e `{formatBookmarkRef(item)}` no lugar de `formatRef(ref)`.

- [ ] **Step 6: Verificar**

Run: `npm run test:bible && npx tsc --noEmit && npx eslint src/services/firebase/bible.ts src/store/useBibleBookmarks.ts "src/app/(protected)/dashboard/bible/components"`
Expected: testes PASS, `tsc` sem saída, eslint sem erros (avisos antigos podem existir).

- [ ] **Step 7: Commit**

```bash
git add src/types/index.ts src/services/firebase/bible.ts src/store/useBibleBookmarks.ts "src/app/(protected)/dashboard/bible/components"
git commit -m "feat(biblia): serviço e store de marcadores de trecho com nota

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: `NoteEditor` e `SelectionBar`

**Files:**
- Create: `src/app/(protected)/dashboard/bible/components/NoteEditor.tsx`
- Create: `src/app/(protected)/dashboard/bible/components/SelectionBar.tsx`

**Interfaces:**
- Consumes: `MAX_BOOKMARK_NOTE_LENGTH` (Task 1).
- Produces:
  - `NoteEditor({ initialNote?: string; onSave: (note: string) => Promise<boolean>; onCancel: () => void })` — mantém o texto se `onSave` devolver `false`.
  - `SelectionBar({ label: string; onClear: () => void; onConfirm: () => void })`

- [ ] **Step 1: Criar `NoteEditor.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { Textarea } from '@/components/ui/textarea'
import { MAX_BOOKMARK_NOTE_LENGTH } from '@/lib/bible/bookmarks'
import { cn } from '@/lib/utils'

interface NoteEditorProps {
  initialNote?: string
  /** `true` = salvou; com `false` o texto continua no campo para tentar de novo. */
  onSave: (note: string) => Promise<boolean>
  onCancel: () => void
}

export function NoteEditor({ initialNote = '', onSave, onCancel }: NoteEditorProps) {
  const [note, setNote] = useState(initialNote)
  const [saving, setSaving] = useState(false)
  const nearLimit = note.length >= MAX_BOOKMARK_NOTE_LENGTH - 100

  const save = async () => {
    setSaving(true)
    await onSave(note)
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={MAX_BOOKMARK_NOTE_LENGTH}
          placeholder="O que você quer lembrar sobre este trecho?"
          className="min-h-[120px] rounded-xl border-slate-200 focus:ring-amber-500 dark:border-slate-800"
        />
        <p className={cn('text-right text-[11px] font-medium text-slate-400', nearLimit && 'text-red-500')}>
          {note.length}/{MAX_BOOKMARK_NOTE_LENGTH}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
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
          onClick={onCancel}
          className="h-11 w-full rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 sm:w-auto"
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Criar `SelectionBar.tsx`**

```tsx
'use client'

import { Check, X } from 'lucide-react'

interface SelectionBarProps {
  /** Referência da seleção, ex.: "Levítico 27:1-3, 7". */
  label: string
  onClear: () => void
  onConfirm: () => void
}

/** Barra flutuante da seleção de versículos: sem overlay, o texto continua rolável. */
export function SelectionBar({ label, onClear, onConfirm }: SelectionBarProps) {
  return (
    <div className="fixed inset-x-4 bottom-[calc(92px+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-2 rounded-2xl border border-amber-200 bg-white/95 p-2 pl-4 shadow-2xl shadow-amber-500/20 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300 dark:border-amber-900/50 dark:bg-slate-900/95 lg:bottom-6">
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label="Limpar seleção"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 active:scale-95 dark:hover:bg-slate-800"
      >
        <X className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onConfirm}
        aria-label="Continuar com a seleção"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-700 active:scale-95"
      >
        <Check className="h-5 w-5" />
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npx eslint "src/app/(protected)/dashboard/bible/components/NoteEditor.tsx" "src/app/(protected)/dashboard/bible/components/SelectionBar.tsx"`
Expected: sem saída do `tsc`, eslint sem erros.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(protected)/dashboard/bible/components/NoteEditor.tsx" "src/app/(protected)/dashboard/bible/components/SelectionBar.tsx"
git commit -m "feat(biblia): editor de nota e barra flutuante de seleção

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: `VerseActionsSheet` e `BookmarkSheet`

**Files:**
- Create: `src/app/(protected)/dashboard/bible/components/VerseActionsSheet.tsx`
- Create: `src/app/(protected)/dashboard/bible/components/BookmarkSheet.tsx`

**Interfaces:**
- Consumes: `NoteEditor` (Task 5), `formatBookmarkRef`, `QuoteEntry` (Tasks 1, 3), `BibleBookmark` de `@/types`, `useMessages` de `@/hooks/useMessages`.
- Produces:
  - `VerseActionsSheet({ open: boolean; label: string; entries: QuoteEntry[]; overlapping: BibleBookmark[]; canMark: boolean; onOpenChange: (open: boolean) => void; onMark: (note?: string) => Promise<boolean>; onCopy: () => void; onShare: () => void })`
  - `BookmarkSheet({ bookmark: BibleBookmark | null; entries: QuoteEntry[]; onOpenChange: (open: boolean) => void; onSaveNote: (note: string) => Promise<boolean>; onRemove: (id: string) => void; onCopy: () => void; onShare: () => void })` — `onRemove` recebe o id porque, com nota, a confirmação chega depois que o sheet já fechou.

- [ ] **Step 1: Criar `VerseActionsSheet.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Bookmark, Copy, NotebookPen, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatBookmarkRef, type QuoteEntry } from '@/lib/bible/bookmarks'
import type { BibleBookmark } from '@/types'
import { NoteEditor } from './NoteEditor'

interface VerseActionsSheetProps {
  open: boolean
  label: string
  entries: QuoteEntry[]
  /** Marcadores existentes que a seleção encosta (serão unidos ao marcar). */
  overlapping: BibleBookmark[]
  canMark: boolean
  onOpenChange: (open: boolean) => void
  onMark: (note?: string) => Promise<boolean>
  onCopy: () => void
  onShare: () => void
}

export function VerseActionsSheet({
  open,
  label,
  entries,
  overlapping,
  canMark,
  onOpenChange,
  onMark,
  onCopy,
  onShare,
}: VerseActionsSheetProps) {
  const [editing, setEditing] = useState(false)

  const changeOpen = (next: boolean) => {
    if (!next) setEditing(false)
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent variant="sheet" className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base font-black md:text-xl">{label}</DialogTitle>
          <DialogDescription className="line-clamp-3 font-serif italic">
            {entries.map((e) => e.text).join(' ')}
          </DialogDescription>
        </DialogHeader>

        {overlapping.length > 0 && (
          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-900/10">
            <p className="font-medium text-amber-800 dark:text-amber-300">
              Inclui {overlapping.map(formatBookmarkRef).join('; ')}, que já está marcado. Os trechos serão unidos.
            </p>
            {overlapping
              .filter((b) => b.note)
              .map((b) => (
                <p key={b.id} className="whitespace-pre-line text-slate-700 dark:text-slate-200">
                  {b.note}
                </p>
              ))}
          </div>
        )}

        {editing ? (
          <NoteEditor onSave={(note) => onMark(note)} onCancel={() => setEditing(false)} />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="h-11 rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700"
              disabled={!canMark}
              onClick={() => onMark()}
            >
              <Bookmark className="mr-2 h-4 w-4" />
              Marcar
            </Button>
            <Button variant="outline" className="h-11 rounded-xl font-bold" disabled={!canMark} onClick={() => setEditing(true)}>
              <NotebookPen className="mr-2 h-4 w-4" />
              Adicionar nota
            </Button>
            <Button variant="outline" className="h-11 rounded-xl font-bold" onClick={onCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </Button>
            <Button variant="outline" className="h-11 rounded-xl font-bold" onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Criar `BookmarkSheet.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Copy, NotebookPen, Share2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useMessages } from '@/hooks/useMessages'
import { formatBookmarkRef, type QuoteEntry } from '@/lib/bible/bookmarks'
import type { BibleBookmark } from '@/types'
import { NoteEditor } from './NoteEditor'

interface BookmarkSheetProps {
  /** Marcador aberto; `null` fecha o sheet. */
  bookmark: BibleBookmark | null
  entries: QuoteEntry[]
  onOpenChange: (open: boolean) => void
  onSaveNote: (note: string) => Promise<boolean>
  /** Recebe o id: com nota, a confirmação chega depois que o sheet já fechou. */
  onRemove: (id: string) => void
  onCopy: () => void
  onShare: () => void
}

export function BookmarkSheet({
  bookmark,
  entries,
  onOpenChange,
  onSaveNote,
  onRemove,
  onCopy,
  onShare,
}: BookmarkSheetProps) {
  const { onShowMessage } = useMessages()
  const [editing, setEditing] = useState(false)

  const changeOpen = (next: boolean) => {
    if (!next) setEditing(false)
    onOpenChange(next)
  }

  const saveNote = async (note: string) => {
    const ok = await onSaveNote(note)
    if (ok) setEditing(false)
    return ok
  }

  const handleRemove = () => {
    if (!bookmark) return
    const id = bookmark.id
    if (!bookmark.note) {
      onRemove(id)
      return
    }
    // Fecha o sheet antes, para a confirmação não abrir por cima de outro modal
    changeOpen(false)
    onShowMessage({
      type: 'QUESTION',
      messageType: 'warning',
      title: 'Remover marcador',
      description: 'A anotação deste trecho também será apagada.',
      buttonText: 'Remover',
      onConfirm: () => onRemove(id),
    })
  }

  return (
    <Dialog open={!!bookmark} onOpenChange={changeOpen}>
      <DialogContent variant="sheet" className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base font-black md:text-xl">
            {bookmark ? formatBookmarkRef(bookmark) : ''}
          </DialogTitle>
          <DialogDescription className="line-clamp-3 font-serif italic">
            {entries.map((e) => e.text).join(' ')}
          </DialogDescription>
        </DialogHeader>

        {editing ? (
          <NoteEditor initialNote={bookmark?.note} onSave={saveNote} onCancel={() => setEditing(false)} />
        ) : (
          <>
            {bookmark?.note ? (
              <p className="whitespace-pre-line rounded-xl bg-amber-50 p-4 text-sm text-slate-700 dark:bg-amber-900/15 dark:text-slate-200">
                {bookmark.note}
              </p>
            ) : (
              <p className="text-sm text-slate-400">Sem anotação.</p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                className="col-span-2 h-11 rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700"
                onClick={() => setEditing(true)}
              >
                <NotebookPen className="mr-2 h-4 w-4" />
                {bookmark?.note ? 'Editar nota' : 'Adicionar nota'}
              </Button>
              <Button variant="outline" className="h-11 rounded-xl font-bold" onClick={onCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
              <Button variant="outline" className="h-11 rounded-xl font-bold" onClick={onShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </Button>
              <Button
                variant="ghost"
                className="col-span-2 h-11 rounded-xl font-bold text-red-600 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={handleRemove}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover marcador
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npx eslint "src/app/(protected)/dashboard/bible/components/VerseActionsSheet.tsx" "src/app/(protected)/dashboard/bible/components/BookmarkSheet.tsx"`
Expected: sem saída do `tsc`, eslint sem erros.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(protected)/dashboard/bible/components/VerseActionsSheet.tsx" "src/app/(protected)/dashboard/bible/components/BookmarkSheet.tsx"
git commit -m "feat(biblia): sheets de ações da seleção e do marcador

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Leitor com seleção múltipla e destaque de trecho

**Files:**
- Modify: `src/app/(protected)/dashboard/bible/[book]/[chapter]/page.tsx` (arquivo inteiro)
- Modify: `src/app/(protected)/dashboard/bible/components/ChapterReader.tsx` (arquivo inteiro)

**Interfaces:**
- Consumes: `parseVerseParam`, `formatBookmarkRef`, `buildQuote`, `overlappingBookmarks`, `QuoteEntry` (Tasks 1–3); store `saveSelection/updateNote/remove` (Task 4); `SelectionBar`, `NoteEditor` (Task 5); `VerseActionsSheet`, `BookmarkSheet` (Task 6).
- Produces: `ChapterReader({ slug: string; chapter: number; focusVerses: number[] })` (substitui `focusVerse?: number`).

- [ ] **Step 1: Reescrever `[book]/[chapter]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { parseVerseParam } from '@/lib/bible/bookmarks'
import { findBookBySlug, isValidChapter, isValidVerse } from '@/lib/bible/catalog'
import { ChapterReader } from '../../components/ChapterReader'

export default async function BibleChapterPage({
  params,
  searchParams,
}: {
  params: Promise<{ book: string; chapter: string }>
  searchParams: Promise<{ v?: string }>
}) {
  const { book: slug, chapter: rawChapter } = await params
  const { v } = await searchParams
  const book = findBookBySlug(slug)
  const chapter = Number(rawChapter)
  if (!book || !/^\d+$/.test(rawChapter) || !isValidChapter(book, chapter)) notFound()

  // ?v=3 (versículo) ou ?v=1-3,7 (trecho de marcador)
  const focusVerses = parseVerseParam(v).filter((verse) => isValidVerse(book, chapter, verse))
  return <ChapterReader slug={book.slug} chapter={chapter} focusVerses={focusVerses} />
}
```

- [ ] **Step 2: Reescrever `ChapterReader.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Bookmark, ChevronLeft, ChevronRight, NotebookPen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { buildQuote, formatBookmarkRef, overlappingBookmarks, type QuoteEntry } from '@/lib/bible/bookmarks'
import { adjacentChapter, bookHref, chapterHref, findBookBySlug } from '@/lib/bible/catalog'
import { getBook, prefetchBible } from '@/lib/bible/loader'
import { FONT_SIZES, readFontSize, saveFontSize, saveLastRead } from '@/lib/bible/preferences'
import { copyText, shareText } from '@/lib/share'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/useAuth'
import { useBibleBookmarks } from '@/store/useBibleBookmarks'
import type { BibleBookmark } from '@/types'
import { BibleCredit } from './BibleCredit'
import { BookmarkSheet } from './BookmarkSheet'
import { SelectionBar } from './SelectionBar'
import { VerseActionsSheet } from './VerseActionsSheet'

interface ChapterReaderProps {
  slug: string
  chapter: number
  /** Versículos vindos de ?v= — rola até o primeiro e destaca todos por alguns segundos. */
  focusVerses: number[]
}

export function ChapterReader({ slug, chapter, focusVerses }: ChapterReaderProps) {
  // A página já validou o slug
  const book = findBookBySlug(slug)!
  const { currentUser } = useAuth()
  const { items, load, saveSelection, updateNote, remove } = useBibleBookmarks()

  const [verses, setVerses] = useState<string[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [fontSize, setFontSize] = useState(1)
  const [selection, setSelection] = useState<number[]>([])
  const [actionsOpen, setActionsOpen] = useState(false)
  const [activeBookmarkId, setActiveBookmarkId] = useState<string | null>(null)
  const [flash, setFlash] = useState<number[]>(focusVerses)
  const focusKey = focusVerses.join(',')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFontSize(readFontSize())
  }, [])

  useEffect(() => {
    if (currentUser) load(currentUser.uid)
  }, [currentUser, load])

  // Trocar de capítulo limpa a seleção e fecha os sheets
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelection([])
    setActionsOpen(false)
    setActiveBookmarkId(null)
  }, [slug, chapter])

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVerses(null)
    setFailed(false)
    getBook(slug)
      .then((b) => {
        if (cancelled) return
        setVerses(b.chapters[chapter - 1])
        saveLastRead(slug, chapter)
        prefetchBible()
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [slug, chapter, attempt])

  useEffect(() => {
    if (!verses || !focusKey) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFlash(focusKey.split(',').map(Number))
    document.getElementById(`v${focusKey.split(',')[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const timer = setTimeout(() => setFlash([]), 2500)
    return () => clearTimeout(timer)
  }, [verses, focusKey])

  // Versículo → marcador deste capítulo
  const verseBookmark = useMemo(() => {
    const map = new Map<number, BibleBookmark>()
    for (const b of items) {
      if (b.bookId !== book.id || b.chapter !== chapter) continue
      for (const v of b.verses) map.set(v, b)
    }
    return map
  }, [items, book.id, chapter])

  const prev = adjacentChapter(slug, chapter, -1)
  const next = adjacentChapter(slug, chapter, 1)

  const changeFont = (delta: number) => {
    const size = Math.min(FONT_SIZES.length - 1, Math.max(0, fontSize + delta))
    setFontSize(size)
    saveFontSize(size)
  }

  const entriesOf = (list: number[]): QuoteEntry[] =>
    verses ? list.map((verse) => ({ verse, text: verses[verse - 1] })) : []

  const selectionRef = { bookId: book.id, chapter, verses: selection }
  const selectionLabel = formatBookmarkRef(selectionRef)
  const selectionEntries = entriesOf(selection)
  const overlapping = overlappingBookmarks(items, selectionRef)
  const activeBookmark = items.find((b) => b.id === activeBookmarkId) ?? null
  const activeEntries = activeBookmark ? entriesOf(activeBookmark.verses) : []

  const tapVerse = (verse: number) => {
    const marked = verseBookmark.get(verse)
    if (selection.length === 0 && marked) {
      setActiveBookmarkId(marked.id)
      return
    }
    setSelection((s) => (s.includes(verse) ? s.filter((v) => v !== verse) : [...s, verse].sort((a, b) => a - b)))
  }

  const clearSelection = () => {
    setActionsOpen(false)
    setSelection([])
  }

  /** Sem nota fecha na hora (otimista); com nota espera, para o texto não se perder se falhar. */
  const markSelection = async (note?: string) => {
    if (!currentUser) return false
    const pending = saveSelection(currentUser.uid, selectionRef, note)
    if (!note) {
      clearSelection()
      return pending
    }
    const ok = await pending
    if (ok) clearSelection()
    return ok
  }

  const copySelection = () => {
    copyText(buildQuote(selectionEntries, selectionLabel))
    clearSelection()
  }

  const shareSelection = () => {
    shareText(buildQuote(selectionEntries, selectionLabel))
    clearSelection()
  }

  const activeQuote = () => (activeBookmark ? buildQuote(activeEntries, formatBookmarkRef(activeBookmark)) : '')

  return (
    <article
      className={cn('mx-auto max-w-2xl space-y-6 animate-in fade-in duration-500', selection.length > 0 && 'pb-28')}
    >
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={bookHref(slug)}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-amber-700 dark:hover:text-amber-400"
          >
            <ChevronLeft className="h-4 w-4" />
            {book.name}
          </Link>
          <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            {book.name} {chapter}
          </h1>
        </div>
        <div className="flex shrink-0 items-center rounded-full border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-sm"
            onClick={() => changeFont(-1)}
            disabled={fontSize === 0}
            aria-label="Diminuir letra"
          >
            A−
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-base font-bold"
            onClick={() => changeFont(1)}
            disabled={fontSize === FONT_SIZES.length - 1}
            aria-label="Aumentar letra"
          >
            A+
          </Button>
        </div>
      </header>

      {failed ? (
        <div className="space-y-4 rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
          <p className="text-slate-500">Sem conexão. Este livro ainda não foi baixado.</p>
          <Button variant="outline" className="rounded-full" onClick={() => setAttempt((a) => a + 1)}>
            Tentar de novo
          </Button>
        </div>
      ) : !verses ? (
        <div className="flex justify-center py-20">
          <HebromSpinner size="lg" />
        </div>
      ) : (
        <div className={cn('font-serif leading-relaxed text-slate-800 dark:text-slate-100', FONT_SIZES[fontSize])}>
          {verses.map((text, i) => {
            const verse = i + 1
            const marked = verseBookmark.get(verse)
            const isSelected = selection.includes(verse)
            const isLastOfMarker = marked && marked.verses[marked.verses.length - 1] === verse
            return (
              <button
                key={verse}
                id={`v${verse}`}
                type="button"
                onClick={() => tapVerse(verse)}
                aria-pressed={isSelected}
                className={cn(
                  'block w-full scroll-mt-24 rounded-lg px-2 py-1 text-left transition-colors duration-700 hover:bg-amber-50/70 dark:hover:bg-amber-900/10',
                  marked && 'underline decoration-amber-400/70 decoration-dotted underline-offset-4',
                  flash.includes(verse) && 'bg-amber-100 dark:bg-amber-900/30',
                  isSelected &&
                    'bg-amber-100 shadow-[inset_3px_0_0_var(--color-amber-500)] transition-none dark:bg-amber-900/30',
                )}
              >
                <sup className="mr-1 font-sans text-[0.65em] font-bold text-amber-600 dark:text-amber-400">
                  {verse}
                </sup>
                {text}
                {marked &&
                  isLastOfMarker &&
                  (marked.note ? (
                    <NotebookPen
                      className="ml-1 inline h-[0.8em] w-[0.8em] align-baseline text-amber-500"
                      aria-label="Marcado com anotação"
                    />
                  ) : (
                    <Bookmark
                      className="ml-1 inline h-[0.8em] w-[0.8em] fill-amber-500 align-baseline text-amber-500"
                      aria-label="Marcado"
                    />
                  ))}
              </button>
            )
          })}
        </div>
      )}

      {verses && (
        <nav className="space-y-3 border-t border-slate-200 pt-6 dark:border-slate-800">
          {next && (
            <Button
              asChild
              size="lg"
              className="h-auto w-full rounded-2xl bg-amber-600 py-4 text-base shadow-lg shadow-amber-500/20 hover:bg-amber-700"
            >
              <Link href={chapterHref(next.slug, next.chapter)}>
                Próximo: {next.name} {next.chapter}
                <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
          )}
          {prev && (
            <Link
              href={chapterHref(prev.slug, prev.chapter)}
              className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-amber-700 dark:hover:text-amber-400"
            >
              <ChevronLeft className="h-4 w-4" />
              {prev.name} {prev.chapter}
            </Link>
          )}
        </nav>
      )}

      <BibleCredit />

      {selection.length > 0 && (
        <SelectionBar label={selectionLabel} onClear={clearSelection} onConfirm={() => setActionsOpen(true)} />
      )}

      <VerseActionsSheet
        open={actionsOpen}
        label={selectionLabel}
        entries={selectionEntries}
        overlapping={overlapping}
        canMark={!!currentUser}
        onOpenChange={setActionsOpen}
        onMark={markSelection}
        onCopy={copySelection}
        onShare={shareSelection}
      />

      <BookmarkSheet
        bookmark={activeBookmark}
        entries={activeEntries}
        onOpenChange={(open) => !open && setActiveBookmarkId(null)}
        onSaveNote={(note) =>
          currentUser && activeBookmark ? updateNote(currentUser.uid, activeBookmark.id, note) : Promise.resolve(false)
        }
        onRemove={(id) => {
          if (currentUser) remove(currentUser.uid, id)
          setActiveBookmarkId(null)
        }}
        onCopy={() => {
          copyText(activeQuote())
          setActiveBookmarkId(null)
        }}
        onShare={() => {
          shareText(activeQuote())
          setActiveBookmarkId(null)
        }}
      />
    </article>
  )
}
```

- [ ] **Step 3: Verificar**

Run: `npm run test:bible && npx tsc --noEmit && npx eslint "src/app/(protected)/dashboard/bible"`
Expected: testes PASS, `tsc` sem saída, eslint sem erros.

Checar também à mão que nenhum outro arquivo passa `focusVerse` (singular):

Run: `grep -rn "focusVerse=" src`
Expected: só `focusVerses=` em `[book]/[chapter]/page.tsx`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(protected)/dashboard/bible"
git commit -m "feat(biblia): seleção de vários versículos, nota e destaque de trecho no leitor

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Marcadores por livro na tela principal

**Files:**
- Create: `src/app/(protected)/dashboard/bible/components/BookmarksByBook.tsx`
- Create: `src/app/(protected)/dashboard/bible/components/BookBookmarksModal.tsx`
- Modify: `src/app/(protected)/dashboard/bible/page.tsx`
- Delete: `src/app/(protected)/dashboard/bible/components/BookmarksStrip.tsx`

**Interfaces:**
- Consumes: `groupByBook`, `BookmarkGroup`, `formatBookmarkRef`, `bookmarkHref` (Tasks 1–3); store `items/status/load` (Task 4); `getBook` de `@/lib/bible/loader`; `findBookById` de `@/lib/bible/catalog`.
- Produces: `BookmarksByBook()` (sem props); `BookBookmarksModal({ group: BookmarkGroup<Timestamp> | null; open: boolean; onOpenChange: (open: boolean) => void })`.

- [ ] **Step 1: Criar `BookBookmarksModal.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Timestamp } from 'firebase/firestore'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { bookmarkHref, formatBookmarkRef, type BookmarkGroup } from '@/lib/bible/bookmarks'
import { findBookById } from '@/lib/bible/catalog'
import { getBook } from '@/lib/bible/loader'

interface BookBookmarksModalProps {
  /** Mantido pelo pai durante o fechamento, para o conteúdo não sumir na animação. */
  group: BookmarkGroup<Timestamp> | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type BookText = { slug: string; chapters: string[][] } | { slug: string; error: true }

export function BookBookmarksModal({ group, open, onOpenChange }: BookBookmarksModalProps) {
  const router = useRouter()
  const book = group ? findBookById(group.bookId) : null
  const [text, setText] = useState<BookText | null>(null)

  useEffect(() => {
    if (!open || !book) return
    let cancelled = false
    getBook(book.slug)
      .then((b) => {
        if (!cancelled) setText({ slug: book.slug, chapters: b.chapters })
      })
      .catch(() => {
        if (!cancelled) setText({ slug: book.slug, error: true })
      })
    return () => {
      cancelled = true
    }
  }, [open, book])

  const loaded = text && book && text.slug === book.slug ? text : null
  const excerpt = (chapter: number, verses: number[]) => {
    if (!loaded) return '…'
    if ('error' in loaded) return 'Texto indisponível offline'
    return verses.map((v) => loaded.chapters[chapter - 1]?.[v - 1] ?? '').join(' ')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="sheet" className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-base font-black uppercase tracking-tight md:text-2xl">
            {book?.name ?? ''}
          </DialogTitle>
          <DialogDescription className="text-[10px] font-medium md:text-sm">
            {group?.count} {group?.count === 1 ? 'marcador' : 'marcadores'}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3">
          {group?.bookmarks.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false)
                  router.push(bookmarkHref(b))
                }}
                className="w-full space-y-2 rounded-2xl border border-slate-200 p-4 text-left transition-colors hover:border-amber-400 dark:border-slate-800"
              >
                <span className="block text-sm font-bold text-slate-900 dark:text-white">{formatBookmarkRef(b)}</span>
                <span className="line-clamp-3 block font-serif text-sm italic text-slate-600 dark:text-slate-300">
                  {excerpt(b.chapter, b.verses)}
                </span>
                {b.note && (
                  <span className="block whitespace-pre-line rounded-xl bg-amber-50 p-3 text-sm text-slate-700 dark:bg-amber-900/15 dark:text-slate-200">
                    {b.note}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Criar `BookmarksByBook.tsx`**

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bookmark } from 'lucide-react'
import dayjs from '@/lib/dayjs'
import { groupByBook } from '@/lib/bible/bookmarks'
import { findBookById } from '@/lib/bible/catalog'
import { useAuth } from '@/store/useAuth'
import { useBibleBookmarks } from '@/store/useBibleBookmarks'
import { BookBookmarksModal } from './BookBookmarksModal'

export function BookmarksByBook() {
  const { currentUser } = useAuth()
  const { items, status, load } = useBibleBookmarks()
  // bookId fica guardado ao fechar, para o modal não esvaziar durante a animação de saída
  const [modal, setModal] = useState<{ bookId: string | null; open: boolean }>({ bookId: null, open: false })

  useEffect(() => {
    if (currentUser) load(currentUser.uid)
  }, [currentUser, load])

  const groups = useMemo(() => groupByBook(items), [items])
  const modalGroup = groups.find((g) => g.bookId === modal.bookId) ?? null

  if (status === 'error') {
    return <p className="text-sm text-slate-400">Não foi possível carregar seus marcadores agora.</p>
  }
  if (groups.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Meus marcadores</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {groups.map((group) => (
          <button
            key={group.bookId}
            type="button"
            onClick={() => setModal({ bookId: group.bookId, open: true })}
            className="flex flex-col gap-1 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-left transition-colors hover:border-amber-400 dark:border-amber-900/50 dark:bg-amber-900/10"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300">
              <Bookmark className="h-4 w-4 shrink-0 fill-amber-500 text-amber-500" />
              <span className="truncate">{findBookById(group.bookId)?.name ?? group.bookId}</span>
            </span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {group.count} {group.count === 1 ? 'marcador' : 'marcadores'}
            </span>
            {group.withNote > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">{group.withNote} com nota</span>
            )}
            <span className="text-[11px] text-slate-400">{dayjs(group.lastActivity).fromNow()}</span>
          </button>
        ))}
      </div>

      <BookBookmarksModal
        group={modalGroup}
        open={modal.open && !!modalGroup}
        onOpenChange={(open) => setModal((m) => ({ ...m, open }))}
      />
    </section>
  )
}
```

- [ ] **Step 3: Trocar o componente na página** — em `src/app/(protected)/dashboard/bible/page.tsx`

Trocar `import { BookmarksStrip } from './components/BookmarksStrip'` por `import { BookmarksByBook } from './components/BookmarksByBook'` e `<BookmarksStrip />` por `<BookmarksByBook />`.

- [ ] **Step 4: Remover o componente antigo**

Run: `git rm "src/app/(protected)/dashboard/bible/components/BookmarksStrip.tsx"`

Run: `grep -rn "BookmarksStrip" src`
Expected: nenhuma ocorrência.

- [ ] **Step 5: Verificar**

Run: `npm run test:bible && npx tsc --noEmit && npx eslint "src/app/(protected)/dashboard/bible"`
Expected: testes PASS, `tsc` sem saída, eslint sem erros.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(protected)/dashboard/bible"
git commit -m "feat(biblia): marcadores agrupados por livro com modal de notas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Verificação final e regra do Firestore

**Files:**
- Modify: `AGENTS.md` (deste pacote `web/`, seção "Riscos de segurança conhecidos")

- [ ] **Step 1: Registrar a regra pendente** — em `web/AGENTS.md`, acrescentar ao fim da lista de "Riscos de segurança conhecidos (não resolvidos)":

```md
- `bible_bookmarks/{uid}` guarda marcadores **e anotações pessoais**: a privacidade depende da regra `allow read, write: if request.auth != null && request.auth.uid == uid;` estar aplicada no console (ver `docs/superpowers/specs/2026-10-14-biblia-marcadores-notas-design.md`).
```

- [ ] **Step 2: Rodar a verificação completa**

Run: `npm run test:bible && npx tsc --noEmit && npm run lint`
Expected: testes PASS, `tsc` sem saída, lint com **0 errors** (avisos antigos aceitos).

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: registra regra de privacidade dos marcadores da Bíblia

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Entregar ao usuário o roteiro de teste no aparelho**

- Tocar 3 versículos fora de ordem → barra mostra a referência em ordem crescente; ✕ limpa.
- ✓ → Marcar → sublinhado nos 3 e um ícone 🔖 só no último.
- Selecionar um versículo vizinho + um já marcado → ✓ mostra aviso de união → Adicionar nota → Salvar → ícone vira 📝.
- Tocar no trecho marcado (sem seleção) → sheet com a nota; Editar nota; Remover pede confirmação.
- Tela principal → card do livro com contagem e "com nota" → modal → tocar no item abre o capítulo destacando o trecho todo.
- Aplicar a regra do Firestore no console.
