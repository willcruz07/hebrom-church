import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  cleanNote,
  findBookmarkForVerse,
  MAX_BIBLE_BOOKMARKS,
  mergeSelection,
  overlappingBookmarks,
  setNote,
  withoutBookmark,
  groupByBook,
  buildQuote,
  bookmarkHref,
  newBookmarkId,
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

test('parseVerseParam ignora ?v repetido (Next entrega array)', () => {
  assert.deepEqual(parseVerseParam(['1', '2'] as unknown as string), [])
})

test('newBookmarkId funciona sem crypto.randomUUID (http na rede local)', () => {
  let n = 0
  const insecure = { getRandomValues: <T extends ArrayBufferView | null>(a: T) => {
    new Uint8Array((a as unknown as Uint8Array).buffer).forEach((_, i, arr) => (arr[i] = (n++ * 37 + i) % 256))
    return a
  } }
  const a = newBookmarkId(insecure)
  const b = newBookmarkId(insecure)
  assert.match(a, /^[0-9a-f]{32}$/)
  assert.notEqual(a, b)
  assert.equal(newBookmarkId({ ...insecure, randomUUID: () => 'uuid-1' }), 'uuid-1')
})
