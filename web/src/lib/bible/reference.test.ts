import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseReference, referenceHref } from './reference.ts'

const simple = (input: string) => {
  const r = parseReference(input)
  return r && { id: r.book.id, chapter: r.chapter, verse: r.verse }
}

test('referências comuns', () => {
  assert.deepEqual(simple('jo 3:16'), { id: 'JHN', chapter: 3, verse: 16 })
  assert.deepEqual(simple('João 3:16'), { id: 'JHN', chapter: 3, verse: 16 })
  assert.deepEqual(simple('joao 3'), { id: 'JHN', chapter: 3, verse: undefined })
  assert.deepEqual(simple('1co13'), { id: '1CO', chapter: 13, verse: undefined })
  assert.deepEqual(simple('1 Co 13:4'), { id: '1CO', chapter: 13, verse: 4 })
  assert.deepEqual(simple('Sl 23'), { id: 'PSA', chapter: 23, verse: undefined })
  assert.deepEqual(simple('gen 1.1'), { id: 'GEN', chapter: 1, verse: 1 })
  assert.deepEqual(simple('apoc 22:21'), { id: 'REV', chapter: 22, verse: 21 })
  assert.deepEqual(simple('joão 3:16-18'), { id: 'JHN', chapter: 3, verse: 16 })
  assert.deepEqual(simple('filip 4:13'), { id: 'PHP', chapter: 4, verse: 13 })
  assert.deepEqual(simple('Romanos'), { id: 'ROM', chapter: undefined, verse: undefined })
})

test('jo é João e jó é Jó', () => {
  assert.equal(simple('jo 1:1')?.id, 'JHN')
  assert.equal(simple('jó 1:1')?.id, 'JOB')
  assert.equal(simple('job 1')?.id, 'JOB')
})

test('livro de um capítulo só: o número é o versículo', () => {
  assert.deepEqual(simple('judas 3'), { id: 'JUD', chapter: 1, verse: 3 })
  assert.deepEqual(simple('3jo 4'), { id: '3JN', chapter: 1, verse: 4 })
  assert.deepEqual(simple('judas 1:3'), { id: 'JUD', chapter: 1, verse: 3 })
})

test('entradas inválidas', () => {
  assert.equal(parseReference(''), null)
  assert.equal(parseReference('amor'), null)
  assert.equal(parseReference('deus amou'), null)
  assert.equal(parseReference('jo 99'), null)
  assert.equal(parseReference('jo 3:99'), null)
  assert.equal(parseReference('xyz 1'), null)
  assert.equal(parseReference('fi 1'), null)
})

test('link da referência', () => {
  assert.equal(referenceHref(parseReference('jo 3:16')!), '/dashboard/bible/joao/3?v=16')
  assert.equal(referenceHref(parseReference('jo 3')!), '/dashboard/bible/joao/3')
  assert.equal(referenceHref(parseReference('joão')!), '/dashboard/bible/joao')
})
