import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import { PrayerComment, PrayerRequest } from '@/types';
import { toJsDate } from '@/lib/utils';

const COLLECTION_NAME = 'prayer_requests';

/** Quem está lendo — define quais pedidos ele pode buscar. */
export type PrayerViewer = { uid: string; isPastor: boolean };

/**
 * Consultas que cada papel pode fazer. Confidenciais só são lidos pelo pastor e
 * pelo próprio autor — os demais buscam só pedidos abertos + os seus. As regras
 * do Firestore recusam qualquer consulta que poderia trazer confidencial alheio,
 * então nunca buscamos a coleção inteira para quem não é pastor.
 */
function queriesFor(viewer: PrayerViewer): Query<DocumentData>[] {
  const ref = collection(db, COLLECTION_NAME);
  if (viewer.isPastor) return [query(ref)];
  return [
    query(ref, where('is_confidential', '==', false)),
    query(ref, where('author_uid', '==', viewer.uid)),
  ];
}

const sortNewestFirst = (prayers: PrayerRequest[]) =>
  prayers.sort((a, b) => toJsDate(b.created_at).getTime() - toJsDate(a.created_at).getTime());

export const prayerService = {
  async getPrayers(viewer: PrayerViewer) {
    try {
      const snapshots = await Promise.all(queriesFor(viewer).map((q) => getDocs(q)));
      const byId = new Map<string, PrayerRequest>();
      snapshots.forEach((s) =>
        s.docs.forEach((d) => byId.set(d.id, { id: d.id, ...d.data() } as PrayerRequest)),
      );
      return sortNewestFirst(Array.from(byId.values()));
    } catch (error) {
      console.error('Error getting prayers:', error);
      throw error;
    }
  },

  async createRequest(
    requestData: Omit<PrayerRequest, 'id' | 'created_at' | 'updated_at'>,
  ) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...requestData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating prayer request:', error);
      throw error;
    }
  },

  async updateRequest(id: string, requestData: Partial<PrayerRequest>) {
    try {
      const requestRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(requestRef, {
        ...requestData,
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating prayer request:', error);
      throw error;
    }
  },

  async deleteRequest(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting prayer request:', error);
      throw error;
    }
  },

  async togglePraying(id: string, uid: string, isPraying: boolean) {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      praying_uids: isPraying ? arrayRemove(uid) : arrayUnion(uid),
    });
  },

  async addComment(id: string, comment: Omit<PrayerComment, 'id' | 'created_at'>) {
    const newComment: PrayerComment = {
      ...comment,
      id: Math.random().toString(36).substring(2, 9),
      // serverTimestamp() não funciona dentro de arrays
      created_at: Timestamp.now(),
    };
    await updateDoc(doc(db, COLLECTION_NAME, id), { comments: arrayUnion(newComment) });
  },

  async removeComment(id: string, comment: PrayerComment) {
    await updateDoc(doc(db, COLLECTION_NAME, id), { comments: arrayRemove(comment) });
  },

  /** Listener em tempo real com as mesmas restrições de `queriesFor`. */
  subscribeToPrayers(viewer: PrayerViewer, callback: (prayers: PrayerRequest[]) => void) {
    const results = new Map<number, PrayerRequest[]>();
    const queries = queriesFor(viewer);

    const unsubscribers = queries.map((q, index) =>
      onSnapshot(
        q,
        (snapshot) => {
          results.set(
            index,
            snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as PrayerRequest),
          );
          // Só entrega quando todas as consultas responderam, sem duplicar o próprio pedido aberto
          if (results.size < queries.length) return;
          const byId = new Map<string, PrayerRequest>();
          results.forEach((list) => list.forEach((p) => byId.set(p.id, p)));
          callback(sortNewestFirst(Array.from(byId.values())));
        },
        (error) => {
          console.error('Error subscribing to prayers:', error);
        },
      ),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  },
};
