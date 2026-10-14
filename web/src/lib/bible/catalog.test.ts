import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BIBLE_BOOKS } from './books.generated.ts'
import {
  adjacentChapter,
  booksOf,
  chapterHref,
  findBookBySlug,
  formatRef,
  isValidVerse,
  parseRefKey,
  toRefKey,
  verseHref,
} from './catalog.ts'

test('catálogo tem 66 livros e 1189 capítulos, com slugs únicos', () => {
  assert.equal(BIBLE_BOOKS.length, 66)
  assert.equal(BIBLE_BOOKS.reduce((s, b) => s + b.verses.length, 0), 1189)
  assert.equal(new Set(BIBLE_BOOKS.map((b) => b.slug)).size, 66)
  assert.equal(booksOf('VT').length, 39)
  assert.equal(booksOf('NT').length, 27)
})

test('endereço do versículo vai e volta', () => {
  const ref = { bookId: 'JHN', chapter: 3, verse: 16 }
  assert.equal(toRefKey(ref), 'JHN.3.16')
  assert.deepEqual(parseRefKey('JHN.3.16'), ref)
  assert.equal(parseRefKey('JHN.3.99'), null)
  assert.equal(parseRefKey('XXX.1.1'), null)
  assert.equal(parseRefKey('lixo'), null)
  assert.equal(formatRef(ref), 'João 3:16')
})

test('links', () => {
  assert.equal(chapterHref('joao', 3), '/dashboard/bible/joao/3')
  assert.equal(chapterHref('joao', 3, 16), '/dashboard/bible/joao/3?v=16')
  assert.equal(verseHref({ bookId: 'PSA', chapter: 23, verse: 1 }), '/dashboard/bible/salmos/23?v=1')
})

test('validação de versículo', () => {
  const joao = findBookBySlug('joao')!
  assert.equal(isValidVerse(joao, 3, 16), true)
  assert.equal(isValidVerse(joao, 3, 0), false)
  assert.equal(isValidVerse(joao, 22, 1), false)
  assert.equal(isValidVerse(joao, 1.5, 1), false)
})

test('próximo e anterior, inclusive nas bordas', () => {
  assert.deepEqual(adjacentChapter('joao', 3, 1), { slug: 'joao', name: 'João', chapter: 4 })
  assert.deepEqual(adjacentChapter('genesis', 50, 1), { slug: 'exodo', name: 'Êxodo', chapter: 1 })
  assert.deepEqual(adjacentChapter('exodo', 1, -1), { slug: 'genesis', name: 'Gênesis', chapter: 50 })
  assert.equal(adjacentChapter('genesis', 1, -1), null)
  assert.equal(adjacentChapter('apocalipse', 22, 1), null)
  assert.equal(adjacentChapter('inexistente', 1, 1), null)
})
