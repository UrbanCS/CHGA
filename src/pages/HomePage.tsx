import { Bell, Radio } from "lucide-react";
import type { NewsItem } from "../lib/types";
import { NewsCard } from "../components/NewsCard";
import { StateBlock } from "../components/StateBlock";

type Props = {
  news: NewsItem[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onOpenArticle: (slug: string) => void;
  onOpenLive: () => void;
  onOpenNews: () => void;
};

export function HomePage({ news, loading, error, onRetry, onOpenArticle, onOpenLive, onOpenNews }: Props) {
  return (
    <div className="space-y-5">
      <section className="rounded-lg bg-chga-blue p-5 text-white shadow-soft">
        <p className="text-sm font-semibold text-white/75">Radio communautaire de la Vallée-de-la-Gatineau</p>
        <h1 className="mt-2 text-3xl font-black leading-tight">CHGA Mobile</h1>
        <p className="mt-3 text-sm leading-6 text-white/85">
          Nouvelles locales, direct, balados et événements dans une PWA légère.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-bold text-chga-blue"
            type="button"
            onClick={onOpenLive}
          >
            <Radio className="h-4 w-4" />
            Direct
          </button>
          <button
            className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-chga-red px-3 py-2 text-sm font-bold text-white"
            type="button"
            onClick={onOpenNews}
          >
            <Bell className="h-4 w-4" />
            Nouvelles
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-chga-ink">Dernières nouvelles</h2>
          <button className="text-sm font-bold text-chga-blue" type="button" onClick={onOpenNews}>
            Tout voir
          </button>
        </div>
        {loading ? <StateBlock type="loading" title="Chargement des nouvelles" /> : null}
        {error ? <StateBlock type="error" title="Nouvelles indisponibles" message={error} onRetry={onRetry} /> : null}
        {!loading && !error && news.length === 0 ? <StateBlock type="empty" title="Aucune nouvelle trouvée" /> : null}
        <div className="space-y-4">
          {news.slice(0, 4).map((item) => (
            <NewsCard key={item.id} item={item} onOpen={onOpenArticle} />
          ))}
        </div>
      </section>
    </div>
  );
}
