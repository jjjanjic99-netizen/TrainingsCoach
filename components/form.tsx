"use client";

/**
 * Wiederverwendbare Formular-Bausteine (mobile-first, grosse Touch-Ziele).
 * Der Zustand liegt jeweils in der übergeordneten Formular-Komponente;
 * diese Bausteine sind rein präsentational.
 */

import { cn } from "@/lib/cn";

/** Basis-Styling für Eingabefelder. */
export const inputClass =
  "w-full min-h-[44px] rounded-xl border border-input bg-background px-3 text-base outline-none transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground";

/** Feld-Umschliessung mit Label und optionalem Hinweis. */
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 text-sm font-medium">{label}</div>
      {children}
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

/** Zahleneingabe (mobile Zifferntastatur). */
export function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      inputMode="decimal"
      {...props}
      className={cn(inputClass, "tabular-nums", props.className)}
    />
  );
}

/** Zeiteingabe im Format mm:ss oder hh:mm:ss. */
export function TimeInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      inputMode="numeric"
      placeholder="mm:ss"
      {...props}
      className={cn(inputClass, "tabular-nums", props.className)}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      {...props}
      className={cn(inputClass, "min-h-[80px] resize-y py-2", props.className)}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(inputClass, "appearance-none pr-8", props.className)}
    />
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/** Segmentierte Auswahl (Radiogroup-Optik). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  columns = 3,
  ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
  ariaLabel?: string;
}) {
  const cols =
    columns === 2 ? "grid-cols-2" : columns === 4 ? "grid-cols-4" : "grid-cols-3";
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("grid gap-2", cols)}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-[44px] rounded-xl border px-2 text-sm font-medium transition",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Formular-Statuszeile (Erfolg/Fehler). */
export function FormStatus({
  status,
}: {
  status: { kind: "ok" | "error"; text: string } | null;
}) {
  if (!status) return null;
  return (
    <div
      role="status"
      className={cn(
        "rounded-xl px-3 py-2 text-sm",
        status.kind === "ok" ? "bg-primary/10 text-primary" : "bg-danger/10 text-danger",
      )}
    >
      {status.text}
    </div>
  );
}
