import { useEffect, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { getJson } from "./lib/api";
import { initOneSignal } from "./lib/onesignal";
import type { Article, NewsItem } from "./lib/types";
import type { View } from "./lib/views";
import { ArticlePage } from "./pages/ArticlePage";
import { HomePage } from "./pages/HomePage";
import { LivePage } from "./pages/LivePage";
import { MorePage } from "./pages/MorePage";
import { NewsPage } from "./pages/NewsPage";

export function App() {
  const [view, setView] = useState<View>("home");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState("");
  const [articleSlug, setArticleSlug] = useState("");
  const [article, setArticle] = useState<Article | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState("");

  const loadNews = () => {
    setNewsLoading(true);
    setNewsError("");
    getJson<NewsItem[]>("/api/news?limit=12")
      .then(setNews)
      .catch((error: Error) => setNewsError(error.message))
      .finally(() => setNewsLoading(false));
  };

  useEffect(loadNews, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    initOneSignal();
  }, []);

  const openArticle = (slug: string) => {
    setArticleSlug(slug);
    setView("article");
    setArticle(null);
    setArticleError("");
    setArticleLoading(true);
    getJson<Article>(`/api/news/${slug}`)
      .then(setArticle)
      .catch((error: Error) => setArticleError(error.message))
      .finally(() => setArticleLoading(false));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("article");
    if (slug) {
      window.history.replaceState({}, "", "/");
      openArticle(slug);
    }
  }, []);

  const retryArticle = () => {
    if (articleSlug) openArticle(articleSlug);
  };

  const changeView = (nextView: View) => {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-dvh bg-chga-mist pb-24 text-chga-ink">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <button className="text-left" type="button" onClick={() => changeView("home")}>
            <p className="text-xl font-black text-chga-blue">CHGA</p>
            <p className="-mt-1 text-xs font-semibold text-slate-500">Mobile</p>
          </button>
          <button
            className="min-h-10 rounded-md bg-chga-red px-3 py-2 text-sm font-black text-white"
            type="button"
            onClick={() => changeView("live")}
          >
            Direct
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-5">
        {view === "home" ? (
          <HomePage
            news={news}
            loading={newsLoading}
            error={newsError}
            onRetry={loadNews}
            onOpenArticle={openArticle}
            onOpenLive={() => changeView("live")}
            onOpenNews={() => changeView("news")}
          />
        ) : null}
        {view === "news" ? (
          <NewsPage news={news} loading={newsLoading} error={newsError} onRetry={loadNews} onOpenArticle={openArticle} />
        ) : null}
        {view === "article" ? (
          <ArticlePage
            article={article}
            loading={articleLoading}
            error={articleError}
            onBack={() => changeView("news")}
            onRetry={retryArticle}
          />
        ) : null}
        {view === "live" ? <LivePage /> : null}
        {view === "more" ? <MorePage /> : null}
      </main>

      <BottomNav view={view === "article" ? "news" : view} onChange={changeView} />
    </div>
  );
}
