import { CalendarDays, Headphones, Bell, Facebook, Instagram, Twitter, Share, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { StateBlock } from "../components/StateBlock";
import { getJson } from "../lib/api";
import { formatShortDate } from "../lib/date";
import {
  disablePushNotifications,
  getPushSubscriptionState,
  getStoredPushSubscribed,
  onPushSubscriptionChange,
  requestPushPermission
} from "../lib/onesignal";
import type { EventItem, Podcast } from "../lib/types";

const socialLinks = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/chga.fm",
    icon: Facebook
  },
  {
    name: "X",
    href: "https://twitter.com/RadioChga",
    icon: Twitter
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/radiochga/",
    icon: Instagram
  }
] as const;

export function MorePage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushSubscribed, setPushSubscribed] = useState(() => getStoredPushSubscribed());
  const [pushBusy, setPushBusy] = useState(false);

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
    setPushBusy(true);
    setPushMessage("Demande d’autorisation en cours...");
    requestPushPermission().then((granted) => {
      setPushSubscribed(granted);
      setPushMessage(
        granted
          ? "Notifications activées pour cet appareil."
          : "Notifications non activées. Vérifiez les permissions du navigateur."
      );
    }).finally(() => setPushBusy(false));
  };

  const disableNotifications = () => {
    setPushBusy(true);
    setPushMessage("Désactivation des notifications en cours...");
    disablePushNotifications()
      .then((stillSubscribed) => {
        setPushSubscribed(stillSubscribed);
        setPushMessage(
          stillSubscribed
            ? "Impossible de désactiver les notifications pour le moment."
            : "Notifications CHGA désactivées pour cet appareil."
        );
      })
      .finally(() => setPushBusy(false));
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
              disabled={pushBusy}
              onClick={pushSubscribed ? disableNotifications : enableNotifications}
            >
              {pushBusy
                ? "Veuillez patienter..."
                : pushSubscribed
                  ? "Désactiver les notifications"
                  : "Activer les notifications"}
            </button>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              {pushMessage ||
                (pushSubscribed
                  ? "Notifications activées pour cet appareil."
                  : "Notifications non activées.")}
            </p>
            {pushSubscribed ? (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                La désactivation ici coupe les notifications CHGA sur cet appareil. Pour retirer aussi l’autorisation du navigateur,
                utilisez les réglages du site dans votre navigateur.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <Headphones className="mt-1 h-5 w-5 text-chga-blue" />
          <div className="flex-1">
            <h2 className="font-black text-chga-ink">Suivez CHGA</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Retrouvez la radio sur ses réseaux sociaux officiels.
            </p>
            <div className="mt-4 flex gap-3">
              {socialLinks.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 text-chga-blue transition hover:border-chga-blue hover:bg-slate-50"
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={name}
                  title={name}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <Smartphone className="mt-1 h-5 w-5 text-chga-blue" />
          <div className="flex-1">
            <h2 className="font-black text-chga-ink">Installer l’application</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Ajoutez CHGA Mobile à l’écran d’accueil pour l’ouvrir comme une application.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Share className="h-4 w-4 text-chga-blue" />
                  <h3 className="text-sm font-black text-chga-ink">iPhone</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Ouvrez l’app dans Safari, appuyez sur <span className="font-bold text-chga-ink">Partager</span>, puis choisissez{" "}
                  <span className="font-bold text-chga-ink">Ajouter à l’écran d’accueil</span>.
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-chga-blue" />
                  <h3 className="text-sm font-black text-chga-ink">Android</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Ouvrez l’app dans Chrome, appuyez sur le menu du navigateur, puis choisissez{" "}
                  <span className="font-bold text-chga-ink">Ajouter à l’écran d’accueil</span> ou{" "}
                  <span className="font-bold text-chga-ink">Installer l’application</span>.
                </p>
              </div>
            </div>
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
