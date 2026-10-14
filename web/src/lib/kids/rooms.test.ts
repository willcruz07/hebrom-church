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
