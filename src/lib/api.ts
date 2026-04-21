const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    signal,
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    const fallback = "Une erreur réseau est survenue.";
    const data = (await response.json().catch(() => ({ message: fallback }))) as { message?: string };
    throw new Error(data.message || fallback);
  }

  return response.json() as Promise<T>;
}
