import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth'
import {
  Firestore,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getStorage, ref } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

const auth = getAuth(app)

// Cache em IndexedDB: listeners e leituras repetidas respondem do disco primeiro
// (ver specs/navegacao-fluida.md). No SSR não há IndexedDB, então fica em memória.
function createFirestore(): Firestore {
  try {
    return initializeFirestore(app, {
      localCache:
        typeof window === 'undefined'
          ? memoryLocalCache()
          : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  } catch {
    // initializeFirestore só pode rodar uma vez por app (ex: HMR em dev)
    return getFirestore(app)
  }
}

const db = createFirestore()
const storage = getStorage(app)
const storageRef = ref
const googleProvider = new GoogleAuthProvider()
const appleProvider = new OAuthProvider('apple.com')

const isFirebaseReady = () => !!firebaseConfig.apiKey

export {
  app,
  auth,
  db,
  storage,
  storageRef,
  googleProvider,
  appleProvider,
  isFirebaseReady,
}

// Client-side only Messaging initialization
export const getFirebaseMessaging = async () => {
  const { getMessaging, isSupported } = await import('firebase/messaging')
  const supported = await isSupported()
  if (supported) return getMessaging(app)
  return null
}
