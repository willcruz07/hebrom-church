import { AppUser } from '@/types'
import { auth as firebaseAuth, googleProvider, appleProvider, isFirebaseReady } from '@/services/firebase/config'
import { createUser, getUserById, initializeUserDefaults, updateUserProfile } from '@/services/firebase/users'
import { isGooglePhotoUrl, mirrorAvatarPhoto } from '@/services/firebase/storage'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { Timestamp } from 'firebase/firestore'
import { create } from 'zustand'

interface LoadingState {
  checkAuth: boolean
  signIn: boolean
  signOut: boolean
}

interface UseAuthStore {
  currentUser: AppUser | null
  loading: LoadingState
  checkAuth(): void
  signInWithEmail(email: string, password: string): Promise<void>
  signUpWithEmail(name: string, email: string, password: string): Promise<void>
  signInWithGoogle(): Promise<void>
  signInWithApple(): Promise<void>
  signOut(): Promise<void>
}

function buildDefaultAppUser(
  uid: string,
  email: string,
  overrides: Partial<Pick<AppUser['profile'], 'full_name' | 'avatar_url'>> = {},
): AppUser {
  return {
    uid,
    email,
    role: 'visitor',
    sub_groups: [],
    profile: {
      full_name: overrides.full_name || '',
      avatar_url: overrides.avatar_url ?? null,
      bio: '',
      birth_date: '',
      baptism_date: null,
      phone: '',
      is_profile_public: true,
      address: '',
      city: '',
      state: '',
      marital_status: 'single',
      children_count: 0,
    },
    is_active: true,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  }
}

async function resolveAvatarUrl(uid: string, photoURL: string | null | undefined): Promise<string | null> {
  if (!isGooglePhotoUrl(photoURL)) return photoURL ?? null

  try {
    return await mirrorAvatarPhoto(uid, photoURL)
  } catch (error) {
    console.error('Erro ao espelhar foto do Google:', error)
    return photoURL
  }
}

async function setSessionCookie(token: string) {
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
}

async function clearSessionCookie() {
  await fetch('/api/auth/session', { method: 'DELETE' })
}

export const useAuth = create<UseAuthStore>((set, get) => ({
  currentUser: null,
  loading: {
    checkAuth: true,
    signIn: false,
    signOut: false,
  },

  checkAuth() {
    if (get().loading.checkAuth === false && get().currentUser) return

    set((s) => ({ loading: { ...s.loading, checkAuth: true } }))

    if (!isFirebaseReady()) {
      set({ currentUser: null })
      set((s) => ({ loading: { ...s.loading, checkAuth: false } }))
      return
    }

    onAuthStateChanged(firebaseAuth, async (user) => {
      try {
        if (user) {
          let userData = await getUserById(user.uid)

          // Se o usuário autenticou mas não tem documento no Firestore, criamos um básico
          if (!userData) {
            console.warn(
              'Usuário autenticado sem documento no Firestore. Criando agora...',
              user.uid,
            )
            userData = buildDefaultAppUser(user.uid, user.email || '', {
              full_name: user.displayName || '',
              avatar_url: await resolveAvatarUrl(user.uid, user.photoURL),
            })
            await createUser(userData)
            await initializeUserDefaults(user.uid)
          } else if (isGooglePhotoUrl(userData.profile.avatar_url)) {
            // Membro antigo com avatar_url ainda apontando pro Google — espelha pro Storage
            const mirroredUrl = await resolveAvatarUrl(user.uid, userData.profile.avatar_url)
            if (mirroredUrl && mirroredUrl !== userData.profile.avatar_url) {
              await updateUserProfile(user.uid, { avatar_url: mirroredUrl })
              userData = { ...userData, profile: { ...userData.profile, avatar_url: mirroredUrl } }
            }
          }

          set({ currentUser: userData })
          setSessionCookie(await user.getIdToken()).catch(console.error)
        } else {
          set({ currentUser: null })
          clearSessionCookie().catch(console.error)
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        set({ currentUser: null })
        clearSessionCookie().catch(console.error)
      } finally {
        set((s) => ({ loading: { ...s.loading, checkAuth: false } }))
      }
    })
  },

  async signInWithEmail(email: string, password: string) {
    set((s) => ({ loading: { ...s.loading, signIn: true } }))

    try {
      if (!isFirebaseReady()) {
        throw new Error('Firebase não configurado.')
      }

      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password)
      const user = await getUserById(userCredential.user.uid)

      if (user) {
        set({ currentUser: user })
      } else {
        const newUser = buildDefaultAppUser(userCredential.user.uid, userCredential.user.email ?? '')
        await createUser(newUser)
        await initializeUserDefaults(newUser.uid)
        set({ currentUser: newUser })
      }

      setSessionCookie(await userCredential.user.getIdToken()).catch(console.error)
    } catch (error: any) {
      console.error('ERRO CRÍTICO [Login/Firestore]:', {
        message: error.message,
        code: error.code,
        uid: firebaseAuth.currentUser?.uid,
      })
      throw error
    } finally {
      set((s) => ({ loading: { ...s.loading, signIn: false } }))
    }
  },

  async signUpWithEmail(name: string, email: string, password: string) {
    set((s) => ({ loading: { ...s.loading, signIn: true } }))

    try {
      if (!isFirebaseReady()) {
        throw new Error('Firebase não configurado.')
      }

      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password)

      const newUser = buildDefaultAppUser(userCredential.user.uid, userCredential.user.email ?? email)

      await createUser(newUser)
      await initializeUserDefaults(newUser.uid)

      set({ currentUser: newUser })

      setSessionCookie(await userCredential.user.getIdToken()).catch(console.error)
    } catch (error: any) {
      console.error('ERRO CRÍTICO [Signup/Firestore]:', {
        message: error.message,
        code: error.code,
        uid: firebaseAuth.currentUser?.uid,
      })
      throw error
    } finally {
      set((s) => ({ loading: { ...s.loading, signIn: false } }))
    }
  },

  async signInWithGoogle() {
    set((s) => ({ loading: { ...s.loading, signIn: true } }))

    try {
      if (!isFirebaseReady()) {
        throw new Error('Firebase não configurado.')
      }

      const result = await signInWithPopup(firebaseAuth, googleProvider)
      const user = result.user

      let userData = await getUserById(user.uid)

      if (userData) {
        if (isGooglePhotoUrl(userData.profile.avatar_url)) {
          const mirroredUrl = await resolveAvatarUrl(user.uid, userData.profile.avatar_url)
          if (mirroredUrl && mirroredUrl !== userData.profile.avatar_url) {
            await updateUserProfile(user.uid, { avatar_url: mirroredUrl })
            userData = { ...userData, profile: { ...userData.profile, avatar_url: mirroredUrl } }
          }
        }
        set({ currentUser: userData })
      } else {
        const newUser = buildDefaultAppUser(user.uid, user.email ?? '', {
          full_name: user.displayName ?? '',
          avatar_url: await resolveAvatarUrl(user.uid, user.photoURL),
        })
        await createUser(newUser)
        await initializeUserDefaults(user.uid)
        set({ currentUser: newUser })
      }

      setSessionCookie(await user.getIdToken()).catch(console.error)
    } finally {
      set((s) => ({ loading: { ...s.loading, signIn: false } }))
    }
  },

  async signInWithApple() {
    set((s) => ({ loading: { ...s.loading, signIn: true } }))

    try {
      if (!isFirebaseReady()) {
        throw new Error('Firebase não configurado.')
      }

      const result = await signInWithPopup(firebaseAuth, appleProvider)
      const user = result.user

      const userData = await getUserById(user.uid)

      if (userData) {
        set({ currentUser: userData })
      } else {
        const newUser = buildDefaultAppUser(user.uid, user.email ?? '', {
          full_name: user.displayName ?? '',
          avatar_url: user.photoURL ?? '',
        })
        await createUser(newUser)
        await initializeUserDefaults(user.uid)
        set({ currentUser: newUser })
      }

      setSessionCookie(await user.getIdToken()).catch(console.error)
    } finally {
      set((s) => ({ loading: { ...s.loading, signIn: false } }))
    }
  },

  async signOut() {
    set((s) => ({ loading: { ...s.loading, signOut: true } }))
    try {
      if (isFirebaseReady()) {
        await firebaseSignOut(firebaseAuth)
      }
      set({ currentUser: null })
      clearSessionCookie().catch(console.error)
    } finally {
      set((s) => ({ loading: { ...s.loading, signOut: false } }))
    }
  },
}))
