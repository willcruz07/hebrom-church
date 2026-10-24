import { FirebaseError } from 'firebase/app'
import dayjs from '@/lib/dayjs'
import { PassAlreadyIn, SessionClosed } from '@/services/firebase/kids-room'

/** Mensagem do toast para falhas da Sala. */
export function roomErrorMessage(error: unknown): string {
  if (error instanceof PassAlreadyIn) {
    return `${error.childName} já foi registrado por ${error.byName} às ${dayjs(error.atMs).format('HH:mm')}.`
  }
  if (error instanceof SessionClosed) return 'A Área Kids foi encerrada.'
  if (error instanceof FirebaseError && error.code === 'permission-denied') {
    return 'A Área Kids foi encerrada ou você não está servindo.'
  }
  return 'Sem conexão. Tente de novo.'
}
