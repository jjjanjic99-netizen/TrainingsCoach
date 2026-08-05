import type { Metadata } from "next";
import { WatchImport } from "@/components/watch-import";

export const metadata: Metadata = { title: "Watch-Daten importieren" };

export default function ImportPage() {
  return (
    <div className="space-y-4">
      <h1 className="px-1 text-lg font-bold">Watch-Daten importieren</h1>
      <p className="px-1 text-sm text-muted-foreground">
        Exportierte Workouts (CSV oder JSON) einlesen und als neue Einheiten
        anlegen oder bestehenden zuordnen. Manuelle Eingabe bleibt jederzeit
        möglich.
      </p>
      <WatchImport />
    </div>
  );
}
