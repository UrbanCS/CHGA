import { getStore } from "@netlify/blobs";
import { schedule, type Handler } from "@netlify/functions";
import { getNews, type NewsItem } from "../../api/_lib/chga";
import { getArticleUrl, sendOneSignalPush } from "./_onesignal";
import { json } from "./_response";

type PushState = {
  notifiedIds: number[];
  initializedAt: string;
  lastCheckedAt: string;
};

type CheckResult = {
  checkedAt: string;
  initialized: boolean;
  totalNews: number;
  notificationsSent: number;
  notifiedTitles: string[];
};

const STORE_NAME = "chga-push";
const STATE_KEY = "notified-news";
const MAX_STORED_IDS = 100;
const MAX_NOTIFICATIONS_PER_RUN = 3;

const runCheck = async (): Promise<CheckResult> => {
  const checkedAt = new Date().toISOString();
  const news = await getNews(10);
  const store = getStore(STORE_NAME);
  const state = await store.get(STATE_KEY, { type: "json" }) as PushState | null;
  const currentIds = news.map((item) => item.id);

  if (!state) {
    await store.setJSON(STATE_KEY, {
      notifiedIds: currentIds,
      initializedAt: checkedAt,
      lastCheckedAt: checkedAt
    } satisfies PushState);

    return {
      checkedAt,
      initialized: true,
      totalNews: news.length,
      notificationsSent: 0,
      notifiedTitles: []
    };
  }

  const knownIds = new Set(state.notifiedIds);
  const newItems = news.filter((item) => !knownIds.has(item.id));
  const itemsToNotify = newItems.slice(0, MAX_NOTIFICATIONS_PER_RUN).reverse();
  const notifiedTitles: string[] = [];

  for (const item of itemsToNotify) {
    await sendNewsNotification(item);
    notifiedTitles.push(item.title);
  }

  const notifiedIds = Array.from(new Set([...currentIds, ...state.notifiedIds])).slice(0, MAX_STORED_IDS);
  await store.setJSON(STATE_KEY, {
    notifiedIds,
    initializedAt: state.initializedAt,
    lastCheckedAt: checkedAt
  } satisfies PushState);

  return {
    checkedAt,
    initialized: false,
    totalNews: news.length,
    notificationsSent: notifiedTitles.length,
    notifiedTitles
  };
};

const manualHandler: Handler = async (event) => {
  const secret = process.env.CHGA_PUSH_WEBHOOK_SECRET;
  if (secret && event.headers["x-chga-secret"] !== secret) {
    return json({ message: "Secret invalide." }, 401);
  }

  try {
    return json(await runCheck());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    return json({ message: "Impossible de vérifier les nouvelles.", error: message }, 500);
  }
};

export const handler = schedule("*/15 * * * *", manualHandler);

async function sendNewsNotification(item: NewsItem): Promise<void> {
  await sendOneSignalPush({
    title: item.title,
    excerpt: item.excerpt || "Une nouvelle nouvelle est disponible.",
    url: getArticleUrl(item.slug),
    imageUrl: item.imageUrl
  });
}
