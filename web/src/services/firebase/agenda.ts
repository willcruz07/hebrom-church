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
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { ChurchEvent } from '@/types';

const COLLECTION_NAME = 'events';

export const agendaService = {
  async getEvents() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        orderBy('date', 'asc'),
        orderBy('time', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChurchEvent[];
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  },

  async createEvent(eventData: Omit<ChurchEvent, 'id' | 'created_at'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...eventData,
        created_at: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  async updateEvent(id: string, eventData: Partial<ChurchEvent>) {
    try {
      const eventRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(eventRef, {
        ...eventData,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  async deleteEvent(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
};
