import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.status(405).json({ message: "Méthode non permise." });
    return;
  }

  const secret = process.env.CHGA_PUSH_WEBHOOK_SECRET;
  if (secret && request.headers["x-chga-secret"] !== secret) {
    response.status(401).json({ message: "Secret invalide." });
    return;
  }

  response.status(202).json({
    message:
      "Webhook reçu. Brancher ici OneSignal REST API ou Firebase Cloud Messaging quand les clés de production seront configurées."
  });
}
