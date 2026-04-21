import { AlertCircle, Loader2 } from "lucide-react";

type Props = {
  type: "loading" | "error" | "empty";
  title: string;
  message?: string;
  onRetry?: () => void;
};

export function StateBlock({ type, title, message, onRetry }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 text-center shadow-soft">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-chga-blue">
        {type === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : <AlertCircle className="h-5 w-5" />}
      </div>
      <p className="text-base font-semibold text-chga-ink">{title}</p>
      {message ? <p className="mt-1 text-sm leading-6 text-slate-600">{message}</p> : null}
      {onRetry ? (
        <button
          className="mt-4 min-h-11 rounded-md bg-chga-blue px-4 py-2 text-sm font-semibold text-white"
          type="button"
          onClick={onRetry}
        >
          Réessayer
        </button>
      ) : null}
    </div>
  );
}
