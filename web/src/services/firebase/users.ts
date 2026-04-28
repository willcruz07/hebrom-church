import { AppUser } from '@/types';
import { Timestamp, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';

export const getUserById = async (userId: string): Promise<AppUser | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const userDoc = await getDoc(docRef);

    if (userDoc.exists()) {
      return {
        ...userDoc.data(),
        uid: userDoc.id,
      } as AppUser;
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
};

export const createUser = async (userData: AppUser): Promise<void> => {
  const { uid, ...rest } = userData;

  try {
    const docRef = doc(db, 'users', uid);
    
    const newUser = {
      ...rest,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };

    await setDoc(docRef, newUser);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw new Error('Erro ao salvar dados do usuário. Tente novamente.');
  }
};

export const updateUserProfile = async (uid: string, profileData: Partial<AppUser['profile']>): Promise<void> => {
  try {
    const docRef = doc(db, 'users', uid);
    
    // Converte os campos aninhados para notação de ponto para evitar sobrescrever o objeto 'profile' inteiro
    const updateObj: Record<string, any> = {
      updated_at: Timestamp.now(),
    };
    
    Object.entries(profileData).forEach(([key, value]) => {
      updateObj[`profile.${key}`] = value;
    });

    await updateDoc(docRef, updateObj);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw new Error('Não foi possível salvar as alterações do perfil.');
  }
};

export const uploadAvatar = async (uid: string, file: File): Promise<string> => {
  try {
    // Referência única baseada no UID e timestamp
    const fileExtension = file.name.split('.').pop();
    const fileRef = ref(storage, `avatars/${uid}_${Date.now()}.${fileExtension}`);
    
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    throw new Error('Erro ao processar imagem de perfil.');
  }
};

export const initializeUserDefaults = async (userId: string): Promise<void> => {
  console.log('Inicializando defaults para:', userId);
};

export const getUsers = async (): Promise<AppUser[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id,
    } as AppUser));
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return [];
  }
};

export const getPendingUsersCount = (callback: (count: number) => void) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('role', '==', 'pending_member'));
  
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  });
};

export const approveUser = async (uid: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      role: 'member',
      updated_at: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erro ao aprovar usuário:', error);
    throw new Error('Não foi possível aprovar o usuário.');
  }
};

export const deleteUser = async (uid: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', uid);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    throw new Error('Não foi possível excluir o usuário.');
  }
};
