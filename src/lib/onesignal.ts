type OneSignalApi = {
  init: (options: Record<string, unknown>) => Promise<void>;
  Notifications?: {
    permission?: boolean;
    requestPermission?: () => Promise<boolean>;
  };
  User?: {
    PushSubscription?: {
      optedIn?: boolean;
      optIn?: () => Promise<void> | void;
      optOut?: () => Promise<void> | void;
      addEventListener?: (
        event: "change",
        callback: (state: { current?: { optedIn?: boolean } }) => void
      ) => void;
    };
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalApi) => void | Promise<void>>;
  }
}

let initialized = false;
const SUBSCRIBED_STORAGE_KEY = "chga-push-subscribed";

export function initOneSignal(): void {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  if (!appId || initialized || typeof window === "undefined") {
    return;
  }

  initialized = true;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.init({
      appId,
      serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
      serviceWorkerParam: {
        scope: "/push/onesignal/"
      },
      allowLocalhostAsSecureOrigin: true,
      promptOptions: {
        slidedown: {
          prompts: [
            {
              type: "push",
              autoPrompt: false,
              text: {
                actionMessage: "Recevez les nouvelles importantes de CHGA.",
                acceptButton: "Autoriser",
                cancelButton: "Plus tard",
                "message.action.subscribed": "Merci pour votre abonnement!",
                "message.action.resubscribed": "Notifications réactivées.",
                "message.action.subscribing": "Activation des notifications...",
                "message.action.subscribing.error": "Impossible d’activer les notifications."
              }
            }
          ]
        }
      },
      notifyButton: {
        enable: false
      }
    });
  });
}

export function requestPushPermission(): Promise<boolean> {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  if (!appId || typeof window === "undefined") {
    return Promise.resolve(false);
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];

  return new Promise((resolve) => {
    window.OneSignalDeferred?.push(async (OneSignal) => {
      const granted = await OneSignal.Notifications?.requestPermission?.();
      const subscribed = Boolean(granted ?? OneSignal.Notifications?.permission ?? OneSignal.User?.PushSubscription?.optedIn);
      setStoredPushSubscribed(subscribed);
      resolve(subscribed);
    });
  });
}

export function getPushSubscriptionState(): Promise<boolean> {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  if (!appId || typeof window === "undefined") {
    return Promise.resolve(false);
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];

  return new Promise((resolve) => {
    window.OneSignalDeferred?.push((OneSignal) => {
      const subscribed = Boolean(OneSignal.User?.PushSubscription?.optedIn);
      setStoredPushSubscribed(subscribed);
      resolve(subscribed);
    });
  });
}

export function disablePushNotifications(): Promise<boolean> {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  if (!appId || typeof window === "undefined") {
    return Promise.resolve(false);
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];

  return new Promise((resolve) => {
    window.OneSignalDeferred?.push(async (OneSignal) => {
      await OneSignal.User?.PushSubscription?.optOut?.();
      const subscribed = Boolean(OneSignal.User?.PushSubscription?.optedIn);
      setStoredPushSubscribed(subscribed);
      resolve(subscribed);
    });
  });
}

export function onPushSubscriptionChange(callback: (subscribed: boolean) => void): void {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  if (!appId || typeof window === "undefined") {
    return;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push((OneSignal) => {
    OneSignal.User?.PushSubscription?.addEventListener?.("change", (state) => {
      const subscribed = Boolean(state.current?.optedIn);
      setStoredPushSubscribed(subscribed);
      callback(subscribed);
    });
  });
}

export function getStoredPushSubscribed(): boolean {
  return typeof window !== "undefined" && window.localStorage.getItem(SUBSCRIBED_STORAGE_KEY) === "true";
}

function setStoredPushSubscribed(subscribed: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SUBSCRIBED_STORAGE_KEY, subscribed ? "true" : "false");
}
