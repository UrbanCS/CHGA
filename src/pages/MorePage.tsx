import { CalendarDays, Headphones, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { StateBlock } from "../components/StateBlock";
import { getJson } from "../lib/api";
import { formatShortDate } from "../lib/date";
import {
  getPushSubscriptionState,
  getStoredPushSubscribed,
  onPushSubscriptionChange,
  requestPushPermission
} from "../lib/onesignal";
import type { EventItem, Podcast } from "../lib/types";

export function MorePage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushSubscribed, setPushSubscribed] = useState(() => getStoredPushSubscribed());

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([getJson<Podcast[]>("/api/podcasts"), getJson<EventItem[]>("/api/events")])
      .then(([podcastItems, eventItems]) => {
        setPodcasts(podcastItems);
        setEvents(eventItems);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    getPushSubscriptionState().then(setPushSubscribed);
    onPushSubscriptionChange(setPushSubscribed);
  }, []);

  const enableNotifications = () => {
    setPushMessage("Demande d’autorisation en cours...");
    requestPushPermission().then((granted) => {
      setPushSubscribed(granted);
      setPushMessage(
        granted
          ? "Notifications activées pour cet appareil."
          : "Notifications non activées. Vérifiez les permissions du navigateur."
      );
    });
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-normal text-chga-red">Extras MVP</p>
        <h1 className="mt-1 text-3xl font-black text-chga-ink">Plus</h1>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <Bell className="mt-1 h-5 w-5 text-chga-red" />
          <div className="flex-1">
            <h2 className="font-black text-chga-ink">Notifications push</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Recevez une alerte quand une nouvelle importante est publiée.
            </p>
            <button
              className={`mt-4 min-h-11 rounded-md px-4 py-2 text-sm font-black ${
                pushSubscribed ? "bg-slate-200 text-slate-700" : "bg-chga-red text-white"
              }`}
              type="button"
              disabled={pushSubscribed}
              onClick={enableNotifications}
            >
              {pushSubscribed ? "Déjà abonné" : "Activer les notifications"}
            </button>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              {pushMessage || (pushSubscribed ? "Notifications activées pour cet appareil." : "Notifications non activées.")}
            </p>
          </div>
        </div>
      </div>

      {loading ? <StateBlock type="loading" title="Chargement des contenus" /> : null}
      {error ? <StateBlock type="error" title="Contenus indisponibles" message={error} onRetry={load} /> : null}

      {!loading && !error ? (
        <>
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-chga-blue" />
              <h2 className="text-xl font-black text-chga-ink">Balados récents</h2>
            </div>
            <div className="space-y-3">
              {podcasts.map((podcast) => (
                <a key={podcast.id} className="block rounded-lg bg-white p-4 shadow-soft" href={podcast.link} target="_blank" rel="noreferrer">
                  <p className="text-sm font-bold text-chga-blue">{podcast.duration || formatShortDate(podcast.date)}</p>
                  <h3 className="mt-1 font-black leading-snug text-chga-ink">{podcast.title}</h3>
                  {podcast.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{podcast.excerpt}</p> : null}
                </a>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-chga-blue" />
              <h2 className="text-xl font-black text-chga-ink">Événements</h2>
            </div>
            <div className="space-y-3">
              {events.map((event) => (
                <a key={event.id} className="block rounded-lg bg-white p-4 shadow-soft" href={event.link} target="_blank" rel="noreferrer">
                  <p className="text-sm font-bold text-chga-red">{formatShortDate(event.startDate)}</p>
                  <h3 className="mt-1 font-black leading-snug text-chga-ink">{event.title}</h3>
                  {event.venue ? <p className="mt-1 text-sm text-slate-500">{event.venue}</p> : null}
                </a>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}
