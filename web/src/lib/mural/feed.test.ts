import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { FeedPost } from '../../types/index.ts'
import { isLastPage, mergeFeed, updateFeedPost } from './feed.ts'

const post = (id: string, extra: Partial<FeedPost> = {}) =>
  ({ id, title: id, ...extra }) as FeedPost
const ids = (posts: FeedPost[]) => posts.map((p) => p.id)

test('mergeFeed põe a lista ao vivo antes das páginas antigas', () => {
  assert.deepEqual(ids(mergeFeed([post('a'), post('b')], [post('c'), post('d')])), [
    'a',
    'b',
    'c',
    'd',
  ])
})

test('mergeFeed não repete post que está nas duas listas (empate na âncora)', () => {
  assert.deepEqual(ids(mergeFeed([post('a'), post('b')], [post('b'), post('c')])), ['a', 'b', 'c'])
})

test('mergeFeed usa a versão ao vivo quando o post aparece nas duas listas', () => {
  const merged = mergeFeed([post('b', { likes: ['u1'] })], [post('b', { likes: [] })])
  assert.deepEqual(merged[0].likes, ['u1'])
})

test('mergeFeed com listas vazias', () => {
  assert.deepEqual(mergeFeed([], []), [])
  assert.deepEqual(ids(mergeFeed([], [post('x')])), ['x'])
})

test('isLastPage: página incompleta encerra o mural', () => {
  assert.equal(isLastPage(15, 15), false)
  assert.equal(isLastPage(14, 15), true)
  assert.equal(isLastPage(0, 15), true)
})

test('updateFeedPost altera só o post indicado e mantém a ordem', () => {
  const list = [post('a'), post('b', { likes: [] }), post('c')]
  const next = updateFeedPost(list, 'b', (p) => ({ ...p, likes: ['u1'] }))
  assert.deepEqual(ids(next), ['a', 'b', 'c'])
  assert.deepEqual(next[1].likes, ['u1'])
  assert.equal(next[0], list[0])
})

test('updateFeedPost devolve a mesma lista quando o post não está nela', () => {
  const list = [post('a')]
  assert.equal(
    updateFeedPost(list, 'z', (p) => p),
    list,
  )
})
