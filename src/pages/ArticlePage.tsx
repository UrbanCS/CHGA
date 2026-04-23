import { ArrowLeft, ExternalLink, Radio } from "lucide-react";
import { StateBlock } from "../components/StateBlock";
import { formatDate } from "../lib/date";
import type { Article, AudioClip } from "../lib/types";

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
          {article.audioClips.length ? (
            <section className="space-y-4">
              {article.audioClips.map((clip) => (
                <AudioClipCard key={clip.audioUrl} clip={clip} articleDate={article.date} />
              ))}
            </section>
          ) : null}
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

function AudioClipCard({ clip, articleDate }: { clip: AudioClip; articleDate: string }) {
  return (
    <section className="overflow-hidden rounded-lg bg-chga-blue p-4 text-white shadow-soft">
      <div className="flex gap-4">
        <img className="h-24 w-24 shrink-0 rounded-md object-cover" src={clip.imageUrl} alt="" loading="lazy" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-normal text-cyan-300">{formatDate(articleDate)}</p>
            <h2 className="text-xl font-black leading-tight">{clip.title}</h2>
          </div>
          <div className="rounded-md bg-cyan-300/95 p-2 text-chga-blue">
            <audio className="article-audio w-full" controls preload="none" src={clip.audioUrl}>
              Votre navigateur ne supporte pas l'audio HTML5.
            </audio>
          </div>
        </div>
      </div>
      {clip.excerpt ? (
        <p className="mt-4 text-sm leading-6 text-white/90">{clip.excerpt}</p>
      ) : (
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-white/85">
          <Radio className="h-4 w-4" />
          Extrait audio CHGA
        </div>
      )}
    </section>
  );
}
