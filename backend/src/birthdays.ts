import {onSchedule} from "firebase-functions/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

const db = admin.firestore();
const messaging = admin.messaging();

const BIRTHDAY_JOB_DOC = db.collection("system_jobs").doc("birthdays");

/**
 * Junta uma lista de nomes numa frase legível.
 * Ex.: ["Ana"] -> "Ana"; ["Ana", "Beto"] -> "Ana e Beto";
 * ["Ana", "Beto", "Caio"] -> "Ana, Beto e Caio".
 * @param {string[]} names Lista de nomes a combinar.
 * @return {string} Frase combinada.
 */
function joinNames(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

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
async function sendNotificationToAll(
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

/**
 * Roda todo dia às 08:00 (horário de Brasília). Verifica quem faz aniversário
 * hoje (users.profile.birth_date no formato YYYY-MM-DD), cria um aviso no
 * mural e dispara push notification pra todos os usuários com token FCM
 * registrado.
 */
export const birthdays = onSchedule(
  {
    schedule: "every day 08:00",
    timeZone: "America/Sao_Paulo",
  },
  async () => {
    const now = new Date();
    // YYYY-MM-DD no fuso de Brasília
    const todayStr = now.toLocaleDateString("en-CA", {
      timeZone: "America/Sao_Paulo",
    });
    const todayMonthDay = todayStr.slice(5, 10); // MM-DD

    const alreadyRanToday = await db.runTransaction(async (tx) => {
      const snap = await tx.get(BIRTHDAY_JOB_DOC);
      if (snap.exists && snap.data()?.lastRunDate === todayStr) {
        return true;
      }
      tx.set(BIRTHDAY_JOB_DOC, {lastRunDate: todayStr}, {merge: true});
      return false;
    });

    if (alreadyRanToday) {
      logger.info(
        `Rotina de aniversariantes já rodou hoje (${todayStr}), pulando.`,
      );
      return;
    }

    const usersSnapshot = await db
      .collection("users")
      .where("is_active", "==", true)
      .get();

    const birthdayNames: string[] = [];
    usersSnapshot.forEach((doc) => {
      const birthDate: string | undefined = doc.data()?.profile?.birth_date;
      const fullName: string | undefined = doc.data()?.profile?.full_name;
      if (birthDate && fullName && birthDate.slice(5, 10) === todayMonthDay) {
        birthdayNames.push(fullName);
      }
    });

    if (birthdayNames.length === 0) {
      logger.info(`Nenhum aniversariante hoje (${todayStr}).`);
      return;
    }

    const namesText = joinNames(birthdayNames);
    const isPlural = birthdayNames.length > 1;
    const title = "🎉 Aniversário na Família Hebrom!";
    const celebration = isPlural ?
      "essas datas com vocês" :
      "essa data com você";
    const body =
      `Hoje é aniversário de ${namesText}! A família Hebrom se alegra e ` +
      `celebra ${celebration}. 🎂🙏`;

    await db.collection("posts").add({
      author: {uid: "system", name: "Família Hebrom", avatar_url: ""},
      title,
      content: body,
      media_url: "",
      target_groups: [],
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    await sendNotificationToAll(title, body, "/dashboard/mural");

    logger.info(`Aviso de aniversário criado para: ${namesText}`);
  },
);
