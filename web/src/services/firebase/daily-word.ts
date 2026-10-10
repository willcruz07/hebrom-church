import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  doc,
  deleteDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore'
import { db } from './config'
import { notifyNewPost } from './notify'
import { DailyWord } from '@/types'
import dayjs from '@/lib/dayjs'

const DAILY_WORD_COLLECTION = 'daily_words'

const today = () => dayjs().format('YYYY-MM-DD')

const toDailyWord = (d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as DailyWord

const getWordsOn = (date: string) =>
  getDocs(query(collection(db, DAILY_WORD_COLLECTION), where('publish_date', '==', date)))

/** Já existe palavra lançada pelo pastor nessa data? (devocional automático não conta, é substituído) */
export const isDailyWordDateTaken = async (date: string): Promise<boolean> => {
  const snapshot = await getWordsOn(date)
  return snapshot.docs.some((d) => !d.data().is_auto)
}

/**
 * Lança uma Palavra do Dia. Se já houver um devocional automático na data, ele é substituído.
 * Só notifica na hora se for para hoje — as agendadas são notificadas no dia pelo job
 * `dailyWord` do backend (07:00).
 */
export const createDailyWord = async (data: Omit<DailyWord, 'id' | 'created_at'>) => {
  const existing = await getWordsOn(data.publish_date)
  await Promise.all(existing.docs.filter((d) => d.data().is_auto).map((d) => deleteDoc(d.ref)))

  const docRef = await addDoc(collection(db, DAILY_WORD_COLLECTION), {
    ...data,
    created_at: serverTimestamp(),
  })

  if (data.publish_date === today()) {
    const excerpt = data.content.substring(0, 100) + (data.content.length > 100 ? '...' : '')
    notifyNewPost(
      '📖 Palavra do Dia',
      data.reference ? `${excerpt} (${data.reference})` : excerpt,
      '/dashboard/daily-word',
    )
  }

  return docRef.id
}

/** Palavra da data — a do pastor tem prioridade sobre o devocional automático. */
export const getDailyWord = async (date: string): Promise<DailyWord | null> => {
  const words = (await getWordsOn(date)).docs.map(toDailyWord)
  return words.find((w) => !w.is_auto) ?? words[0] ?? null
}

export type DailyWordCursor = QueryDocumentSnapshot<DocumentData> | null

/** Palavras já publicadas (hoje para trás), paginadas por cursor — mais recente primeiro. */
export const getPublishedDailyWords = async (
  pageSize = 10,
  cursor: DailyWordCursor = null,
): Promise<{ words: DailyWord[]; cursor: DailyWordCursor }> => {
  const q = query(
    collection(db, DAILY_WORD_COLLECTION),
    where('publish_date', '<=', today()),
    orderBy('publish_date', 'desc'),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(pageSize),
  )

  const snapshot = await getDocs(q)
  return {
    words: snapshot.docs.map(toDailyWord),
    cursor: snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : null,
  }
}

/** Palavras agendadas para os próximos dias (só liderança vê). */
export const getScheduledDailyWords = async (): Promise<DailyWord[]> => {
  const q = query(
    collection(db, DAILY_WORD_COLLECTION),
    where('publish_date', '>', today()),
    orderBy('publish_date', 'asc'),
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(toDailyWord)
}

export const deleteDailyWord = async (id: string) => {
  await deleteDoc(doc(db, DAILY_WORD_COLLECTION, id))
}
