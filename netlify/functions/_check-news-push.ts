import { connectLambda, getStore } from "@netlify/blobs";
import type { Handler } from "@netlify/functions";
import { getNews, type NewsItem } from "../../api/_lib/chga";
import { getArticleUrl, sendOneSignalPush } from "./_onesignal";

type PushState = {
  notifiedIds: number[];
  initializedAt: string;
  lastCheckedAt: string;
};

export type CheckNewsPushResult = {
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

export async function runCheckNewsPush(event: Parameters<Handler>[0]): Promise<CheckNewsPushResult> {
  connectLambda(event as unknown as Parameters<typeof connectLambda>[0]);

  const checkedAt = new Date().toISOString();
  const news = await getNews(10);
  const store = getStore(STORE_NAME);
  const state = (await store.get(STATE_KEY, { type: "json" })) as PushState | null;
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
}

export function logCheckNewsPush(mode: "manual" | "scheduled", result: CheckNewsPushResult) {
  console.log(
    "check-news-push",
    JSON.stringify({
      mode,
      checkedAt: result.checkedAt,
      initialized: result.initialized,
      totalNews: result.totalNews,
      notificationsSent: result.notificationsSent,
      notifiedTitles: result.notifiedTitles
    })
  );
}

export function logCheckNewsPushError(mode: "manual" | "scheduled", error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur inconnue.";
  const name = error instanceof Error ? error.name : "UnknownError";
  console.error(
    "check-news-push error",
    JSON.stringify({
      mode,
      name,
      message
    })
  );
}

async function sendNewsNotification(item: NewsItem): Promise<void> {
  await sendOneSignalPush({
    title: item.title,
    excerpt: item.excerpt || "Une nouvelle nouvelle est disponible.",
    url: getArticleUrl(item.slug),
    imageUrl: item.imageUrl
  });
}
