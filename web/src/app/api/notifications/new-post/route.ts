import { NextResponse } from 'next/server'
import { sendNotificationToAll } from '@/services/firebase/admin-messaging'

export async function POST(request: Request) {
  try {
    const { title, body, url } = await request.json()

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Título e corpo são obrigatórios' },
        { status: 400 }
      )
    }

    // Disparar a notificação via Admin SDK (Servidor)
    await sendNotificationToAll(title, body, url || '/dashboard/mural')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno ao enviar notificação' },
      { status: 500 }
    )
  }
}
