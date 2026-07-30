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

/**
 * Envia uma notificação push para todos os usuários com token FCM salvo.
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
  const allTokens: string[] = [];

  usersSnapshot.forEach((doc) => {
    const tokens = doc.data()?.fcm_tokens;
    if (Array.isArray(tokens)) allTokens.push(...tokens);
  });

  const uniqueTokens = Array.from(new Set(allTokens));
  if (uniqueTokens.length === 0) {
    logger.info("Nenhum token FCM encontrado para envio.");
    return;
  }

  const response = await messaging.sendEachForMulticast({
    notification: {title, body},
    data: {url},
    tokens: uniqueTokens,
  });

  logger.info(
    `${response.successCount} notificações enviadas, ` +
    `${response.failureCount} falhas.`,
  );
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
