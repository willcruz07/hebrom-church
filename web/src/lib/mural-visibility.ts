import { FeedPost } from '@/types'
import dayjs from '@/lib/dayjs'
import { toJsDate } from '@/lib/utils'

const today = () => dayjs().format('YYYY-MM-DD')

/** Posts de aniversário antigos (antes do campo `kind`) são reconhecidos pelo autor "system". */
export function isBirthdayPost(post: FeedPost): boolean {
  return post.kind === 'birthday' || (post.author.uid === 'system' && /anivers/i.test(post.title))
}

/** Dia (YYYY-MM-DD) a que o post se refere. Posts antigos de aniversário caem no dia da criação. */
function eventDate(post: FeedPost): string | undefined {
  if (post.event_date) return post.event_date
  if (isBirthdayPost(post)) return dayjs(toJsDate(post.created_at)).format('YYYY-MM-DD')
  return undefined
}

/**
 * Regras de validade do mural:
 * - Aniversário: só aparece no mês vigente.
 * - Aviso com data de evento: some quando a data passa.
 * - Aviso sem data: sempre visível.
 */
export function isPostActive(post: FeedPost, now = today()): boolean {
  const date = eventDate(post)
  if (!date) return true
  if (isBirthdayPost(post)) return date.slice(0, 7) === now.slice(0, 7)
  return date >= now
}

/** Aniversário de hoje fica fixado no topo; o resto segue a ordem original (mais recente primeiro). */
export function sortMuralPosts(posts: FeedPost[], now = today()): FeedPost[] {
  const isTodayBirthday = (p: FeedPost) => isBirthdayPost(p) && eventDate(p) === now
  return [...posts.filter(isTodayBirthday), ...posts.filter((p) => !isTodayBirthday(p))]
}
