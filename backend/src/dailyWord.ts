import {onSchedule} from "firebase-functions/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {sendNotificationToAll} from "./notifications";
import {BIBLE_SEED_DATA} from "./generated/bible-seed";

const db = admin.firestore();

const DAILY_WORD_JOB_DOC = db.collection("system_jobs").doc("daily_word");
const TIME_ZONE = "America/Sao_Paulo";

// Quantos temas recentes evitar, para o devocional variar de tema dia a dia
const RECENT_THEMES_TO_AVOID = 5;

type Verse = {theme: string; descricao: string; referencia: string};

// A base tem algumas referências repetidas em temas diferentes — cada
// versículo entra uma vez só no ciclo (vale o primeiro tema em que aparece)
const VERSE_POOL: Verse[] = Array.from(
  new Map(BIBLE_SEED_DATA.map((v) => [v.referencia, v])).values(),
);

/**
 * Sorteia o devocional do dia: um versículo que ainda não saiu no ciclo atual,
 * de um tema que não apareceu nos últimos dias. Quando todos os versículos já
 * saíram, começa um ciclo novo.
 * @param {string[]} usedRefs Referências já usadas no ciclo atual.
 * @param {string[]} recentThemes Temas recentes (mais recente primeiro).
 * @return {{verse: Verse, newCycle: boolean}} Versículo e se reiniciou.
 */
function pickDevotional(
  usedRefs: string[],
  recentThemes: string[],
): {verse: Verse; newCycle: boolean} {
  const used = new Set(usedRefs);
  let available = VERSE_POOL.filter((v) => !used.has(v.referencia));
  const newCycle = available.length === 0;
  if (newCycle) available = VERSE_POOL;

  const themes = Array.from(new Set(available.map((v) => v.theme)));
  const freshThemes = themes.filter((t) => !recentThemes.includes(t));
  const candidates = freshThemes.length > 0 ? freshThemes : themes;
  const theme = candidates[Math.floor(Math.random() * candidates.length)];

  const verses = available.filter((v) => v.theme === theme);
  const verse = verses[Math.floor(Math.random() * verses.length)];
  return {verse, newCycle};
}

/**
 * Monta o corpo da notificação a partir do texto e da referência.
 * @param {string} content Texto da palavra.
 * @param {string} [reference] Referência bíblica.
 * @return {string} Corpo da notificação.
 */
function notificationBody(content: string, reference?: string): string {
  const excerpt = content.length > 100 ?
    `${content.substring(0, 100)}...` :
    content;
  return reference ? `${excerpt} (${reference})` : excerpt;
}

/**
 * Roda todo dia às 07:00 (horário de Brasília).
 * - Se o pastor/secretaria agendou uma Palavra para hoje, ela vale e é
 *   notificada (as lançadas no próprio dia já notificaram pelo app).
 * - Se não houver nenhuma, sorteia um devocional da base de versículos
 *   (sem repetir no ciclo, variando o tema), publica como "Família Hebrom"
 *   e notifica todos.
 */
export const dailyWord = onSchedule(
  {
    schedule: "every day 07:00",
    timeZone: TIME_ZONE,
  },
  async () => {
    const todayStr = new Date().toLocaleDateString("en-CA", {
      timeZone: TIME_ZONE,
    });

    const todayQuery = db
      .collection("daily_words")
      .where("publish_date", "==", todayStr);

    // Tudo numa transação: se o job rodar duas vezes, só um publica
    const result = await db.runTransaction(async (tx) => {
      const jobSnap = await tx.get(DAILY_WORD_JOB_DOC);
      const job = jobSnap.data() ?? {};
      if (job.lastRunDate === todayStr) return {kind: "skip" as const};

      const todaySnap = await tx.get(todayQuery);
      if (!todaySnap.empty) {
        tx.set(DAILY_WORD_JOB_DOC, {lastRunDate: todayStr}, {merge: true});
        return {kind: "scheduled" as const, word: todaySnap.docs[0].data()};
      }

      const usedRefs: string[] = job.used_refs ?? [];
      const recentThemes: string[] = job.recent_themes ?? [];
      const {verse, newCycle} = pickDevotional(usedRefs, recentThemes);

      tx.set(db.collection("daily_words").doc(), {
        content: verse.descricao,
        reference: verse.referencia,
        theme: verse.theme,
        publish_date: todayStr,
        author_uid: "system",
        author_name: "Família Hebrom",
        is_auto: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      tx.set(DAILY_WORD_JOB_DOC, {
        lastRunDate: todayStr,
        used_refs: [...(newCycle ? [] : usedRefs), verse.referencia],
        recent_themes: [verse.theme, ...recentThemes]
          .slice(0, RECENT_THEMES_TO_AVOID),
      }, {merge: true});

      return {kind: "auto" as const, verse, newCycle};
    });

    if (result.kind === "skip") {
      logger.info(`Rotina da Palavra do Dia já rodou hoje (${todayStr}).`);
      return;
    }

    if (result.kind === "scheduled") {
      const createdAt: admin.firestore.Timestamp | undefined =
        result.word.created_at;
      const createdOn = createdAt?.toDate().toLocaleDateString("en-CA", {
        timeZone: TIME_ZONE,
      });
      if (createdOn === todayStr) {
        logger.info("Palavra lançada hoje já foi notificada pelo app.");
        return;
      }
      await sendNotificationToAll(
        "📖 Palavra do Dia",
        notificationBody(result.word.content ?? "", result.word.reference),
        "/dashboard/daily-word",
      );
      logger.info(`Palavra agendada de ${todayStr} notificada.`);
      return;
    }

    await sendNotificationToAll(
      "📖 Devocional do Dia",
      notificationBody(result.verse.descricao, result.verse.referencia),
      "/dashboard/daily-word",
    );
    logger.info(
      `Devocional automático de ${todayStr}: ${result.verse.referencia} ` +
      `(${result.verse.theme})${result.newCycle ? " — novo ciclo" : ""}.`,
    );
  },
);
