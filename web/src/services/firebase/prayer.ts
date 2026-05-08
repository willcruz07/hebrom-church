import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { PrayerRequest } from '@/types';

const COLLECTION_NAME = 'prayer_requests';

export const prayerService = {
  async getPrayers() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PrayerRequest[];
    } catch (error) {
      console.error('Error getting prayers:', error);
      throw error;
    }
  },

  async createRequest(requestData: Omit<PrayerRequest, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...requestData,
        created_at: Date.now(),
        updated_at: Date.now(),
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
        updated_at: Date.now(),
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

  subscribeToPrayers(callback: (prayers: PrayerRequest[]) => void) {
    const q = query(
      collection(db, COLLECTION_NAME), 
      orderBy('created_at', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const prayers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PrayerRequest[];
      callback(prayers);
    }, (error) => {
      console.error('Error subscribing to prayers:', error);
    });
  }
};
