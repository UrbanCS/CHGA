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

export type AudioClip = {
  title: string;
  audioUrl: string;
  imageUrl: string;
};

export type ArticleBlock =
  | {
      type: "html";
      html: string;
    }
  | {
      type: "audio";
      clip: AudioClip;
    };

export type Article = NewsItem & {
  author: string;
  contentHtml: string;
  audioClips: AudioClip[];
  contentBlocks: ArticleBlock[];
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
    author: scraped.author || "",
    category: scraped.category || base.category,
    excerpt: scraped.excerpt || base.excerpt,
    imageUrl: scraped.imageUrl || base.imageUrl,
    contentHtml: scraped.contentHtml || sanitizeHtml(posts[0].content?.rendered || ""),
    audioClips: scraped.audioClips || [],
    contentBlocks: scraped.contentBlocks || []
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
  const scraped = parseArticlePage(await fetchText(post.link));

  return {
    id: post.id,
    slug: post.slug,
    title: clean(post.title.rendered),
    date: post.date,
    category: getCategory(post) || scraped.category || "Actualité locale",
    excerpt: toText(post.excerpt?.rendered || scraped.excerpt || ""),
    imageUrl: scraped.imageUrl || embeddedImage || FALLBACK_IMAGE,
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
  const flexibleContent =
    matchFirst(html, /<!-- Flexible components -->([\s\S]*?)<!-- Footer -->/i) ||
    matchFirst(html, /<!-- Flexible components -->([\s\S]*?)<div class="social">/i);
  const body = flexibleContent || article || html;
  const heroFigure =
    matchFirst(html, /<figure[^>]*class=["'][^"']*figure__main[^"']*["'][^>]*>([\s\S]*?)<\/figure>/i) || "";
  const imageUrl = absolutize(
    matchFirst(heroFigure, /<img[^>]+data-lazy-src=["']([^"']+)["']/i) ||
      matchFirst(heroFigure, /<img[^>]+src=["']([^"']+)["']/i) ||
      matchFirst(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      matchFirst(html, /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
      matchFirst(body, /<img[^>]+data-lazy-src=["']([^"']+)["']/i)
  );
  const contentBlocks = parseContentBlocks(body, imageUrl || FALLBACK_IMAGE);
  const paragraphs = contentBlocks.filter((block): block is Extract<ArticleBlock, { type: "html" }> => block.type === "html");
  const audioClips = contentBlocks
    .filter((block): block is Extract<ArticleBlock, { type: "audio" }> => block.type === "audio")
    .map((block) => block.clip);
  const contentHtml = paragraphs.map((block) => block.html).join("");

  return {
    title: clean(matchFirst(body, /<h1[^>]*>([\s\S]*?)<\/h1>/i)),
    author:
      clean(matchFirst(html, /<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i)) ||
      clean(matchFirst(html, /<span>\s*Par\s+([\s\S]*?)<\/span>/i)),
    category: clean(matchFirst(body, /<span[^>]*class=["'][^"']*blog-item__article-cat[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)),
    imageUrl,
    excerpt: toText(paragraphs[0]?.html || ""),
    contentHtml,
    audioClips,
    contentBlocks
  };
}

function parseContentBlocks(body: string, fallbackImage: string): ArticleBlock[] {
  const audioMatches = Array.from(
    body.matchAll(
      /<h3[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>\s*<\/h3>[\s\S]*?(https:\/\/www\.chga\.fm\/app\/uploads\/[^"'<> \s]+\.mp3)[\s\S]*?<\/article>/gi
    )
  );

  const paragraphMatches = Array.from(body.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)).filter(
    (match) => !/Partager|Ajustez|cookies/i.test(toText(match[0]))
  );

  const blocks: Array<{ index: number; block: ArticleBlock }> = [];

  for (const match of paragraphMatches) {
    blocks.push({
      index: match.index || 0,
      block: {
        type: "html",
        html: sanitizeHtml(match[0])
      }
    });
  }

  for (const [index, match] of audioMatches.entries()) {
    const title = clean(match[1]);
    const audioUrl = absolutize(match[2]);
    const start = match.index || 0;
    const previousStart = index > 0 ? (audioMatches[index - 1].index || 0) : 0;
    const nextStart = audioMatches[index + 1]?.index || body.length;
    const localWindow = body.slice(previousStart, nextStart);
    const titlePattern = escapeRegex(title);
    const imageUrl = absolutize(
      matchFirst(
        localWindow,
        new RegExp(
          `<img[^>]+data-lazy-src=["']([^"']+)["'][\\s\\S]*?<h3[^>]*>[\\s\\S]*?${titlePattern}[\\s\\S]*?<\\/h3>`,
          "i"
        )
      ) ||
        matchFirst(
          localWindow,
          new RegExp(
            `<img[^>]+src=["']([^"']+)["'][\\s\\S]*?<h3[^>]*>[\\s\\S]*?${titlePattern}[\\s\\S]*?<\\/h3>`,
            "i"
          )
        )
    ) || fallbackImage;

    blocks.push({
      index: start + index,
      block: {
        type: "audio",
        clip: {
          title,
          audioUrl,
          imageUrl
        }
      }
    });
  }

  return blocks
    .sort((a, b) => a.index - b.index)
    .reduce<ArticleBlock[]>((accumulator, entry) => {
      const previous = accumulator.at(-1);

      if (entry.block.type === "html" && previous?.type === "html") {
        previous.html = `${previous.html}${entry.block.html}`;
        return accumulator;
      }

      accumulator.push(entry.block);
      return accumulator;
    }, []);
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

function lastMatch(value: string, regex: RegExp): string {
  const matches = Array.from(value.matchAll(regex));
  return matches.at(-1)?.[1]?.trim() || "";
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
