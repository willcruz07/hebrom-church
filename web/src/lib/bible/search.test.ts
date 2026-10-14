import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findMatch, normalize } from './text.ts'
import { isWordQuery, searchVerses } from './search.ts'
import type { BibleBookText } from './types.ts'

const books: BibleBookText[] = [
  {
    id: 'GEN',
    slug: 'genesis',
    name: 'Gênesis',
    chapters: [['No princípio criou Deus os céus e a terra.', 'o Espírito de Deus pairava sobre a face das águas.']],
  },
  { id: 'JHN', slug: 'joao', name: 'João', chapters: [['No princípio era o Verbo.'], ['Disse-lhe Jesus.']] },
]

test('normalize tira acento e maiúscula', () => {
  assert.equal(normalize('ÁGUAS Espírito'), 'aguas espirito')
})

test('busca ignora acento e maiúscula', () => {
  const hits = searchVerses(books, 'ESPIRITO')
  assert.deepEqual(hits, [
    { bookId: 'GEN', chapter: 1, verse: 2, text: 'o Espírito de Deus pairava sobre a face das águas.' },
  ])
})

test('busca na ordem dos livros e respeita o limite', () => {
  assert.deepEqual(
    searchVerses(books, 'princípio').map((h) => `${h.bookId} ${h.chapter}:${h.verse}`),
    ['GEN 1:1', 'JHN 1:1'],
  )
  assert.equal(searchVerses(books, 'principio', 1).length, 1)
})

test('termo curto não busca', () => {
  assert.deepEqual(searchVerses(books, 'de'), [])
  assert.deepEqual(searchVerses(books, '   '), [])
})

test('consulta com número é referência, não busca por palavra', () => {
  assert.equal(isWordQuery('ansiedade'), true)
  assert.equal(isWordQuery('Espírito Santo'), true)
  assert.equal(isWordQuery('jo 3:16'), false)
  assert.equal(isWordQuery('1co13'), false)
  assert.equal(isWordQuery('de'), false)
})

test('findMatch aponta a posição no texto original', () => {
  const text = 'o Espírito de Deus'
  assert.deepEqual(findMatch(text, 'espirito'), [2, 10])
  assert.equal(text.slice(2, 10), 'Espírito')
  assert.equal(findMatch(text, 'água'), null)
})
