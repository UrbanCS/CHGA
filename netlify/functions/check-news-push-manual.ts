import type { Handler } from "@netlify/functions";
import { json } from "./_response";
import { logCheckNewsPush, logCheckNewsPushError, runCheckNewsPush } from "./_check-news-push";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json({ message: "Méthode non permise." }, 405);
  }

  const secret = process.env.CHGA_PUSH_WEBHOOK_SECRET;
  if (secret && event.headers["x-chga-secret"] !== secret) {
    return json({ message: "Secret invalide." }, 401);
  }

  try {
    const result = await runCheckNewsPush(event);
    logCheckNewsPush("manual", result);
    return json(result);
  } catch (error) {
    logCheckNewsPushError("manual", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    const name = error instanceof Error ? error.name : "UnknownError";
    return json({ message: "Impossible de vérifier les nouvelles.", error: message, name }, 500);
  }
};
