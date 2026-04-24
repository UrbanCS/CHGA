import { Home, MoreHorizontal, Newspaper, Radio } from "lucide-react";
import { siteConfig } from "../lib/site-config";
import type { View } from "../lib/views";

type Props = {
  view: View;
  onChange: (view: View) => void;
};

const tabs: Array<{ view: View; label: string; icon: typeof Home }> = [
  { view: "home", label: siteConfig.navigation.home, icon: Home },
  { view: "news", label: siteConfig.navigation.news, icon: Newspaper },
  { view: "live", label: siteConfig.navigation.live, icon: Radio },
  { view: "more", label: siteConfig.navigation.more, icon: MoreHorizontal }
];

export function BottomNav({ view, onChange }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.view === view;
          return (
            <button
              key={tab.view}
              className={`min-h-12 rounded-md px-2 text-xs font-semibold ${
                active ? "bg-chga-blue text-white" : "text-slate-600"
              }`}
              type="button"
              onClick={() => onChange(tab.view)}
            >
              <Icon className="mx-auto mb-0.5 h-5 w-5" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
