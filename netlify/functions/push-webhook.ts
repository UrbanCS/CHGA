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

  return json(
    {
      message:
        "Webhook reçu. Brancher ici OneSignal REST API ou Firebase Cloud Messaging quand les clés de production seront configurées."
    },
    202
  );
};

