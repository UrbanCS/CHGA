const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const responseCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<unknown>>();

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = `${API_BASE}${path}`;
  const cached = responseCache.get(url);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  responseCache.delete(url);

  if (!signal) {
    const inFlight = inFlightRequests.get(url);
    if (inFlight) return inFlight as Promise<T>;
  }

  const request = fetch(url, {
    signal,
    headers: {
      accept: "application/json"
    }
  }).then(async (response) => {
    if (!response.ok) {
      const fallback = "Une erreur réseau est survenue.";
      const data = (await response.json().catch(() => ({ message: fallback }))) as { message?: string };
      throw new Error(data.message || fallback);
    }

    const data = (await response.json()) as T;
    responseCache.set(url, {
      value: data,
      expiresAt: Date.now() + getCacheTtl(path)
    });
    return data;
  });

  if (!signal) {
    inFlightRequests.set(url, request);
    request.finally(() => inFlightRequests.delete(url)).catch(() => undefined);
  }

  return request;
}

export function prefetchJson(path: string): void {
  getJson(path).catch(() => undefined);
}

function getCacheTtl(path: string): number {
  if (path.startsWith("/api/podcasts") || path.startsWith("/api/events") || path.startsWith("/api/news-detail")) {
    return 5 * 60_000;
  }

  if (path.startsWith("/api/live")) return 30_000;
  return 60_000;
}
