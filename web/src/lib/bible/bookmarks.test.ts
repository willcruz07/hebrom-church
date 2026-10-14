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
