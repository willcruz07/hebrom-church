import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hasErrors, validateChild, type ChildFormValues } from './validate.ts'

const TODAY = '2026-10-14'
const form = (over: Partial<ChildFormValues> = {}): ChildFormValues => ({
  name: 'Lucas',
  birth_date: '2022-03-10',
  health: {},
  notes: '',
  photo_consent: false,
  guardian_uids: ['u1'],
  ...over,
})

test('formulário válido não tem erros', () => {
  assert.deepEqual(validateChild(form(), TODAY), {})
  assert.equal(hasErrors(validateChild(form(), TODAY)), false)
})

test('nome obrigatório e com limite', () => {
  assert.equal(validateChild(form({ name: '   ' }), TODAY).name, 'Informe o nome.')
  assert.equal(validateChild(form({ name: 'a'.repeat(81) }), TODAY).name, 'Máximo de 80 caracteres.')
})

test('data de nascimento inválida, futura ou com 18+ anos', () => {
  for (const birth_date of ['', '2026-02-30', '2026-10-15', '2008-10-14']) {
    assert.equal(validateChild(form({ birth_date }), TODAY).birth_date, 'Data de nascimento inválida.', birth_date)
  }
  assert.equal(validateChild(form({ birth_date: '2008-10-15' }), TODAY).birth_date, undefined) // 17 anos
  assert.equal(validateChild(form({ birth_date: TODAY }), TODAY).birth_date, undefined)
})

test('"qual?" vazio ou longo nos itens marcados', () => {
  const errors = validateChild(form({ health: { food_allergy: '  ', drug_allergy: 'x'.repeat(121), asthma: true } }), TODAY)
  assert.deepEqual(errors.health, { food_allergy: 'Informe qual.', drug_allergy: 'Máximo de 120 caracteres.' })
})

test('responsáveis: de 1 a 4', () => {
  assert.equal(validateChild(form({ guardian_uids: [] }), TODAY).guardians, 'Informe pelo menos um responsável.')
  assert.equal(
    validateChild(form({ guardian_uids: ['a', 'b', 'c', 'd', 'e'] }), TODAY).guardians,
    'Máximo de 4 responsáveis.',
  )
  assert.equal(validateChild(form({ guardian_uids: ['a', 'a'] }), TODAY).guardians, undefined)
})

test('observações até 1000', () => {
  assert.equal(validateChild(form({ notes: 'a'.repeat(1001) }), TODAY).notes, 'Máximo de 1000 caracteres.')
})

test('nova criança precisa ter o usuário entre os responsáveis', () => {
  const errors = validateChild(form({ guardian_uids: ['outro'] }), TODAY, { requiredGuardian: 'eu' })
  assert.equal(errors.guardians, 'Você precisa ser um dos responsáveis.')
  assert.equal(validateChild(form({ guardian_uids: ['eu', 'outro'] }), TODAY, { requiredGuardian: 'eu' }).guardians, undefined)
  // Na edição (sem requiredGuardian) o responsável pode sair
  assert.equal(validateChild(form({ guardian_uids: ['outro'] }), TODAY).guardians, undefined)
})
