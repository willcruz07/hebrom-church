import { ChurchGroup } from '@/types';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from './config';
import { FIXED_GROUP_SEEDS } from '@/lib/ministry-attributions';

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

export const deleteGroup = async (id: string): Promise<void> => {
  const groupRef = doc(db, 'groups', id);
  const groupSnap = await getDoc(groupRef);

  if (groupSnap.exists() && groupSnap.data().is_fixed) {
    throw new Error('Este é um grupo fixo do sistema e não pode ser excluído.');
  }

  const usersRef = collection(db, 'users');
  const membersQuery = query(usersRef, where('sub_groups', 'array-contains', id));
  const membersSnap = await getCountFromServer(membersQuery);

  if (membersSnap.data().count > 0) {
    throw new Error('Não é possível excluir: existem membros vinculados a este grupo.');
  }

  try {
    await deleteDoc(groupRef);
  } catch (error) {
    console.error('Erro ao excluir grupo:', error);
    throw new Error('Erro ao excluir grupo.');
  }
};

export const seedFixedGroups = async (): Promise<number> => {
  const existing = await getGroups();
  const existingIds = new Set(existing.map((g) => g.id));
  let created = 0;

  for (const { id, name } of FIXED_GROUP_SEEDS) {
    if (existingIds.has(id)) continue;

    await setDoc(doc(db, 'groups', id), {
      name,
      description: '',
      is_fixed: true,
      created_at: serverTimestamp(),
    });
    created++;
  }

  return created;
};
