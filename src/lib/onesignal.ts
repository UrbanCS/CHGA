type OneSignalApi = {
  init: (options: Record<string, unknown>) => Promise<void>;
  Notifications?: {
    permission?: boolean;
    requestPermission?: () => Promise<boolean>;
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalApi) => void | Promise<void>>;
  }
}

let initialized = false;

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
      resolve(Boolean(granted ?? OneSignal.Notifications?.permission));
    });
  });
}
