import { HttpError } from "../../api/_lib/chga";

export type CacheOptions = {
  browserMaxAge: number;
  edgeMaxAge: number;
  edgeStaleWhileRevalidate: number;
  varyQuery?: string[];
};

export function json(data: unknown, statusCode = 200, cache?: CacheOptions) {
  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  };

  if (cache && statusCode >= 200 && statusCode < 300) {
    headers["cache-control"] = `public, max-age=${cache.browserMaxAge}`;
    headers["netlify-cdn-cache-control"] =
      `public, durable, max-age=${cache.edgeMaxAge}, stale-while-revalidate=${cache.edgeStaleWhileRevalidate}`;

    if (cache.varyQuery?.length) {
      headers["netlify-vary"] = `query=${cache.varyQuery.join("|")}`;
    }
  }

  return {
    statusCode,
    headers,
    body: JSON.stringify(data)
  };
}

export function errorJson(error: unknown) {
  if (error instanceof HttpError) {
    return json({ message: error.message }, error.status);
  }

  return json({ message: "Impossible de joindre CHGA pour le moment." }, 500);
}

