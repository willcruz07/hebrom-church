import { FeedPost } from '@/types';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  getDocs, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

export const createPost = async (
  postData: Omit<FeedPost, 'id' | 'created_at'>,
  imageFile?: File
): Promise<void> => {
  try {
    let mediaUrl = '';

    if (imageFile) {
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `posts/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, imageFile);
      mediaUrl = await getDownloadURL(storageRef);
    }

    const newPost = {
      ...postData,
      media_url: mediaUrl || postData.media_url || '',
      created_at: Date.now(), // Usando timestamp numérico conforme a interface FeedPost
    };

    await addDoc(collection(db, 'posts'), newPost);
  } catch (error) {
    console.error('Erro ao criar post:', error);
    throw new Error('Não foi possível publicar o aviso.');
  }
};

export const getPosts = async (userGroups: string[] = []): Promise<FeedPost[]> => {
  try {
    const postsRef = collection(db, 'posts');
    // Por enquanto buscamos todos e filtramos no front ou fazemos query simples
    // Para um sistema real, o ideal seriam índices compostos no Firestore
    const q = query(postsRef, orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FeedPost[];
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    return [];
  }
};

export const deletePost = async (postId: string): Promise<void> => {
  try {
    const { doc, deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    console.error('Erro ao excluir post:', error);
    throw new Error('Não foi possível excluir o aviso.');
  }
};
