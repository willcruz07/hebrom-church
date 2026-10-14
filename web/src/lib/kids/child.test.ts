import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emailLookupCandidates, normalizeChild, normalizeEmail, toChildFields } from './child.ts'

test('toChildFields apara, limpa a anamnese e omite observação vazia', () => {
  const fields = toChildFields({
    name: '  Lucas  ',
    birth_date: '2022-03-10',
    health: { food_allergy: ' amendoim ', asthma: true, drug_allergy: '' },
    notes: '   ',
    photo_consent: true,
    guardian_uids: ['u1', 'u2', 'u1'],
  })
  assert.deepEqual(fields, {
    name: 'Lucas',
    birth_date: '2022-03-10',
    health: { food_allergy: 'amendoim', asthma: true },
    photo_consent: true,
    guardian_uids: ['u1', 'u2'],
  })
  assert.equal('notes' in fields, false)
  assert.equal(toChildFields({ ...fieldsForm(), notes: ' oi ' }).notes, 'oi')
})

function fieldsForm() {
  return { name: 'A', birth_date: '2022-03-10', health: {}, notes: '', photo_consent: false, guardian_uids: ['u1'] }
}

test('normalizeChild lê um documento válido', () => {
  const created = { at: 1 }
  const child = normalizeChild('c1', {
    name: ' Lucas ',
    birth_date: '2022-03-10',
    guardian_uids: ['u1', 'u1', 'u2'],
    health: { asthma: true, lixo: true },
    photo_consent: true,
    notes: 'gosta de desenhar',
    photo_url: 'https://x/y.jpg',
    is_visitor: false,
    created_by: 'u1',
    created_at: created,
  })
  assert.deepEqual(child, {
    id: 'c1',
    name: 'Lucas',
    birth_date: '2022-03-10',
    guardian_uids: ['u1', 'u2'],
    health: { asthma: true },
    photo_consent: true,
    notes: 'gosta de desenhar',
    photo_url: 'https://x/y.jpg',
    is_visitor: false,
    created_by: 'u1',
    created_at: created,
  })
})

test('normalizeChild descarta documentos corrompidos', () => {
  const base = { name: 'Lucas', birth_date: '2022-03-10', guardian_uids: ['u1'] }
  assert.equal(normalizeChild('c', null), null)
  assert.equal(normalizeChild('c', { ...base, guardian_uids: undefined }), null)
  assert.equal(normalizeChild('c', { ...base, guardian_uids: [] }), null)
  assert.equal(normalizeChild('c', { ...base, name: '  ' }), null)
  assert.equal(normalizeChild('c', { ...base, birth_date: '2022-02-30' }), null)
  const minimal = normalizeChild('c', base)
  assert.equal(minimal?.photo_consent, false)
  assert.equal(minimal && 'notes' in minimal, false)
  assert.equal(minimal && 'photo_url' in minimal, false)
})

test('normalizeEmail apara e põe em minúsculas', () => {
  assert.equal(normalizeEmail(' Maria@Gmail.com '), 'maria@gmail.com')
})

test('emailLookupCandidates procura em minúsculas e como digitado (contas antigas com maiúsculas)', () => {
  assert.deepEqual(emailLookupCandidates(' Maria.Souza@Gmail.com '), ['maria.souza@gmail.com', 'Maria.Souza@Gmail.com'])
  assert.deepEqual(emailLookupCandidates('ana@x.com'), ['ana@x.com'])
})
