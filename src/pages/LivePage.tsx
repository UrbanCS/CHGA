import { Pause, Play, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getJson } from "../lib/api";
import type { LiveInfo } from "../lib/types";
import { StateBlock } from "../components/StateBlock";

export function LivePage() {
  const [live, setLive] = useState<LiveInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
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
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    await audioRef.current.play();
    setPlaying(true);
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-normal text-chga-red">En ondes</p>
        <h1 className="mt-1 text-3xl font-black text-chga-ink">Écoute en direct</h1>
      </div>
      {loading ? <StateBlock type="loading" title="Chargement du direct" /> : null}
      {error ? <StateBlock type="error" title="Direct indisponible" message={error} onRetry={load} /> : null}
      {!loading && !error && live ? (
        <div className="rounded-lg bg-white p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <img className="h-20 w-20 rounded-lg object-cover" src={live.thumbnail} alt="" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-chga-red">En direct</p>
              <h2 className="truncate text-2xl font-black text-chga-ink">{live.title}</h2>
              {live.schedule?.timeframe ? <p className="text-sm text-slate-600">{live.schedule.timeframe}</p> : null}
            </div>
          </div>
          <button
            className="mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-md bg-chga-red px-4 py-3 text-base font-black text-white"
            type="button"
            onClick={togglePlay}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            {playing ? "Pause" : "Écouter CHGA"}
          </button>
          <audio ref={audioRef} src={live.streamUrl} preload="none" onEnded={() => setPlaying(false)} />
          {live.next?.title ? (
            <div className="mt-5 rounded-lg bg-chga-mist p-4">
              <div className="flex items-center gap-3">
                <Radio className="h-5 w-5 text-chga-blue" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Prochainement</p>
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
