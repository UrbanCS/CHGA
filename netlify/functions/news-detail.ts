import type { Handler } from "@netlify/functions";
import { getArticle } from "../../api/_lib/chga";
import { errorJson, json } from "./_response";

export const handler: Handler = async (event) => {
  try {
    const slug = event.queryStringParameters?.slug;

    if (!slug) {
      return json({ message: "Slug requis." }, 400);
    }

    return json(await getArticle(slug), 200, {
      browserMaxAge: 300,
      edgeMaxAge: 300,
      edgeStaleWhileRevalidate: 3_600,
      varyQuery: ["slug"]
    });
  } catch (error) {
    return errorJson(error);
  }
};

