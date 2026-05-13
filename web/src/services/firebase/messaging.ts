import { getToken, onMessage } from 'firebase/messaging'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db, getFirebaseMessaging } from './config'

/**
 * Requests permission to send notifications and saves the FCM token to the user document.
 */
export const requestNotificationPermission = async (userId: string) => {
  if (typeof window === 'undefined') return null

  try {
    const messaging = await getFirebaseMessaging()
    if (!messaging) return null

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      // Registrar manualmente o service worker para evitar timeout do Firebase
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

      // Get the token from FCM
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      })

      if (token) {
        await saveTokenToUser(userId, token)
        return token
      }
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error)
  }
  return null
}

/**
 * Saves the FCM token to the user document in Firestore to enable targeted notifications.
 */
const saveTokenToUser = async (userId: string, token: string) => {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      fcm_tokens: arrayUnion(token),
    })
  } catch (error) {
    console.error('Error saving FCM token to Firestore:', error)
  }
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
