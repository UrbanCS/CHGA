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
