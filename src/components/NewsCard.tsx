import { CalendarDays } from "lucide-react";
import type { NewsItem } from "../lib/types";
import { formatDate } from "../lib/date";

type Props = {
  item: NewsItem;
  onOpen: (slug: string) => void;
};

export function NewsCard({ item, onOpen }: Props) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
      <button className="block w-full text-left" type="button" onClick={() => onOpen(item.slug)}>
        <div className="aspect-[16/10] w-full bg-slate-100">
          <img className="h-full w-full object-cover" src={item.imageUrl} alt="" loading="lazy" />
        </div>
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-normal text-chga-red">
            <span>{item.category}</span>
            <span className="flex items-center gap-1 text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(item.date)}
            </span>
          </div>
          <h2 className="text-lg font-bold leading-snug text-chga-ink">{item.title}</h2>
          {item.excerpt ? <p className="line-clamp-3 text-sm leading-6 text-slate-600">{item.excerpt}</p> : null}
        </div>
      </button>
    </article>
  );
}
