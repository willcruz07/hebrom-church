import { FeedPost, PostComment } from '@/types'
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  where,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from './config'
import { uploadFile } from './storage'
import { notifyNewPost } from './notify'

export const createPost = async (
  postData: Omit<FeedPost, 'id' | 'created_at'>,
  imageFile?: File,
): Promise<void> => {
  try {
    let mediaUrl = ''

    if (imageFile) {
      const fileExtension = imageFile.name.split('.').pop()
      const fileName = `posts/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`
      mediaUrl = await uploadFile(fileName, imageFile)
    }

    const newPost = {
      ...postData,
      media_url: mediaUrl || postData.media_url || '',
      created_at: serverTimestamp(),
    }

    await addDoc(collection(db, 'posts'), newPost)

    notifyNewPost('Novo Aviso na Hebrom!', newPost.title, '/dashboard/mural')
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
      created_at: Timestamp.now(),
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
