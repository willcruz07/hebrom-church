import { AppUser } from '@/types'
import { auth as firebaseAuth, googleProvider, appleProvider, isFirebaseReady } from '@/services/firebase/config'
import { createUser, getUserById, initializeUserDefaults, updateUserProfile } from '@/services/firebase/users'
import { isGooglePhotoUrl, mirrorAvatarPhoto } from '@/services/firebase/storage'
import {
  AuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  Unsubscribe,
  User,
} from 'firebase/auth'
import { Timestamp } from 'firebase/firestore'
import { create } from 'zustand'
import { ROUTES } from '@/paths'

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

// Precisa terminar ANTES de o usuário ser considerado logado: o proxy.ts só libera
// /dashboard se o cookie já existir, senão devolve para /login (bug no iOS).
async function setSessionCookie(token: string) {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  if (!res.ok) throw new Error(`Falha ao gravar cookie de sessão (${res.status})`)
}

// Busca (ou cria, no primeiro login) o AppUser do usuário autenticado.
// O espelhamento do avatar do Google roda em segundo plano para não atrasar o login.
async function loadAppUser(user: User): Promise<AppUser> {
  const userData = await getUserById(user.uid)
  if (userData) return userData

  console.warn('Usuário autenticado sem documento no Firestore. Criando agora...', user.uid)
  const newUser = buildDefaultAppUser(user.uid, user.email || '', {
    full_name: user.displayName || '',
    avatar_url: user.photoURL ?? null,
  })
  await createUser(newUser)
  await initializeUserDefaults(user.uid)
  return newUser
}

// Popup não devolve o resultado de forma confiável no Safari do iOS nem no PWA standalone.
// Redirect resolve, mas só quando o authDomain é o próprio domínio do app (ver rewrite
// /__/auth em next.config.ts); fora disso o redirect quebra no Safari, então mantém popup.
function shouldUseRedirect(): boolean {
  if (typeof window === 'undefined') return false
  if (firebaseAuth.config.authDomain !== window.location.host) return false

  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return isIOS || isStandalone
}

async function signInWithOAuth(provider: AuthProvider) {
  if (shouldUseRedirect()) {
    // A página sai daqui; o retorno é tratado pelo onAuthStateChanged em checkAuth().
    await signInWithRedirect(firebaseAuth, provider)
    return
  }
  await signInWithPopup(firebaseAuth, provider)
}

let authUnsubscribe: Unsubscribe | null = null

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

  // Único ponto que transforma um usuário do Firebase em `currentUser` — os métodos
  // signIn* só autenticam, para não buscar/criar o AppUser em dobro.
  checkAuth() {
    if (authUnsubscribe) return

    set((s) => ({ loading: { ...s.loading, checkAuth: true } }))

    if (!isFirebaseReady()) {
      set({ currentUser: null })
      set((s) => ({ loading: { ...s.loading, checkAuth: false } }))
      return
    }

    // Retorno de um signInWithRedirect: o usuário chega pelo onAuthStateChanged,
    // aqui só registramos uma eventual falha do provedor.
    getRedirectResult(firebaseAuth).catch((error) => {
      console.error('Erro no retorno do login por redirect:', error)
    })

    authUnsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      try {
        if (user) {
          const userData = await loadAppUser(user)
          await setSessionCookie(await user.getIdToken())
          set({ currentUser: userData })
          mirrorGoogleAvatar(userData)
        } else {
          set({ currentUser: null })
          clearSessionCookie().catch(console.error)
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        set((s) => ({ currentUser: null, loading: { ...s.loading, signIn: false } }))
        clearSessionCookie().catch(console.error)
      } finally {
        set((s) => ({ loading: { ...s.loading, checkAuth: false } }))
      }
    })

    // Membro com avatar_url ainda apontando pro Google — espelha pro Storage sem bloquear o login
    function mirrorGoogleAvatar(userData: AppUser) {
      if (!isGooglePhotoUrl(userData.profile.avatar_url)) return

      resolveAvatarUrl(userData.uid, userData.profile.avatar_url)
        .then(async (mirroredUrl) => {
          if (!mirroredUrl || mirroredUrl === userData.profile.avatar_url) return
          await updateUserProfile(userData.uid, { avatar_url: mirroredUrl })
          const current = get().currentUser
          if (current?.uid === userData.uid) {
            set({ currentUser: { ...current, profile: { ...current.profile, avatar_url: mirroredUrl } } })
          }
        })
        .catch((error) => console.error('Erro ao espelhar foto do Google:', error))
    }
  },

  // Os métodos signIn* só autenticam no Firebase. O onAuthStateChanged de checkAuth()
  // carrega o AppUser, grava o cookie e o AuthSession navega. Em caso de sucesso o
  // `loading.signIn` fica true até a página trocar, para o botão não "piscar".
  async signInWithEmail(email: string, password: string) {
    set((s) => ({ loading: { ...s.loading, signIn: true } }))

    try {
      if (!isFirebaseReady()) {
        throw new Error('Firebase não configurado.')
      }

      await signInWithEmailAndPassword(firebaseAuth, email, password)
    } catch (error: any) {
      console.error('ERRO CRÍTICO [Login/Firestore]:', {
        message: error.message,
        code: error.code,
        uid: firebaseAuth.currentUser?.uid,
      })
      set((s) => ({ loading: { ...s.loading, signIn: false } }))
      throw error
    }
  },

  async signUpWithEmail(name: string, email: string, password: string) {
    set((s) => ({ loading: { ...s.loading, signIn: true } }))

    try {
      if (!isFirebaseReady()) {
        throw new Error('Firebase não configurado.')
      }

      await createUserWithEmailAndPassword(firebaseAuth, email, password)
    } catch (error: any) {
      console.error('ERRO CRÍTICO [Signup/Firestore]:', {
        message: error.message,
        code: error.code,
        uid: firebaseAuth.currentUser?.uid,
      })
      set((s) => ({ loading: { ...s.loading, signIn: false } }))
      throw error
    }
  },

  async signInWithGoogle() {
    set((s) => ({ loading: { ...s.loading, signIn: true } }))

    try {
      if (!isFirebaseReady()) {
        throw new Error('Firebase não configurado.')
      }

      await signInWithOAuth(googleProvider)
    } catch (error) {
      set((s) => ({ loading: { ...s.loading, signIn: false } }))
      throw error
    }
  },

  async signInWithApple() {
    set((s) => ({ loading: { ...s.loading, signIn: true } }))

    try {
      if (!isFirebaseReady()) {
        throw new Error('Firebase não configurado.')
      }

      await signInWithOAuth(appleProvider)
    } catch (error) {
      set((s) => ({ loading: { ...s.loading, signIn: false } }))
      throw error
    }
  },

  async signOut() {
    set((s) => ({ loading: { ...s.loading, signOut: true } }))
    try {
      // Cookie primeiro: se o currentUser zerar antes, o proxy.ts ainda vê a sessão e
      // devolve /login → /dashboard, prendendo o usuário (mesma corrida do login).
      await clearSessionCookie().catch(console.error)
      if (isFirebaseReady()) {
        await firebaseSignOut(firebaseAuth)
      }
      set({ currentUser: null })

      // Navegação completa: além de garantir o proxy sem cookie, derruba os listeners
      // onSnapshot e os stores do usuário anterior.
      window.location.replace(ROUTES.NO_AUTH.SIGN_IN)
    } finally {
      set((s) => ({ loading: { ...s.loading, signOut: false } }))
    }
  },
}))
