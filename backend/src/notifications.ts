import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

const db = admin.firestore();
const messaging = admin.messaging();

// Limite do sendEachForMulticast por chamada
const MULTICAST_LIMIT = 500;

// Limite de operações por WriteBatch do Firestore
const WRITE_BATCH_LIMIT = 500;

// Erros que significam "este token não existe mais" (app desinstalado,
// permissão revogada, PWA reinstalado no iOS) — o token sai do cadastro
const STALE_TOKEN_ERRORS = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

/**
 * Remove tokens expirados dos usuários donos deles (um update por usuário).
 * @param {string[]} staleTokens Tokens recusados pelo FCM.
 * @param {Map<string, string[]>} tokenOwners Token -> uids que o possuem.
 * @return {Promise<void>}
 */
async function removeStaleTokens(
  staleTokens: string[],
  tokenOwners: Map<string, string[]>,
): Promise<void> {
  const tokensByUser = new Map<string, string[]>();
  for (const token of staleTokens) {
    for (const uid of tokenOwners.get(token) ?? []) {
      tokensByUser.set(uid, [...(tokensByUser.get(uid) ?? []), token]);
    }
  }

  const entries = Array.from(tokensByUser.entries());
  for (let i = 0; i < entries.length; i += WRITE_BATCH_LIMIT) {
    const batch = db.batch();
    for (const [uid, tokens] of entries.slice(i, i + WRITE_BATCH_LIMIT)) {
      batch.update(db.collection("users").doc(uid), {
        fcm_tokens: admin.firestore.FieldValue.arrayRemove(...tokens),
      });
    }
    await batch.commit();
  }
}

/**
 * Envia uma notificação push para todos os usuários com token FCM salvo,
 * em lotes de até 500 tokens, e limpa os tokens que o FCM recusar.
 * @param {string} title Título da notificação.
 * @param {string} body Corpo da notificação.
 * @param {string} url URL de destino ao tocar na notificação.
 * @return {Promise<void>}
 */
export async function sendNotificationToAll(
  title: string,
  body: string,
  url: string,
): Promise<void> {
  const usersSnapshot = await db.collection("users").get();
  const tokenOwners = new Map<string, string[]>();

  usersSnapshot.forEach((doc) => {
    const tokens = doc.data()?.fcm_tokens;
    if (!Array.isArray(tokens)) return;
    for (const token of tokens) {
      tokenOwners.set(token, [...(tokenOwners.get(token) ?? []), doc.id]);
    }
  });

  const uniqueTokens = Array.from(tokenOwners.keys());
  if (uniqueTokens.length === 0) {
    logger.info("Nenhum token FCM encontrado para envio.");
    return;
  }

  let successCount = 0;
  let failureCount = 0;
  const staleTokens: string[] = [];

  for (let i = 0; i < uniqueTokens.length; i += MULTICAST_LIMIT) {
    const batch = uniqueTokens.slice(i, i + MULTICAST_LIMIT);
    const response = await messaging.sendEachForMulticast({
      notification: {title, body},
      data: {url},
      tokens: batch,
    });

    successCount += response.successCount;
    failureCount += response.failureCount;
    response.responses.forEach((r, index) => {
      if (!r.success && r.error && STALE_TOKEN_ERRORS.has(r.error.code)) {
        staleTokens.push(batch[index]);
      }
    });
  }

  logger.info(
    `${successCount} notificações enviadas, ${failureCount} falhas.`,
  );

  if (staleTokens.length > 0) {
    await removeStaleTokens(staleTokens, tokenOwners);
    logger.info(`${staleTokens.length} tokens expirados removidos.`);
  }
}
