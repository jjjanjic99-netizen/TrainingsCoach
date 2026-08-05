"use client";

/**
 * Obere App-Leiste: Seitentitel + Zugang zu den Einstellungen.
 * Sticky am oberen Rand, mit Safe-Area-Padding (Notch) über `pt-safe`.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, Settings } from "lucide-react";

/** Titel je Route (Prefix-Match für Unterseiten). */
const ROUTE_TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: "/training", title: "Training" },
  { prefix: "/import", title: "Import" },
  { prefix: "/readiness", title: "Readiness" },
  { prefix: "/plan", title: "Trainingsplan" },
  { prefix: "/lauf", title: "Lauf-Coaching" },
  { prefix: "/prognose", title: "Prognose" },
  { prefix: "/fortschritt", title: "Fortschritt" },
  { prefix: "/profil", title: "Profil" },
  { prefix: "/einstellungen", title: "Einstellungen" },
];

function titleForPath(pathname: string): string {
  if (pathname === "/") return "Hyrox Coach";
  const match = ROUTE_TITLES.find((r) => pathname.startsWith(r.prefix));
  return match?.title ?? "Hyrox Coach";
}

/** Oberste Ebenen (Tab-Bar). Alles andere ist eine Unterseite (Zurück-Pfeil). */
const TOP_LEVEL = ["/", "/training", "/plan", "/fortschritt", "/profil"];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const title = titleForPath(pathname);
  const isTopLevel = TOP_LEVEL.includes(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 pt-safe backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between gap-2 px-3">
        <div className="flex items-center gap-1">
          {!isTopLevel ? (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Zurück"
              className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>
          ) : null}
          <span className="text-lg font-bold tracking-tight">{title}</span>
        </div>

        {isTopLevel ? (
          <Link
            href="/einstellungen"
            aria-label="Einstellungen"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-6 w-6" aria-hidden />
          </Link>
        ) : null}
      </div>
    </header>
  );
}
