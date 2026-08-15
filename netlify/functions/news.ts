import type { Handler } from "@netlify/functions";
import { getNews } from "../../api/_lib/chga";
import { errorJson, json } from "./_response";

export const handler: Handler = async (event) => {
  try {
    const limit = Number(event.queryStringParameters?.limit || 12);
    return json(await getNews(Math.min(Math.max(limit, 1), 20)), 200, {
      browserMaxAge: 60,
      edgeMaxAge: 60,
      edgeStaleWhileRevalidate: 300,
      varyQuery: ["limit"]
    });
  } catch (error) {
    return errorJson(error);
  }
};

