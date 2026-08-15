import type { Handler } from "@netlify/functions";
import { getEvents } from "../../api/_lib/chga";
import { errorJson, json } from "./_response";

export const handler: Handler = async (event) => {
  try {
    const limit = Number(event.queryStringParameters?.limit || 6);
    return json(await getEvents(Math.min(Math.max(limit, 1), 12)), 200, {
      browserMaxAge: 300,
      edgeMaxAge: 300,
      edgeStaleWhileRevalidate: 3_600,
      varyQuery: ["limit"]
    });
  } catch (error) {
    return errorJson(error);
  }
};

