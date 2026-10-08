import { getToken, onMessage } from 'firebase/messaging'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db, getFirebaseMessaging } from './config'

export type NotificationPermissionResult = 'granted' | 'denied' | 'default' | 'unsupported' | 'error'

/**
 * Requests permission to send notifications and saves the FCM token to the user document.
 *
 * Precisa ser chamada direto do handler de clique: no iOS o `Notification.requestPermission()`
 * só abre o diálogo se rodar dentro do gesto do usuário — qualquer `await` antes dele
 * (import dinâmico, isSupported) consome o gesto e o pedido é ignorado em silêncio.
 */
export const requestNotificationPermission = async (
  userId: string,
): Promise<NotificationPermissionResult> => {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported'
  if (!('serviceWorker' in navigator)) return 'unsupported'

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return permission

    const messaging = await getFirebaseMessaging()
    if (!messaging) return 'unsupported'

    // Usa o SW principal (/sw.js, registrado pelo PwaManager no escopo "/"). Registrar um
    // segundo script no mesmo escopo substitui o primeiro e a inscrição de push se perde.
    const registration = await navigator.serviceWorker.ready

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    if (!token) return 'error'

    await saveTokenToUser(userId, token)
    return 'granted'
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return 'error'
  }
}

/**
 * Com a permissão já concedida, garante que o token atual do aparelho está salvo.
 * O FCM rotaciona tokens (e reinstalar o PWA no iOS gera outro), e quem ativou antes
 * da correção do service worker pode ter ficado com um token órfão. Não pede permissão,
 * então pode rodar fora de um gesto do usuário.
 */
export const syncNotificationToken = async (userId: string) => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  if (!('serviceWorker' in navigator)) return

  try {
    const messaging = await getFirebaseMessaging()
    if (!messaging) return

    const registration = await navigator.serviceWorker.ready
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    if (token) await saveTokenToUser(userId, token)
  } catch (error) {
    console.error('Erro ao sincronizar token de notificação:', error)
  }
}

/**
 * Saves the FCM token to the user document in Firestore to enable targeted notifications.
 */
const saveTokenToUser = async (userId: string, token: string) => {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    fcm_tokens: arrayUnion(token),
  })
}

/**
 * Listens for incoming messages while the app is in the foreground.
 */
export const onForegroundMessage = async () => {
  const messaging = await getFirebaseMessaging()
  if (!messaging) return

  onMessage(messaging, (payload) => {
    console.log('Message received in foreground: ', payload)
    // You can trigger a custom toast here if you want
    if (payload.notification) {
      const { title, body } = payload.notification
      // Custom event or toast can be triggered here
    }
  })
}
