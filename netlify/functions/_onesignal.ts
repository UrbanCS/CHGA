type PushPayload = {
  title: string;
  excerpt: string;
  url: string;
  imageUrl?: string;
};

export async function sendOneSignalPush(payload: PushPayload): Promise<unknown> {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    throw new OneSignalConfigError("OneSignal n’est pas configuré côté Netlify.");
  }

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Key ${apiKey}`
    },
    body: JSON.stringify({
      app_id: appId,
      target_channel: "push",
      isAnyWeb: true,
      filters: [{ field: "session_count", relation: ">", value: "0" }],
      headings: {
        en: payload.title,
        fr: payload.title
      },
      contents: {
        en: payload.excerpt,
        fr: payload.excerpt
      },
      url: payload.url,
      chrome_web_icon: `${getAppBaseUrl()}icons/icon-192.png`,
      chrome_web_image: payload.imageUrl || undefined
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new OneSignalApiError(response.status, data);
  }

  return data;
}

export function getAppBaseUrl(): string {
  const configuredUrl = process.env.CHGA_PWA_URL || "https://chgamobile.netlify.app/";
  return configuredUrl.endsWith("/") ? configuredUrl : `${configuredUrl}/`;
}

export function getArticleUrl(slug: string): string {
  return `${getAppBaseUrl()}?article=${encodeURIComponent(slug)}`;
}

export class OneSignalConfigError extends Error {
  status = 500;
}

export class OneSignalApiError extends Error {
  constructor(
    public status: number,
    public details: unknown
  ) {
    super("Erreur OneSignal.");
  }
}
