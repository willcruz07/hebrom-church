import type { FeedPost } from '../../types/index.ts'

/**
 * Lista do mural = posts ao vivo (desde a âncora, em tempo real) + páginas antigas
 * (antes da âncora, buscadas uma vez). Um empate de `created_at` na âncora pode trazer o
 * mesmo post nas duas — vale a versão ao vivo, que é a mais atual.
 */
export function mergeFeed(live: FeedPost[], older: FeedPost[]): FeedPost[] {
  const liveIds = new Set(live.map((p) => p.id))
  return [...live, ...older.filter((p) => !liveIds.has(p.id))]
}

/** Página com menos posts que o tamanho pedido = não há nada mais antigo. */
export function isLastPage(received: number, pageSize: number): boolean {
  return received < pageSize
}

export function updateFeedPost(
  posts: FeedPost[],
  id: string,
  update: (post: FeedPost) => FeedPost,
): FeedPost[] {
  if (!posts.some((p) => p.id === id)) return posts
  return posts.map((p) => (p.id === id ? update(p) : p))
}
