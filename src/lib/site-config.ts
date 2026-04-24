export const siteConfig = {
  branding: {
    appName: "CHGA Mobile",
    shortName: "CHGA",
    headerTitle: "CHGA",
    headerSubtitle: "Mobile",
    organizationLine: "Radio communautaire de la Vallée-de-la-Gatineau",
    description: "Nouvelles locales, direct, balados et événements dans une PWA légère.",
    browserDescription: "PWA mobile pour les nouvelles, balados, événements et le direct de CHGA.",
    themeColor: "#151f6d",
    backgroundColor: "#f4f7fb"
  },
  navigation: {
    home: "Accueil",
    news: "Nouvelles",
    live: "Direct",
    more: "Plus"
  },
  features: {
    featuredNewsCount: 4,
    showSocialLinks: true,
    showPodcasts: true,
    showEvents: true
  },
  home: {
    title: "CHGA Mobile",
    description: "Nouvelles locales, direct, balados et événements dans une PWA légère.",
    primaryActionLabel: "Direct",
    secondaryActionLabel: "Nouvelles",
    latestNewsTitle: "Dernières nouvelles",
    latestNewsActionLabel: "Tout voir",
    installActionLabel: "Installer l’app",
    installHelpLabel: "Voir comment l’installer"
  },
  news: {
    eyebrow: "Actualité locale",
    title: "Nouvelles"
  },
  live: {
    eyebrow: "En ondes",
    title: "Écoute en direct",
    liveLabel: "En direct",
    playLabel: "Écouter CHGA",
    pauseLabel: "Pause",
    nextLabel: "Prochainement"
  },
  more: {
    eyebrow: "Extras MVP",
    title: "Plus",
    notifications: {
      title: "Notifications push",
      description: "Recevez une alerte quand une nouvelle importante est publiée.",
      enableLabel: "Activer les notifications",
      disableLabel: "Désactiver les notifications",
      busyLabel: "Veuillez patienter...",
      enablePendingMessage: "Demande d’autorisation en cours...",
      enabledMessage: "Notifications activées pour cet appareil.",
      disabledMessage: "Notifications CHGA désactivées pour cet appareil.",
      inactiveMessage: "Notifications non activées.",
      browserPermissionMessage: "Notifications non activées. Vérifiez les permissions du navigateur.",
      disablePendingMessage: "Désactivation des notifications en cours...",
      disableErrorMessage: "Impossible de désactiver les notifications pour le moment.",
      helpMessage:
        "La désactivation ici coupe les notifications CHGA sur cet appareil. Pour retirer aussi l’autorisation du navigateur, utilisez les réglages du site dans votre navigateur."
    },
    install: {
      title: "Installer l’application",
      description: "Ajoutez CHGA Mobile à l’écran d’accueil pour l’ouvrir comme une application.",
      iphoneTitle: "iPhone",
      iphoneInstructions:
        "Ouvrez l’app dans Safari, appuyez sur Partager, puis choisissez Ajouter à l’écran d’accueil.",
      androidTitle: "Android",
      androidInstructions:
        "Ouvrez l’app dans Chrome, appuyez sur le menu du navigateur, puis choisissez Ajouter à l’écran d’accueil ou Installer l’application."
    },
    social: {
      title: "Suivez CHGA",
      description: "Retrouvez la radio sur ses réseaux sociaux officiels."
    },
    podcastsTitle: "Balados récents",
    eventsTitle: "Événements"
  },
  socialLinks: [
    { name: "Facebook", href: "https://www.facebook.com/chga.fm" },
    { name: "X", href: "https://twitter.com/RadioChga" },
    { name: "Instagram", href: "https://www.instagram.com/radiochga/" }
  ]
} as const;

export type SiteConfig = typeof siteConfig;
