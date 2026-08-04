/**
 * Kleine, wiederverwendbare UI-Bausteine (mobile-first, grosse Touch-Ziele).
 * Bewusst schlank gehalten – keine externe Komponentenbibliothek.
 */

import { cn } from "@/lib/cn";

/** Karte / Panel. */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-4 pb-2">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="mt-0.5 text-primary" aria-hidden>
            {icon}
          </div>
        ) : null}
        <div>
          <h2 className="text-base font-semibold leading-tight">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-4 pt-2", className)}>{children}</div>;
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90 active:opacity-80",
  secondary:
    "bg-muted text-foreground hover:bg-muted/70 active:bg-muted/60 border border-border",
  ghost: "bg-transparent text-foreground hover:bg-muted active:bg-muted/70",
  danger: "bg-danger text-danger-foreground hover:opacity-90 active:opacity-80",
};

/** Button mit grossem Touch-Ziel (min. 44px Höhe). */
export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: {
  variant?: ButtonVariant;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Abschnitts-Überschrift für Seiten. */
export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      {children}
    </h2>
  );
}

/** Hinweis, dass ein Modul in einer späteren Ausbaustufe kommt. */
export function ComingSoon({
  stage,
  children,
}: {
  stage: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardBody className="pt-4">
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {stage}
        </span>
        <div className="mt-3 text-sm text-muted-foreground">{children}</div>
      </CardBody>
    </Card>
  );
}
