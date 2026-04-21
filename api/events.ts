import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getEvents, sendError, sendJson } from "./_lib/chga";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    const limit = Number(request.query.limit || 6);
    sendJson(response, await getEvents(Math.min(Math.max(limit, 1), 12)));
  } catch (error) {
    sendError(response, error);
  }
}
