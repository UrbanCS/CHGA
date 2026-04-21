import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getNews, sendError, sendJson } from "./_lib/chga";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    const limit = Number(request.query.limit || 12);
    sendJson(response, await getNews(Math.min(Math.max(limit, 1), 20)));
  } catch (error) {
    sendError(response, error);
  }
}
