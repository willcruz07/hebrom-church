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
  limit,
  startAfter,
  type QueryDocumentSnapshot,
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

// Paginação do mural — ver specs/firestore-arquitetura-dados.md ("Janela de tempo + paginação").
// Todas as consultas ordenam só por `created_at`: nenhum índice composto é necessário.
export const MURAL_PAGE_SIZE = 15

export interface PostsPage {
  posts: FeedPost[]
  /** Último documento da página — cursor (`startAfter`) da próxima. */
  cursor: QueryDocumentSnapshot | null
}

const toPost = (snap: QueryDocumentSnapshot) => ({ id: snap.id, ...snap.data() }) as FeedPost

const toPage = (docs: QueryDocumentSnapshot[]): PostsPage => ({
  posts: docs.map(toPost),
  cursor: docs.at(-1) ?? null,
})

/** Página mais recente — define a âncora do listener ao vivo. */
export const getLatestPosts = async (pageSize = MURAL_PAGE_SIZE): Promise<PostsPage> => {
  const q = query(collection(db, 'posts'), orderBy('created_at', 'desc'), limit(pageSize))
  return toPage((await getDocs(q)).docs)
}

/** Página anterior ao cursor — busca única, sem listener (post antigo quase não muda). */
export const getPostsBefore = async (
  cursor: QueryDocumentSnapshot,
  pageSize = MURAL_PAGE_SIZE,
): Promise<PostsPage> => {
  const q = query(
    collection(db, 'posts'),
    orderBy('created_at', 'desc'),
    startAfter(cursor),
    limit(pageSize),
  )
  return toPage((await getDocs(q)).docs)
}

/**
 * Tempo real dos posts criados a partir da âncora (`null` = todos, quando o mural cabe numa
 * página). A janela só cresce: um post novo não empurra nenhum outro para fora.
 */
export const subscribeToPostsSince = (
  anchor: Timestamp | null,
  callback: (posts: FeedPost[]) => void,
  onError: (error: Error) => void,
) => {
  const postsRef = collection(db, 'posts')
  const q = anchor
    ? query(postsRef, where('created_at', '>=', anchor), orderBy('created_at', 'desc'))
    : query(postsRef, orderBy('created_at', 'desc'))

  return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(toPost)), onError)
}

/** Busca pontual dos posts criados a partir de uma data (contadores do dashboard). */
export const getPostsSince = async (since: Date): Promise<FeedPost[]> => {
  const q = query(
    collection(db, 'posts'),
    where('created_at', '>=', Timestamp.fromDate(since)),
    orderBy('created_at', 'desc'),
  )
  return (await getDocs(q)).docs.map(toPost)
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
