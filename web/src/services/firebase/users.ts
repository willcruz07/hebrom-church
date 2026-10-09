import { AppUser } from '@/types'
import { Timestamp, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './config'
import { uploadFile } from './storage'
import { collection, getDocs, query, where, orderBy, onSnapshot, getCountFromServer } from 'firebase/firestore'

// `null` só quando o documento não existe. Erro (ex: offline) propaga — o useAuth trata
// `null` como "primeiro login" e cria o documento, o que sobrescreveria o usuário real.
export const getUserById = async (userId: string): Promise<AppUser | null> => {
  const userDoc = await getDoc(doc(db, 'users', userId))
  if (!userDoc.exists()) return null

  return {
    ...userDoc.data(),
    uid: userDoc.id,
  } as AppUser
}

export const createUser = async (userData: AppUser): Promise<void> => {
  const { uid, ...rest } = userData

  try {
    const docRef = doc(db, 'users', uid)

    const newUser = {
      ...rest,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    }

    await setDoc(docRef, newUser)
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    throw new Error('Erro ao salvar dados do usuário. Tente novamente.')
  }
}

export const updateUserProfile = async (
  uid: string,
  profileData: Partial<AppUser['profile']>,
): Promise<void> => {
  try {
    const docRef = doc(db, 'users', uid)

    // Converte os campos aninhados para notação de ponto para evitar sobrescrever o objeto 'profile' inteiro
    const updateObj: Record<string, any> = {
      updated_at: Timestamp.now(),
    }

    Object.entries(profileData).forEach(([key, value]) => {
      updateObj[`profile.${key}`] = value
    })

    await updateDoc(docRef, updateObj)
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    throw new Error('Não foi possível salvar as alterações do perfil.')
  }
}

export const uploadAvatar = async (uid: string, file: File): Promise<string> => {
  try {
    // Referência única baseada no UID e timestamp
    const fileExtension = file.name.split('.').pop()
    return await uploadFile(`avatars/${uid}_${Date.now()}.${fileExtension}`, file)
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error)
    throw new Error('Erro ao processar imagem de perfil.')
  }
}

export const initializeUserDefaults = async (userId: string): Promise<void> => {
  console.log('Inicializando defaults para:', userId)
}

export const getUsers = async (): Promise<AppUser[]> => {
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, orderBy('created_at', 'desc'))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          uid: doc.id,
        }) as AppUser,
    )
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return []
  }
}

// Listener da lista de membros — quem gerencia o ciclo de vida é o useMembersStore
export const subscribeToUsers = (
  onData: (users: AppUser[]) => void,
  onError: (error: Error) => void,
) => {
  const q = query(collection(db, 'users'), orderBy('created_at', 'desc'))

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((doc) => ({ ...doc.data(), uid: doc.id }) as AppUser))
    },
    onError,
  )
}

export const getPendingUsersCount = async (): Promise<number> => {
  const usersRef = collection(db, 'users')
  const q = query(usersRef, where('role', '==', 'pending_member'))

  const snapshot = await getCountFromServer(q)
  return snapshot.data().count
}

export const getVisitorsCount = async (): Promise<number> => {
  const usersRef = collection(db, 'users')
  const q = query(usersRef, where('role', '==', 'visitor'))

  const snapshot = await getCountFromServer(q)
  return snapshot.data().count
}

export const approveUser = async (uid: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', uid)
    await updateDoc(docRef, {
      role: 'member',
      updated_at: Timestamp.now(),
    })
  } catch (error) {
    console.error('Erro ao aprovar usuário:', error)
    throw new Error('Não foi possível aprovar o usuário.')
  }
}

export const deleteUser = async (uid: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', uid)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    throw new Error('Não foi possível excluir o usuário.')
  }
}
