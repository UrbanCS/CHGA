import { LoaderCircle, Pause, Play, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getJson } from "../lib/api";
import { siteConfig } from "../lib/site-config";
import type { LiveInfo } from "../lib/types";
import { StateBlock } from "../components/StateBlock";

export function LivePage() {
  const [live, setLive] = useState<LiveInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = () => {
    setLoading(true);
    setError("");
    getJson<LiveInfo>("/api/live")
      .then(setLive)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    setPlaybackError("");
    setPlaybackLoading(true);

    try {
      // Mobile browsers with preload disabled need the request to start inside
      // the user's tap event or they can reject the play request.
      if (audio.networkState === HTMLMediaElement.NETWORK_EMPTY) {
        audio.load();
      }
      await audio.play();
    } catch {
      setPlaying(false);
      setPlaybackLoading(false);
      setPlaybackError(siteConfig.live.playbackErrorMessage);
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-normal text-chga-red">{siteConfig.live.eyebrow}</p>
        <h1 className="mt-1 text-3xl font-black text-chga-ink">{siteConfig.live.title}</h1>
      </div>
      {loading ? <StateBlock type="loading" title="Chargement du direct" /> : null}
      {error ? <StateBlock type="error" title="Direct indisponible" message={error} onRetry={load} /> : null}
      {!loading && !error && live ? (
        <div className="rounded-lg bg-white p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <img className="h-20 w-20 rounded-lg object-cover" src={live.thumbnail} alt="" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-chga-red">{siteConfig.live.liveLabel}</p>
              <h2 className="truncate text-2xl font-black text-chga-ink">{live.title}</h2>
              {live.schedule?.timeframe ? <p className="text-sm text-slate-600">{live.schedule.timeframe}</p> : null}
            </div>
          </div>
          <button
            className="mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-md bg-chga-red px-4 py-3 text-base font-black text-white"
            type="button"
            onClick={togglePlay}
            aria-label={playing ? siteConfig.live.pauseLabel : siteConfig.live.playLabel}
          >
            {playbackLoading ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : playing ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
            {playbackLoading
              ? siteConfig.live.connectingLabel
              : playing
                ? siteConfig.live.pauseLabel
                : siteConfig.live.playLabel}
          </button>
          <audio
            ref={audioRef}
            src={live.streamUrl}
            preload="none"
            playsInline
            onPlaying={() => {
              setPlaying(true);
              setPlaybackLoading(false);
              setPlaybackError("");
            }}
            onPause={() => {
              setPlaying(false);
              setPlaybackLoading(false);
            }}
            onWaiting={() => setPlaybackLoading(true)}
            onCanPlay={() => setPlaybackLoading(false)}
            onEnded={() => {
              setPlaying(false);
              setPlaybackLoading(false);
            }}
            onError={() => {
              setPlaying(false);
              setPlaybackLoading(false);
              setPlaybackError(siteConfig.live.playbackErrorMessage);
            }}
          />
          {playbackError ? (
            <div className="mt-3 text-center text-sm" role="alert">
              <p className="text-chga-red">{playbackError}</p>
              <a
                className="mt-2 inline-block font-bold text-chga-blue underline underline-offset-2"
                href={live.streamUrl}
                target="_blank"
                rel="noreferrer"
              >
                {siteConfig.live.fallbackLabel}
              </a>
            </div>
          ) : null}
          {live.next?.title ? (
            <div className="mt-5 rounded-lg bg-chga-mist p-4">
              <div className="flex items-center gap-3">
                <Radio className="h-5 w-5 text-chga-blue" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-normal text-slate-500">{siteConfig.live.nextLabel}</p>
                  <p className="font-bold text-chga-ink">{live.next.title}</p>
                  {live.next.schedule?.timeframe ? <p className="text-sm text-slate-600">{live.next.schedule.timeframe}</p> : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
