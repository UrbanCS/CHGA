import { ArrowLeft, ExternalLink } from "lucide-react";
import { StateBlock } from "../components/StateBlock";
import { formatDate } from "../lib/date";
import type { Article } from "../lib/types";

type Props = {
  article: Article | null;
  loading: boolean;
  error: string;
  onBack: () => void;
  onRetry: () => void;
};

export function ArticlePage({ article, loading, error, onBack, onRetry }: Props) {
  return (
    <article className="space-y-4">
      <button className="flex min-h-11 items-center gap-2 rounded-md text-sm font-bold text-chga-blue" type="button" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>
      {loading ? <StateBlock type="loading" title="Chargement de l’article" /> : null}
      {error ? <StateBlock type="error" title="Article indisponible" message={error} onRetry={onRetry} /> : null}
      {!loading && !error && article ? (
        <>
          <img className="aspect-[16/10] w-full rounded-lg object-cover shadow-soft" src={article.imageUrl} alt="" />
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-normal text-chga-red">{article.category}</p>
            <h1 className="text-3xl font-black leading-tight text-chga-ink">{article.title}</h1>
            <p className="text-sm text-slate-500">{formatDate(article.date)}</p>
          </div>
          {article.contentHtml ? (
            <div
              className="article-body rounded-lg bg-white p-5 text-[17px] leading-8 text-slate-800 shadow-soft"
              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
            />
          ) : (
            <StateBlock type="empty" title="Contenu non disponible" message="L’article peut être consulté sur le site CHGA." />
          )}
          <a
            className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-chga-blue"
            href={article.link}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            Ouvrir sur chga.fm
          </a>
        </>
      ) : null}
    </article>
  );
}
