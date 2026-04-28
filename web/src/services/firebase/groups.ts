import { ChurchGroup } from '@/types';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

// ... (keep existing)

export const updateGroup = async (id: string, data: Partial<ChurchGroup>): Promise<void> => {
  try {
    const groupRef = doc(db, 'groups', id);
    await updateDoc(groupRef, {
      ...data,
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao atualizar grupo:', error);
    throw new Error('Erro ao atualizar grupo.');
  }
};

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

export const deleteGroup = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'groups', id));
  } catch (error) {
    console.error('Erro ao excluir grupo:', error);
    throw new Error('Erro ao excluir grupo.');
  }
};
