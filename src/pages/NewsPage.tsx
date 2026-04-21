import type { NewsItem } from "../lib/types";
import { NewsCard } from "../components/NewsCard";
import { StateBlock } from "../components/StateBlock";

type Props = {
  news: NewsItem[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onOpenArticle: (slug: string) => void;
};

export function NewsPage({ news, loading, error, onRetry, onOpenArticle }: Props) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-normal text-chga-red">Actualité locale</p>
        <h1 className="mt-1 text-3xl font-black text-chga-ink">Nouvelles</h1>
      </div>
      {loading ? <StateBlock type="loading" title="Chargement des nouvelles" /> : null}
      {error ? <StateBlock type="error" title="Nouvelles indisponibles" message={error} onRetry={onRetry} /> : null}
      {!loading && !error && news.length === 0 ? <StateBlock type="empty" title="Aucune nouvelle trouvée" /> : null}
      <div className="space-y-4">
        {news.map((item) => (
          <NewsCard key={item.id} item={item} onOpen={onOpenArticle} />
        ))}
      </div>
    </section>
  );
}
