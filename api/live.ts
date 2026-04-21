import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getLiveInfo, sendError, sendJson } from "./_lib/chga";

export default async function handler(_request: VercelRequest, response: VercelResponse) {
  try {
    sendJson(response, await getLiveInfo());
  } catch (error) {
    sendError(response, error);
  }
}
