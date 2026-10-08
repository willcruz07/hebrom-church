import { FieldValue } from 'firebase-admin/firestore'
import { adminDb, adminMessaging } from './admin-config'

// Limite do sendEachForMulticast por chamada
const MULTICAST_LIMIT = 500

// Erros que significam "este token não existe mais" (app desinstalado, permissão
// revogada, PWA reinstalado no iOS) — o token deve sair do cadastro
const STALE_TOKEN_ERRORS = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
])

/**
 * Envia uma notificação push para todos os usuários que possuem tokens registrados.
 */
export async function sendNotificationToAll(title: string, body: string, url: string = '/') {
  try {
    // 1. Buscar todos os usuários que têm tokens (guardando o dono de cada token)
    const usersSnapshot = await adminDb.collection('users').get()
    const tokenOwners = new Map<string, string[]>()

    usersSnapshot.forEach((doc) => {
      const tokens = doc.data().fcm_tokens
      if (!Array.isArray(tokens)) return
      for (const token of tokens) {
        tokenOwners.set(token, [...(tokenOwners.get(token) ?? []), doc.id])
      }
    })

    const uniqueTokens = Array.from(tokenOwners.keys())

    if (uniqueTokens.length === 0) {
      console.log('Nenhum token encontrado para envio.')
      return
    }

    // 2. Enviar em lotes de até 500 tokens
    let successCount = 0
    let failureCount = 0
    const staleTokens: string[] = []

    for (let i = 0; i < uniqueTokens.length; i += MULTICAST_LIMIT) {
      const batch = uniqueTokens.slice(i, i + MULTICAST_LIMIT)
      const response = await adminMessaging.sendEachForMulticast({
        notification: { title, body },
        data: { url },
        tokens: batch,
      })

      successCount += response.successCount
      failureCount += response.failureCount
      response.responses.forEach((r, index) => {
        if (!r.success && r.error && STALE_TOKEN_ERRORS.has(r.error.code)) {
          staleTokens.push(batch[index])
        }
      })
    }

    console.log(`${successCount} notificações enviadas com sucesso, ${failureCount} falhas.`)

    // 3. Limpar tokens expirados
    if (staleTokens.length > 0) {
      // Um update por usuário, em WriteBatches de até 500 operações
      const tokensByUser = new Map<string, string[]>()
      for (const token of staleTokens) {
        for (const uid of tokenOwners.get(token) ?? []) {
          tokensByUser.set(uid, [...(tokensByUser.get(uid) ?? []), token])
        }
      }

      const entries = Array.from(tokensByUser.entries())
      for (let i = 0; i < entries.length; i += MULTICAST_LIMIT) {
        const writes = adminDb.batch()
        for (const [uid, tokens] of entries.slice(i, i + MULTICAST_LIMIT)) {
          writes.update(adminDb.collection('users').doc(uid), {
            fcm_tokens: FieldValue.arrayRemove(...tokens),
          })
        }
        await writes.commit()
      }
      console.log(`${staleTokens.length} tokens expirados removidos.`)
    }

    return { successCount, failureCount, removedTokens: staleTokens.length }
  } catch (error) {
    console.error('Erro ao enviar notificações push:', error)
    throw error
  }
}
