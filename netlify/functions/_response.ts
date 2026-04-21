import { HttpError } from "../../api/_lib/chga";

export function json(data: unknown, statusCode = 200) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60"
    },
    body: JSON.stringify(data)
  };
}

export function errorJson(error: unknown) {
  if (error instanceof HttpError) {
    return json({ message: error.message }, error.status);
  }

  return json({ message: "Impossible de joindre CHGA pour le moment." }, 500);
}

