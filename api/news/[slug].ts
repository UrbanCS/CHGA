import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getArticle, sendError, sendJson } from "../_lib/chga";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    const rawSlug = request.query.slug;
    const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

    if (!slug) {
      response.status(400).json({ message: "Slug requis." });
      return;
    }

    sendJson(response, await getArticle(slug));
  } catch (error) {
    sendError(response, error);
  }
}
