const CHGA_HOME = "https://www.chga.fm";
const WP_BASE = `${CHGA_HOME}/wp-json`;
const FALLBACK_IMAGE = `${CHGA_HOME}/app/uploads/2022/01/radio-chga-couverture.jpg`;

type Rendered = {
  rendered?: string;
};

type WpPost = {
  id: number;
  date: string;
  slug: string;
  link: string;
  title: Rendered;
  excerpt?: Rendered;
  content?: Rendered;
  categories?: number[];
  featured_media?: number;
  meta?: Record<string, string>;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      media_details?: {
        sizes?: Record<string, { source_url?: string }>;
      };
    }>;
    "wp:term"?: Array<Array<{ id: number; name: string; slug: string }>>;
  };
};

type TribeEvent = {
  id: number;
  url: string;
  title: string;
  excerpt: string;
  start_date: string;
  end_date: string;
  image?: false | { url?: string };
  venue?: { venue?: string; city?: string };
};

export type NewsItem = {
  id: number;
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  imageUrl: string;
  link: string;
};

export type Article = NewsItem & {
  contentHtml: string;
};

export type Podcast = {
  id: number;
  title: string;
  date: string;
  excerpt: string;
  imageUrl: string;
  audioUrl: string;
  duration: string;
  link: string;
};

export type EventItem = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  excerpt: string;
  imageUrl: string;
  venue: string;
  link: string;
};

export type LiveInfo = {
  title: string;
  thumbnail: string;
  schedule?: {
    timeframe?: string;
  };
  next?: {
    title?: string;
    thumbnail?: string;
    schedule?: {
      timeframe?: string;
    };
  };
  streamUrl: string;
};

export async function getNews(limit = 12): Promise<NewsItem[]> {
  const posts = await fetchJson<WpPost[]>(
    `${WP_BASE}/wp/v2/posts?categories=19&per_page=${limit}&_embed=1`
  );

  return Promise.all(posts.map((post) => mapNewsPost(post, false)));
}

export async function getArticle(slug: string): Promise<Article> {
  const posts = await fetchJson<WpPost[]>(
    `${WP_BASE}/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=1`
  );

  if (!posts[0]) {
    throw new HttpError(404, "Article introuvable.");
  }

  const base = await mapNewsPost(posts[0], true);
  const html = await fetchText(posts[0].link);
  const scraped = parseArticlePage(html);

  return {
    ...base,
    title: scraped.title || base.title,
    category: scraped.category || base.category,
    excerpt: scraped.excerpt || base.excerpt,
    imageUrl: scraped.imageUrl || base.imageUrl,
    contentHtml: scraped.contentHtml || sanitizeHtml(posts[0].content?.rendered || "")
  };
}

export async function getPodcasts(limit = 6): Promise<Podcast[]> {
  const episodes = await fetchJson<WpPost[]>(
    `${WP_BASE}/wp/v2/podcast?per_page=${limit}&_embed=1`
  );

  return episodes.map((episode) => ({
    id: episode.id,
    title: clean(episode.title.rendered),
    date: episode.date,
    excerpt: toText(episode.excerpt?.rendered || episode.content?.rendered || ""),
    imageUrl: episode.meta?.cover_image || getEmbeddedImage(episode) || FALLBACK_IMAGE,
    audioUrl: episode.meta?.audio_file || "",
    duration: episode.meta?.duration || "",
    link: episode.link
  }));
}

export async function getEvents(limit = 6): Promise<EventItem[]> {
  const data = await fetchJson<{ events?: TribeEvent[] }>(
    `${WP_BASE}/tribe/events/v1/events?per_page=${limit}`
  );

  return (data.events || []).map((event) => ({
    id: event.id,
    title: clean(event.title),
    startDate: event.start_date,
    endDate: event.end_date,
    excerpt: toText(event.excerpt || ""),
    imageUrl: event.image && event.image.url ? event.image.url : FALLBACK_IMAGE,
    venue: [event.venue?.venue, event.venue?.city].filter(Boolean).join(", "),
    link: event.url
  }));
}

export async function getLiveInfo(): Promise<LiveInfo> {
  const data = await fetchJson<Omit<LiveInfo, "streamUrl">>(`${WP_BASE}/chga/v1/radio/update`);
  const html = await fetchText(`${CHGA_HOME}/wp/wp-admin/admin-ajax.php`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "action=get_live_radio"
  });

  return {
    ...data,
    streamUrl: matchFirst(html, /<audio[^>]+src=["']([^"']+)["']/i) || "https://arcq.streamb.live/SB00209"
  };
}

async function mapNewsPost(post: WpPost, detail: boolean): Promise<NewsItem> {
  const embeddedImage = getEmbeddedImage(post);
  let scraped: Partial<NewsItem> = {};

  if (detail || !embeddedImage || !post.excerpt?.rendered) {
    scraped = parseArticlePage(await fetchText(post.link));
  }

  return {
    id: post.id,
    slug: post.slug,
    title: clean(post.title.rendered),
    date: post.date,
    category: getCategory(post) || scraped.category || "Actualité locale",
    excerpt: toText(post.excerpt?.rendered || scraped.excerpt || ""),
    imageUrl: embeddedImage || scraped.imageUrl || FALLBACK_IMAGE,
    link: post.link
  };
}

function getEmbeddedImage(post: WpPost): string {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  return (
    media?.media_details?.sizes?.medium_large?.source_url ||
    media?.media_details?.sizes?.large?.source_url ||
    media?.source_url ||
    ""
  );
}

function getCategory(post: WpPost): string {
  return post._embedded?.["wp:term"]?.flat().find((term) => post.categories?.includes(term.id))?.name || "";
}

function parseArticlePage(html: string): Partial<Article> {
  const article = matchFirst(html, /<article[^>]*class=["'][^"']*blog-item__article[^"']*["'][^>]*>([\s\S]*?)<\/article>/i) || "";
  const body = article || html;
  const contentMatch =
    matchFirst(body, /<div[^>]*class=["'][^"']*wysiwyg__content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
    matchFirst(body, /<div[^>]*class=["'][^"']*blog-item__article-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  const paragraphs = Array.from(body.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi))
    .map((match) => match[0])
    .filter((paragraph) => !/Partager|Ajustez|cookies/i.test(toText(paragraph)));
  const contentHtml = sanitizeHtml(contentMatch || paragraphs.join(""));

  return {
    title: clean(matchFirst(body, /<h1[^>]*>([\s\S]*?)<\/h1>/i)),
    category: clean(matchFirst(body, /<span[^>]*class=["'][^"']*blog-item__article-cat[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)),
    imageUrl: absolutize(
      matchFirst(body, /<img[^>]+data-lazy-src=["']([^"']+)["']/i) ||
        matchFirst(body, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    ),
    excerpt: toText(paragraphs[0] || ""),
    contentHtml
  };
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\s(on\w+)=["'][^"']*["']/gi, "")
    .replace(/href=["']javascript:[^"']*["']/gi, "")
    .trim();
}

function toText(html: string): string {
  return clean(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function clean(value = ""): string {
  return decodeEntities(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&ecirc;/g, "ê")
    .replace(/&agrave;/g, "à")
    .replace(/&ccedil;/g, "ç")
    .replace(/&nbsp;/g, " ");
}

function matchFirst(value: string, regex: RegExp): string {
  return value.match(regex)?.[1]?.trim() || "";
}

function absolutize(url = ""): string {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${CHGA_HOME}${url}`;
  return url;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetchWithHeaders(url, init);
  if (!response.ok) {
    throw new HttpError(response.status, `CHGA a retourné ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const response = await fetchWithHeaders(url, init);
  if (!response.ok) {
    throw new HttpError(response.status, `CHGA a retourné ${response.status}.`);
  }
  return response.text();
}

function fetchWithHeaders(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      "user-agent": "CHGA-PWA-MVP/0.1 (+https://www.chga.fm)",
      accept: "application/json,text/html;q=0.9,*/*;q=0.8",
      ...init.headers
    }
  });
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function sendJson(response: { status: (code: number) => { json: (body: unknown) => void } }, data: unknown): void {
  response.status(200).json(data);
}

export function sendError(
  response: { status: (code: number) => { json: (body: unknown) => void } },
  error: unknown
): void {
  if (error instanceof HttpError) {
    response.status(error.status).json({ message: error.message });
    return;
  }
  response.status(500).json({ message: "Impossible de joindre CHGA pour le moment." });
}
