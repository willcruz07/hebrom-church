/** Conteúdo do QR do responsável: `HKIDS1:{uid}:{token}`. */
export const QR_PREFIX = 'HKIDS1'
/** 18 bytes aleatórios = 24 caracteres base64url. */
export const TOKEN_BYTES = 18

const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const PART = /^[A-Za-z0-9_-]+$/

/** Token a partir de bytes aleatórios (quem chama usa `crypto.getRandomValues`). */
export function newToken(bytes: Uint8Array): string {
  let token = ''
  for (let i = 0; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    token += BASE64URL[(n >> 18) & 63] + BASE64URL[(n >> 12) & 63] + BASE64URL[(n >> 6) & 63] + BASE64URL[n & 63]
  }
  return token
}

export const buildQrPayload = (uid: string, token: string) => `${QR_PREFIX}:${uid}:${token}`

export function parseQrPayload(text: string): { uid: string; token: string } | null {
  const parts = text.trim().split(':')
  if (parts.length !== 3 || parts[0] !== QR_PREFIX) return null
  const [, uid, token] = parts
  if (!PART.test(uid) || !PART.test(token)) return null
  return { uid, token }
}
