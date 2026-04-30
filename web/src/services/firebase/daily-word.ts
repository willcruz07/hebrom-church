import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  Timestamp,
  doc,
  deleteDoc,
} from 'firebase/firestore'
import { db } from './config'
import { DailyWord } from '@/types'

const DAILY_WORD_COLLECTION = 'daily_words'

export const createDailyWord = async (data: Omit<DailyWord, 'id' | 'created_at'>) => {
  const docRef = await addDoc(collection(db, DAILY_WORD_COLLECTION), {
    ...data,
    created_at: Timestamp.now(),
  })
  return docRef.id
}

export const getDailyWord = async (date: string): Promise<DailyWord | null> => {
  const q = query(
    collection(db, DAILY_WORD_COLLECTION),
    where('publish_date', '==', date),
    limit(1)
  )
  
  const querySnapshot = await getDocs(q)
  if (querySnapshot.empty) return null
  
  const doc = querySnapshot.docs[0]
  return { id: doc.id, ...doc.data() } as DailyWord
}

export const getDailyWords = async (count: number = 30): Promise<DailyWord[]> => {
  const q = query(
    collection(db, DAILY_WORD_COLLECTION),
    orderBy('publish_date', 'desc'),
    limit(count)
  )
  
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyWord))
}


export const deleteDailyWord = async (id: string) => {
  await deleteDoc(doc(db, DAILY_WORD_COLLECTION, id))
}
