const formatter = new Intl.DateTimeFormat("fr-CA", {
  dateStyle: "medium",
  timeStyle: "short"
});

const dateOnlyFormatter = new Intl.DateTimeFormat("fr-CA", {
  weekday: "short",
  day: "numeric",
  month: "short"
});

export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : formatter.format(date);
}

export function formatShortDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateOnlyFormatter.format(date);
}
