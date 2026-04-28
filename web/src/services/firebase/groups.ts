import { ChurchGroup } from '@/types';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from './config';

export const getGroups = async (): Promise<ChurchGroup[]> => {
  try {
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChurchGroup[];
  } catch (error) {
    console.error('Erro ao buscar grupos:', error);
    return [];
  }
};

export const createGroup = async (name: string, description?: string): Promise<void> => {
  try {
    await addDoc(collection(db, 'groups'), {
      name,
      description: description || '',
      created_at: Date.now()
    });
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    throw new Error('Erro ao salvar grupo.');
  }
};
