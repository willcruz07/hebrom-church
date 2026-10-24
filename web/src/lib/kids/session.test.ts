import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isSessionStale, passesToClose, passLabel, roomCounts, SESSION_STALE_MS, type KidPassOf, type TimestampLike } from './session.ts'

const ts = (ms: number): TimestampLike => ({ toMillis: () => ms })
const fmt = (ms: number) => `t${ms}`
const pass = (over: Partial<KidPassOf<TimestampLike>> = {}): KidPassOf<TimestampLike> => ({
  child_id: 'c1',
  child_name: 'Lucas',
  birth_date: '2022-01-01',
  room: 'kids',
  guardian_uids: ['pai', 'mae'],
  is_visitor: false,
  status: 'in',
  dropped_by: { uid: 'pai', name: 'João' },
  checked_in_at: ts(100),
  checked_in_by: { uid: 'tia', name: 'Ana' },
  checkin_via: 'qr',
  ...over,
})

test('isSessionStale na fronteira de 12 h', () => {
  assert.equal(isSessionStale(0, SESSION_STALE_MS), false)
  assert.equal(isSessionStale(0, SESSION_STALE_MS + 1), true)
})

test('roomCounts conta só quem está na sala', () => {
  assert.deepEqual(
    roomCounts([
      { status: 'in', room: 'kids' },
      { status: 'in', room: 'kids' },
      { status: 'out', room: 'bercario' },
      { status: 'no_checkout', room: 'juniores' },
      { status: 'in', room: 'outside' },
    ]),
    { bercario: 0, kids: 2, juniores: 0, outside: 1 },
  )
})

test('passLabel na sala: "você" para quem deixou', () => {
  assert.equal(passLabel(pass(), 'pai', fmt), 'Na sala Kids desde t100 · deixado por você')
  assert.equal(passLabel(pass(), 'mae', fmt), 'Na sala Kids desde t100 · deixado por João')
  assert.equal(passLabel(pass({ room: 'bercario' }), 'mae', fmt), 'Na sala Berçário desde t100 · deixado por João')
})

test('passLabel retirado: "você", outro responsável ou outra pessoa', () => {
  const out = { status: 'out' as const, checked_out_at: ts(200) }
  assert.equal(passLabel(pass({ ...out, picked_by: { uid: 'mae', name: 'Maria' } }), 'pai', fmt), 'Retirado às t200 por Maria')
  assert.equal(passLabel(pass({ ...out, picked_by: { uid: 'pai', name: 'João' } }), 'pai', fmt), 'Retirado às t200 por você')
  assert.equal(passLabel(pass({ ...out, picked_by: { name: 'avó Rosa' } }), 'pai', fmt), 'Retirado às t200 por avó Rosa')
})

test('passLabel sem passagem e saída não registrada', () => {
  assert.equal(passLabel(null, 'pai', fmt), 'Fora da sala')
  assert.equal(passLabel(pass({ status: 'no_checkout' }), 'pai', fmt), 'Saída não registrada')
})

test('passesToClose pega só quem ainda está na sala', () => {
  const passes = [pass({ child_id: 'a' }), pass({ child_id: 'b', status: 'out' }), pass({ child_id: 'c', status: 'no_checkout' })]
  assert.deepEqual(passesToClose(passes).map((p) => p.child_id), ['a'])
})
