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
