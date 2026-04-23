import type { Handler } from "@netlify/functions";
import { OneSignalApiError, OneSignalConfigError, sendOneSignalPush } from "./_onesignal";
import { json } from "./_response";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json({ message: "Méthode non permise." }, 405);
  }

  const secret = process.env.CHGA_PUSH_WEBHOOK_SECRET;
  if (secret && event.headers["x-chga-secret"] !== secret) {
    return json({ message: "Secret invalide." }, 401);
  }

  const payload = parseBody(event.body);
  const title = payload.title || "CHGA";
  const excerpt = payload.excerpt || "Une nouvelle nouvelle est disponible.";
  const url = payload.url || "https://chgamobile.netlify.app/";

  try {
    const data = await sendOneSignalPush({ title, excerpt, url, imageUrl: payload.imageUrl });
    return json({ message: "Notification envoyée.", details: data }, 202);
  } catch (error) {
    if (error instanceof OneSignalConfigError) {
      return json({ message: error.message }, error.status);
    }

    if (error instanceof OneSignalApiError) {
      return json({ message: error.message, details: error.details }, error.status);
    }

    return json({ message: "Impossible d’envoyer la notification." }, 500);
  }
};

function parseBody(body: string | null): { title?: string; excerpt?: string; url?: string; imageUrl?: string } {
  if (!body) return {};

  try {
    return JSON.parse(body) as { title?: string; excerpt?: string; url?: string; imageUrl?: string };
  } catch {
    return {};
  }
}
