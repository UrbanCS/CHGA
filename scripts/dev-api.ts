import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import { getArticle, getEvents, getLiveInfo, getNews, getPodcasts } from "../api/_lib/chga";

const PORT = 8787;

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);

    if (request.method !== "GET") {
      send(response, 405, { message: "Méthode non permise." });
      return;
    }

    if (url.pathname === "/api/news") {
      send(response, 200, await getNews(Number(url.searchParams.get("limit") || 12)));
      return;
    }

    if (url.pathname.startsWith("/api/news/")) {
      send(response, 200, await getArticle(decodeURIComponent(url.pathname.replace("/api/news/", ""))));
      return;
    }

    if (url.pathname === "/api/live") {
      send(response, 200, await getLiveInfo());
      return;
    }

    if (url.pathname === "/api/podcasts") {
      send(response, 200, await getPodcasts(Number(url.searchParams.get("limit") || 6)));
      return;
    }

    if (url.pathname === "/api/events") {
      send(response, 200, await getEvents(Number(url.searchParams.get("limit") || 6)));
      return;
    }

    send(response, 404, { message: "Endpoint introuvable." });
  } catch (error) {
    send(response, 500, { message: error instanceof Error ? error.message : "Erreur API locale." });
  }
}).listen(PORT, () => {
  console.log(`API locale CHGA: http://localhost:${PORT}`);
});

function send(response: ServerResponse, status: number, data: unknown) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(data));
}
