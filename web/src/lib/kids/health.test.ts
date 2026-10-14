import { test } from 'node:test'
import assert from 'node:assert/strict'
import { alertsOf, cleanHealth, entriesOf, HEALTH_ITEMS } from './health.ts'

test('catálogo tem ids únicos', () => {
  const ids = HEALTH_ITEMS.map((i) => i.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('cleanHealth mantém só itens marcados, apara textos e descarta o resto', () => {
  assert.deepEqual(
    cleanHealth({
      asthma: true,
      food_allergy: '  amendoim ',
      drug_allergy: '   ',
      continuous_medication: '',
      lactose: false,
      epilepsy: 'sim',
      desconhecido: true,
    }),
    { asthma: true, food_allergy: 'amendoim' },
  )
})

test('cleanHealth: item com "qual?" desmarcado não deixa chave', () => {
  const form: Record<string, unknown> = { food_allergy: 'amendoim' }
  delete form.food_allergy
  const health = cleanHealth(form)
  assert.equal('food_allergy' in health, false)
  assert.deepEqual(health, {})
})

test('cleanHealth não devolve valores undefined e tolera lixo', () => {
  assert.deepEqual(cleanHealth(null), {})
  assert.deepEqual(cleanHealth('x'), {})
  const health = cleanHealth({ asthma: undefined, diapers: true })
  assert.deepEqual(health, { diapers: true })
  assert.equal(Object.values(health).includes(undefined as never), false)
})

test('alertsOf lista só alertas, na ordem do catálogo, com o detalhe', () => {
  assert.deepEqual(alertsOf({ diabetes: true, lactose: true, food_allergy: 'amendoim' }), [
    { id: 'food_allergy', label: 'Alergia alimentar', alert: true, detail: 'amendoim' },
    { id: 'diabetes', label: 'Diabetes', alert: true },
  ])
  assert.deepEqual(alertsOf({ lactose: true }), [])
})

test('entriesOf lista todos os marcados', () => {
  assert.deepEqual(
    entriesOf({ diapers: true, lactose: true }).map((e) => e.id),
    ['lactose', 'diapers'],
  )
})
