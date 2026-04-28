import { AppUser } from '@/types';
import { auth as firebaseAuth, googleProvider, isFirebaseReady } from '@/services/firebase/config';
import { createUser, getUserById, initializeUserDefaults } from '@/services/firebase/users';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { create } from 'zustand';

interface LoadingState {
  checkAuth: boolean;
  signIn: boolean;
  signOut: boolean;
}

interface UseAuthStore {
  currentUser: AppUser | null;
  loading: LoadingState;
  checkAuth(): void;
  signInWithEmail(email: string, password: string): Promise<void>;
  signUpWithEmail(name: string, email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
}

async function setSessionCookie(token: string) {
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}

async function clearSessionCookie() {
  await fetch('/api/auth/session', { method: 'DELETE' });
}

export const useAuth = create<UseAuthStore>((set, get) => ({
  currentUser: null,
  loading: {
    checkAuth: true,
    signIn: false,
    signOut: false,
  },

  checkAuth() {
    if (get().loading.checkAuth === false && get().currentUser) return;

    set((s) => ({ loading: { ...s.loading, checkAuth: true } }));

    if (!isFirebaseReady()) {
      set({ currentUser: null });
      set((s) => ({ loading: { ...s.loading, checkAuth: false } }));
      return;
    }

    onAuthStateChanged(firebaseAuth, async (user) => {
      try {
        if (user) {
          let userData = await getUserById(user.uid);
          
          // Se o usuário autenticou mas não tem documento no Firestore, criamos um básico
          if (!userData) {
            console.warn('Usuário autenticado sem documento no Firestore. Criando agora...', user.uid);
            userData = {
              uid: user.uid,
              email: user.email || '',
              role: 'visitor',
              sub_groups: [],
              profile: {
                full_name: user.displayName || '',
                avatar_url: user.photoURL || null,
                bio: '',
                birth_date: '',
                baptism_date: null,
                phone: '',
                is_profile_public: true,
              },
              created_at: Timestamp.now(),
              updated_at: Timestamp.now(),
            };
            await createUser(userData);
            await initializeUserDefaults(user.uid);
          }

          set({ currentUser: userData });
          await setSessionCookie(await user.getIdToken());
        } else {
          set({ currentUser: null });
          await clearSessionCookie();
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        set({ currentUser: null });
        await clearSessionCookie();
      } finally {
        set((s) => ({ loading: { ...s.loading, checkAuth: false } }));
      }
    });
  },

  async signInWithEmail(email: string, password: string) {
    set((s) => ({ loading: { ...s.loading, signIn: true } }));

    try {
      if (!isFirebaseReady()) {
        throw new Error('Firebase não configurado.');
      }

      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const user = await getUserById(userCredential.user.uid);

      if (user) {
        set({ currentUser: user });
      } else {
        const newUser: AppUser = {
          uid: userCredential.user.uid,
          email: userCredential.user.email ?? '',
          role: 'visitor',
          sub_groups: [],
          profile: {
            full_name: '',
            avatar_url: null,
            bio: '',
            birth_date: '',
            baptism_date: null,
            phone: '',
            is_profile_public: true,
          },
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        };
        await createUser(newUser);
        await initializeUserDefaults(newUser.uid);
        set({ currentUser: newUser });
      }

      await setSessionCookie(await userCredential.user.getIdToken());
    } catch (error: any) {
      console.error('ERRO CRÍTICO [Login/Firestore]:', {
        message: error.message,
        code: error.code,
        uid: firebaseAuth.currentUser?.uid
      });
      throw error;
    } finally {
      set((s) => ({ loading: { ...s.loading, signIn: false } }));
    }
  },

  async signUpWithEmail(name: string, email: string, password: string) {
    set((s) => ({ loading: { ...s.loading, signIn: true } }));

    try {
      if (!isFirebaseReady()) {
        throw new Error('Firebase não configurado.');
      }

      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);

      const newUser: AppUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email ?? email,
        role: 'visitor',
        sub_groups: [],
        profile: {
          full_name: name,
          avatar_url: null,
          bio: '',
          birth_date: '',
          baptism_date: null,
          phone: '',
          is_profile_public: true,
        },
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      await createUser(newUser);
      await initializeUserDefaults(newUser.uid);

      set({ currentUser: newUser });

      await setSessionCookie(await userCredential.user.getIdToken());
    } catch (error: any) {
      console.error('ERRO CRÍTICO [Signup/Firestore]:', {
        message: error.message,
        code: error.code,
        uid: firebaseAuth.currentUser?.uid
      });
      throw error;
    } finally {
      set((s) => ({ loading: { ...s.loading, signIn: false } }));
    }
  },

  async signInWithGoogle() {
    set((s) => ({ loading: { ...s.loading, signIn: true } }));

    try {
      if (!isFirebaseReady()) {
        throw new Error('Firebase não configurado.');
      }

      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const user = result.user;
      
      const userData = await getUserById(user.uid);

      if (userData) {
        set({ currentUser: userData });
      } else {
        const newUser: AppUser = {
          uid: user.uid,
          email: user.email ?? '',
          role: 'visitor',
          sub_groups: [],
          profile: {
            full_name: user.displayName ?? '',
            avatar_url: user.photoURL ?? null,
            bio: '',
            birth_date: '',
            baptism_date: null,
            phone: '',
            is_profile_public: true,
          },
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        };
        await createUser(newUser);
        await initializeUserDefaults(user.uid);
        set({ currentUser: newUser });
      }

      await setSessionCookie(await user.getIdToken());
    } finally {
      set((s) => ({ loading: { ...s.loading, signIn: false } }));
    }
  },

  async signOut() {
    set((s) => ({ loading: { ...s.loading, signOut: true } }));
    try {
      if (isFirebaseReady()) {
        await firebaseSignOut(firebaseAuth);
      }
      set({ currentUser: null });
      await clearSessionCookie();
    } finally {
      set((s) => ({ loading: { ...s.loading, signOut: false } }));
    }
  },
}));
