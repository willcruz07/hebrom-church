import { FeedPost, PostComment } from '@/types'
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  where,
  Timestamp,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './config'

export const createPost = async (
  postData: Omit<FeedPost, 'id' | 'created_at'>,
  imageFile?: File,
): Promise<void> => {
  try {
    let mediaUrl = ''

    if (imageFile) {
      const fileExtension = imageFile.name.split('.').pop()
      const fileName = `posts/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`
      const storageRef = ref(storage, fileName)

      await uploadBytes(storageRef, imageFile)
      mediaUrl = await getDownloadURL(storageRef)
    }

    const newPost = {
      ...postData,
      media_url: mediaUrl || postData.media_url || '',
      created_at: Date.now(), // Usando timestamp numérico conforme a interface FeedPost
    }

    await addDoc(collection(db, 'posts'), newPost)

    // Disparar notificação push via API do servidor (Next.js)
    fetch('/api/notifications/new-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Novo Aviso na Hebrom!',
        body: newPost.title,
        url: '/dashboard/mural',
      }),
    }).catch((err) => console.error('Erro ao disparar notificação:', err))
  } catch (error) {
    console.error('Erro ao criar post:', error)
    throw new Error('Não foi possível publicar o aviso.')
  }
}

export const getPosts = async (userGroups: string[] = []): Promise<FeedPost[]> => {
  try {
    const postsRef = collection(db, 'posts')
    // Por enquanto buscamos todos e filtramos no front ou fazemos query simples
    // Para um sistema real, o ideal seriam índices compostos no Firestore
    const q = query(postsRef, orderBy('created_at', 'desc'))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FeedPost[]
  } catch (error) {
    console.error('Erro ao buscar posts:', error)
    return []
  }
}

export const subscribeToPosts = (callback: (posts: FeedPost[]) => void) => {
  const postsRef = collection(db, 'posts')
  const q = query(postsRef, orderBy('created_at', 'desc'))

  return onSnapshot(
    q,
    (snapshot) => {
      const posts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FeedPost[]
      callback(posts)
    },
    (error) => {
      console.error('Erro no snapshot do mural:', error)
    },
  )
}

export const subscribeToPost = (postId: string, callback: (post: FeedPost) => void) => {
  const postRef = doc(db, 'posts', postId)

  return onSnapshot(
    postRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as FeedPost)
      }
    },
    (error) => {
      console.error('Erro no snapshot do post:', error)
    },
  )
}

export const toggleLike = async (
  postId: string,
  userId: string,
  isLiked: boolean,
): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId)
    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
    })
  } catch (error) {
    console.error('Erro ao curtir post:', error)
    throw new Error('Não foi possível processar sua curtida.')
  }
}

export const addComment = async (
  postId: string,
  comment: Omit<PostComment, 'id' | 'created_at'>,
): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId)
    const newComment: PostComment = {
      ...comment,
      id: Math.random().toString(36).substring(7),
      created_at: Date.now(),
    }

    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
    })
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error)
    throw new Error('Não foi possível enviar seu comentário.')
  }
}

export const deletePost = async (postId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId)
    const { deleteDoc } = await import('firebase/firestore')
    await deleteDoc(postRef)
  } catch (error) {
    console.error('Erro ao excluir post:', error)
    throw new Error('Não foi possível excluir o aviso.')
  }
}
