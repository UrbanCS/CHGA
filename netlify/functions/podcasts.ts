import type { Handler } from "@netlify/functions";
import { getPodcasts } from "../../api/_lib/chga";
import { errorJson, json } from "./_response";

export const handler: Handler = async (event) => {
  try {
    const limit = Number(event.queryStringParameters?.limit || 6);
    return json(await getPodcasts(Math.min(Math.max(limit, 1), 12)));
  } catch (error) {
    return errorJson(error);
  }
};

