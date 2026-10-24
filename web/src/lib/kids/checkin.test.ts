import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCheckIn,
  buildCheckOut,
  buildReentry,
  checkInCandidates,
  childrenOf,
  droppedByOptions,
  roomFor,
  selectableEntries,
  statusRows,
  type ChildLike,
} from './checkin.ts'
import { QUICK_HEALTH_ITEM_IDS } from './health.ts'

const TODAY = '2026-10-14'
const kid = (over: Partial<ChildLike> = {}): ChildLike => ({
  id: 'c1',
  name: 'Lucas',
  birth_date: '2022-01-01',
  guardian_uids: ['pai'],
  is_visitor: false,
  ...over,
})
const now = { at: 500 }
const staff = { uid: 'tia', name: 'Ana' }

test('roomFor usa "outside" acima de 12 anos', () => {
  assert.equal(roomFor('2025-01-01', TODAY), 'bercario')
  assert.equal(roomFor('2010-01-01', TODAY), 'outside')
})

test('childrenOf e checkInCandidates: do mais velho ao mais novo, marcando quem já está na sala', () => {
  const children = [
    kid({ id: 'b', birth_date: '2025-01-01' }),
    kid({ id: 'a', birth_date: '2020-01-01' }),
    kid({ id: 'x', guardian_uids: ['outro'] }),
  ]
  const mine = childrenOf(children, 'pai')
  assert.deepEqual(mine.map((c) => c.id), ['a', 'b'])
  const candidates = checkInCandidates(mine, [{ child_id: 'a', status: 'in' }, { child_id: 'b', status: 'out' }], TODAY)
  assert.deepEqual(
    candidates.map((c) => [c.child.id, c.suggestedRoom, c.alreadyIn]),
    [
      ['a', 'kids', true],
      ['b', 'bercario', false],
    ],
  )
})

test('droppedByOptions: adulto escaneado primeiro, sem repetir', () => {
  const children = [kid({ guardian_uids: ['pai', 'mae'] }), kid({ guardian_uids: ['mae', 'avo'] })]
  assert.deepEqual(droppedByOptions(children, { pai: 'João', mae: 'Maria' }, 'mae'), [
    { uid: 'mae', name: 'Maria' },
    { uid: 'pai', name: 'João' },
  ])
})

test('buildCheckIn sem foto não tem chave child_photo_url nem campos de saída', () => {
  const pass = buildCheckIn({ child: kid(), room: 'kids', droppedBy: { uid: 'pai', name: 'João' }, staff, via: 'qr', now })
  assert.deepEqual(pass, {
    child_id: 'c1',
    child_name: 'Lucas',
    birth_date: '2022-01-01',
    room: 'kids',
    guardian_uids: ['pai'],
    is_visitor: false,
    status: 'in',
    dropped_by: { uid: 'pai', name: 'João' },
    checked_in_at: now,
    checked_in_by: staff,
    checkin_via: 'qr',
  })
  assert.equal(Object.values(pass).includes(undefined as never), false)
  const withPhoto = buildCheckIn({ child: kid({ photo_url: 'https://x/y.jpg' }), room: 'kids', droppedBy: staff, staff, via: 'manual', now })
  assert.equal(withPhoto.child_photo_url, 'https://x/y.jpg')
})

test('buildReentry guarda a ida anterior com saída e quem buscou', () => {
  const first = { at: 100 }
  const out = { at: 200 }
  const existing = {
    ...buildCheckIn({ child: kid(), room: 'kids' as const, droppedBy: { uid: 'pai', name: 'João' }, staff, via: 'qr' as const, now: first }),
    ...buildCheckOut({ pickedBy: { uid: 'mae', name: 'Maria' }, staff, via: 'qr', now: out }),
  }
  const again = buildReentry(existing, { child: kid(), room: 'juniores', droppedBy: { uid: 'mae', name: 'Maria' }, staff, via: 'qr', now })
  assert.equal(again.status, 'in')
  assert.equal(again.room, 'juniores')
  assert.equal(again.checked_in_at, now)
  assert.equal('checked_out_at' in again, false)
  assert.deepEqual(again.previous_passes, [
    { room: 'kids', dropped_by: { uid: 'pai', name: 'João' }, checked_in_at: first, checked_out_at: out, picked_by: { uid: 'mae', name: 'Maria' } },
  ])
})

test('buildCheckOut com "Outra pessoa": sem uid e nome aparado', () => {
  assert.deepEqual(buildCheckOut({ pickedBy: { name: '  avó Rosa ' }, staff, via: 'manual', now }), {
    status: 'out',
    checked_out_at: now,
    checked_out_by: staff,
    checkout_via: 'manual',
    picked_by: { name: 'avó Rosa' },
  })
})

test('QUICK_HEALTH_ITEM_IDS: alertas e lanche', () => {
  assert.deepEqual([...QUICK_HEALTH_ITEM_IDS], ['food_allergy', 'asthma', 'epilepsy', 'diabetes', 'drug_allergy', 'no_church_snack'])
})

test('droppedByOptions só oferece responsáveis com nome carregado', () => {
  const children = [kid({ guardian_uids: ['pai', 'mae'] })]
  assert.deepEqual(droppedByOptions(children, { pai: 'João' }, 'pai'), [{ uid: 'pai', name: 'João' }])
  assert.deepEqual(droppedByOptions(children, {}, 'pai'), [])
})

test('selectableEntries ignora quem já entrou (registro de outra tia)', () => {
  const a = kid({ id: 'a' })
  const b = kid({ id: 'b' })
  const candidates = [
    { child: a, suggestedRoom: 'kids' as const, alreadyIn: true },
    { child: b, suggestedRoom: 'bercario' as const, alreadyIn: false },
  ]
  assert.deepEqual(selectableEntries({ a: 'kids', b: 'juniores' }, candidates), [{ child: b, room: 'juniores' }])
})

test('statusRows mostra passagens de crianças que ainda não estão na lista (visitante recém-cadastrado)', () => {
  const rows = statusRows(
    [kid({ id: 'a', name: 'Ana' })],
    [
      { child_id: 'a', child_name: 'Ana', status: 'in' },
      { child_id: 'v', child_name: 'Vito', child_photo_url: 'https://x/v.jpg', status: 'in' },
    ],
  )
  assert.deepEqual(
    rows.map((r) => [r.id, r.name, r.photo_url ?? null, r.pass?.status ?? null]),
    [
      ['a', 'Ana', null, 'in'],
      ['v', 'Vito', 'https://x/v.jpg', 'in'],
    ],
  )
})
