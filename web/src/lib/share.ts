import { toast } from 'sonner'

/** Abre o compartilhamento nativo; sem suporte, copia para a área de transferência. */
export async function shareText(text: string, copiedMessage = 'Texto copiado!') {
  try {
    if (navigator.share) {
      await navigator.share({ text })
    } else {
      await navigator.clipboard.writeText(text)
      toast.success(copiedMessage)
    }
  } catch {
    // Usuário cancelou o compartilhamento
  }
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Texto copiado!')
  } catch {
    toast.error('Não foi possível copiar')
  }
}
