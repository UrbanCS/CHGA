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
