import { useEffect, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { getJson, prefetchJson } from "./lib/api";
import { initOneSignal } from "./lib/onesignal";
import { siteConfig } from "./lib/site-config";
import type { Article, NewsItem } from "./lib/types";
import type { View } from "./lib/views";
import { ArticlePage } from "./pages/ArticlePage";
import { HomePage } from "./pages/HomePage";
import { LivePage } from "./pages/LivePage";
import { MorePage } from "./pages/MorePage";
import { NewsPage } from "./pages/NewsPage";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function App() {
  const [view, setView] = useState<View>("home");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState("");
  const [articleSlug, setArticleSlug] = useState("");
  const [article, setArticle] = useState<Article | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState("");
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

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
    const timer = window.setTimeout(() => {
      prefetchJson("/api/podcasts");
      prefetchJson("/api/events");
    }, 1_500);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    initOneSignal();
  }, []);

  useEffect(() => {
    document.title = siteConfig.branding.appName;

    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) {
      descriptionTag.setAttribute("content", siteConfig.branding.browserDescription);
    }

    const themeTag = document.querySelector('meta[name="theme-color"]');
    if (themeTag) {
      themeTag.setAttribute("content", siteConfig.branding.themeColor);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
      setInstalling(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const openArticle = (slug: string) => {
    setArticleSlug(slug);
    setView("article");
    setArticle(null);
    setArticleError("");
    setArticleLoading(true);
    getJson<Article>(`/api/news-detail?slug=${encodeURIComponent(slug)}`)
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

  const openMore = () => {
    changeView("more");
  };

  const triggerInstall = async () => {
    if (!installPromptEvent) {
      openMore();
      return;
    }

    setInstalling(true);

    try {
      await installPromptEvent.prompt();
      await installPromptEvent.userChoice;
    } finally {
      setInstallPromptEvent(null);
      setInstalling(false);
    }
  };

  return (
    <div className="min-h-dvh bg-chga-mist pb-24 text-chga-ink">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <button className="text-left" type="button" onClick={() => changeView("home")}>
            <p className="text-xl font-black text-chga-blue">{siteConfig.branding.headerTitle}</p>
            <p className="-mt-1 text-xs font-semibold text-slate-500">{siteConfig.branding.headerSubtitle}</p>
          </button>
          <button
            className="min-h-10 rounded-md bg-chga-red px-3 py-2 text-sm font-black text-white"
            type="button"
            onClick={() => changeView("live")}
          >
            {siteConfig.navigation.live}
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
            canInstall={Boolean(installPromptEvent)}
            installing={installing}
            onInstall={triggerInstall}
            onOpenMore={openMore}
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
