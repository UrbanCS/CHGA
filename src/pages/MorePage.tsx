import { CalendarDays, Headphones, Bell, Facebook, Instagram, Twitter, Share, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { StateBlock } from "../components/StateBlock";
import { getJson } from "../lib/api";
import { formatShortDate } from "../lib/date";
import { siteConfig } from "../lib/site-config";
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
    href: siteConfig.socialLinks[0].href,
    icon: Facebook
  },
  {
    name: "X",
    href: siteConfig.socialLinks[1].href,
    icon: Twitter
  },
  {
    name: "Instagram",
    href: siteConfig.socialLinks[2].href,
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
    setPushMessage(siteConfig.more.notifications.enablePendingMessage);
    requestPushPermission().then((granted) => {
      setPushSubscribed(granted);
      setPushMessage(
        granted
          ? siteConfig.more.notifications.enabledMessage
          : siteConfig.more.notifications.browserPermissionMessage
      );
    }).finally(() => setPushBusy(false));
  };

  const disableNotifications = () => {
    setPushBusy(true);
    setPushMessage(siteConfig.more.notifications.disablePendingMessage);
    disablePushNotifications()
      .then((stillSubscribed) => {
        setPushSubscribed(stillSubscribed);
        setPushMessage(
          stillSubscribed
            ? siteConfig.more.notifications.disableErrorMessage
            : siteConfig.more.notifications.disabledMessage
        );
      })
      .finally(() => setPushBusy(false));
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-normal text-chga-red">{siteConfig.more.eyebrow}</p>
        <h1 className="mt-1 text-3xl font-black text-chga-ink">{siteConfig.more.title}</h1>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <Bell className="mt-1 h-5 w-5 text-chga-red" />
          <div className="flex-1">
            <h2 className="font-black text-chga-ink">{siteConfig.more.notifications.title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{siteConfig.more.notifications.description}</p>
            <button
              className={`mt-4 min-h-11 rounded-md px-4 py-2 text-sm font-black ${
                pushSubscribed ? "bg-slate-200 text-slate-700" : "bg-chga-red text-white"
              }`}
              type="button"
              disabled={pushBusy}
              onClick={pushSubscribed ? disableNotifications : enableNotifications}
            >
              {pushBusy
                ? siteConfig.more.notifications.busyLabel
                : pushSubscribed
                  ? siteConfig.more.notifications.disableLabel
                  : siteConfig.more.notifications.enableLabel}
            </button>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              {pushMessage ||
                (pushSubscribed
                  ? siteConfig.more.notifications.enabledMessage
                  : siteConfig.more.notifications.inactiveMessage)}
            </p>
            {pushSubscribed ? (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {siteConfig.more.notifications.helpMessage}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <Smartphone className="mt-1 h-5 w-5 text-chga-blue" />
          <div className="flex-1">
            <h2 className="font-black text-chga-ink">{siteConfig.more.install.title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{siteConfig.more.install.description}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Share className="h-4 w-4 text-chga-blue" />
                  <h3 className="text-sm font-black text-chga-ink">{siteConfig.more.install.iphoneTitle}</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{siteConfig.more.install.iphoneInstructions}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-chga-blue" />
                  <h3 className="text-sm font-black text-chga-ink">{siteConfig.more.install.androidTitle}</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{siteConfig.more.install.androidInstructions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {siteConfig.features.showSocialLinks ? (
        <div className="rounded-lg bg-white p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <Headphones className="mt-1 h-5 w-5 text-chga-blue" />
            <div className="flex-1">
              <h2 className="font-black text-chga-ink">{siteConfig.more.social.title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{siteConfig.more.social.description}</p>
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
      ) : null}

      {loading ? <StateBlock type="loading" title="Chargement des contenus" /> : null}
      {error ? <StateBlock type="error" title="Contenus indisponibles" message={error} onRetry={load} /> : null}

      {!loading && !error ? (
        <>
          {siteConfig.features.showPodcasts ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-chga-blue" />
                <h2 className="text-xl font-black text-chga-ink">{siteConfig.more.podcastsTitle}</h2>
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
          ) : null}

          {siteConfig.features.showEvents ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-chga-blue" />
                <h2 className="text-xl font-black text-chga-ink">{siteConfig.more.eventsTitle}</h2>
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
          ) : null}
        </>
      ) : null}
    </section>
  );
}
