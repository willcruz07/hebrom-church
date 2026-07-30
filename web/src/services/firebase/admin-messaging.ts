import { adminDb, adminMessaging } from './admin-config'

/**
 * Envia uma notificação push para todos os usuários que possuem tokens registrados.
 */
export async function sendNotificationToAll(title: string, body: string, url: string = '/') {
  try {
    // 1. Buscar todos os usuários que têm tokens
    const usersSnapshot = await adminDb.collection('users').get()
    const allTokens: string[] = []

    usersSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.fcm_tokens && Array.isArray(data.fcm_tokens)) {
        allTokens.push(...data.fcm_tokens)
      }
    })

    // Remover duplicados
    const uniqueTokens = Array.from(new Set(allTokens))

    if (uniqueTokens.length === 0) {
      console.log('Nenhum token encontrado para envio.')
      return
    }

    // 2. Criar a mensagem
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        url,
      },
      tokens: uniqueTokens,
    }

    // 3. Enviar (Multicast envia para vários de uma vez)
    const response = await adminMessaging.sendEachForMulticast(message)
    
    console.log(`${response.successCount} notificações enviadas com sucesso.`)
    
    // Opcional: Aqui você poderia limpar tokens que falharam (estão expirados)
    if (response.failureCount > 0) {
      console.log(`${response.failureCount} falhas no envio.`)
    }

    return response
  } catch (error) {
    console.error('Erro ao enviar notificações push:', error)
    throw error
  }
}
