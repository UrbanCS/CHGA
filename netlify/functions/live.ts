import type { Handler } from "@netlify/functions";
import { getLiveInfo } from "../../api/_lib/chga";
import { errorJson, json } from "./_response";

export const handler: Handler = async () => {
  try {
    return json(await getLiveInfo(), 200, {
      browserMaxAge: 30,
      edgeMaxAge: 30,
      edgeStaleWhileRevalidate: 60
    });
  } catch (error) {
    return errorJson(error);
  }
};

