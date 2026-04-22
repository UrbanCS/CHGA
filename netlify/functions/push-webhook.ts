import type { Handler } from "@netlify/functions";
import { json } from "./_response";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json({ message: "Méthode non permise." }, 405);
  }

  const secret = process.env.CHGA_PUSH_WEBHOOK_SECRET;
  if (secret && event.headers["x-chga-secret"] !== secret) {
    return json({ message: "Secret invalide." }, 401);
  }

  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    return json({ message: "OneSignal n’est pas configuré côté Netlify." }, 500);
  }

  const payload = parseBody(event.body);
  const title = payload.title || "CHGA";
  const excerpt = payload.excerpt || "Une nouvelle nouvelle est disponible.";
  const url = payload.url || "https://chgamobile.netlify.app/";

  const oneSignalResponse = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Key ${apiKey}`
    },
    body: JSON.stringify({
      app_id: appId,
      target_channel: "push",
      included_segments: ["Subscribed Users"],
      headings: {
        en: title,
        fr: title
      },
      contents: {
        en: excerpt,
        fr: excerpt
      },
      url,
      chrome_web_icon: "https://chgamobile.netlify.app/icons/icon-192.png",
      chrome_web_image: payload.imageUrl || undefined
    })
  });

  const data = await oneSignalResponse.json().catch(() => ({}));

  if (!oneSignalResponse.ok) {
    return json({ message: "Erreur OneSignal.", details: data }, oneSignalResponse.status);
  }

  return json({ message: "Notification envoyée.", details: data }, 202);
};

function parseBody(body: string | null): { title?: string; excerpt?: string; url?: string; imageUrl?: string } {
  if (!body) return {};

  try {
    return JSON.parse(body) as { title?: string; excerpt?: string; url?: string; imageUrl?: string };
  } catch {
    return {};
  }
}
