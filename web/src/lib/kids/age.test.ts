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
