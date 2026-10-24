import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildQrPayload, newToken, parseQrPayload, TOKEN_BYTES } from './qr.ts'

test('newToken: 18 bytes viram 24 caracteres base64url', () => {
  assert.equal(newToken(new Uint8Array(TOKEN_BYTES)), 'A'.repeat(24))
  assert.equal(newToken(new Uint8Array(TOKEN_BYTES).fill(255)), '_'.repeat(24))
  const token = newToken(Uint8Array.from({ length: TOKEN_BYTES }, (_, i) => i * 13))
  assert.match(token, /^[A-Za-z0-9_-]{24}$/)
})

test('ida e volta do QR', () => {
  const text = buildQrPayload('uid123ABC', 'tok_en-9')
  assert.equal(text, 'HKIDS1:uid123ABC:tok_en-9')
  assert.deepEqual(parseQrPayload(text), { uid: 'uid123ABC', token: 'tok_en-9' })
})

test('parseQrPayload ignora espaços nas pontas', () => {
  assert.deepEqual(parseQrPayload('  HKIDS1:abc:def\n'), { uid: 'abc', token: 'def' })
})

test('parseQrPayload recusa o que não é do app', () => {
  for (const text of ['', 'https://hebrom.app', 'HKIDS2:abc:def', 'HKIDS1:abc', 'HKIDS1::def', 'HKIDS1:abc:', 'HKIDS1:abc:def:ghi', 'HKIDS1:a b:def', 'HKIDS1:abc:d/f']) {
    assert.equal(parseQrPayload(text), null, text)
  }
})
