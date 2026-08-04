import type { Metadata } from "next";
import Link from "next/link";
import { Settings, User } from "lucide-react";
import { Card, CardBody, CardHeader, ComingSoon } from "@/components/ui";

export const metadata: Metadata = { title: "Profil" };

export default function ProfilPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Dein Profil"
          subtitle="Grundlage für Zielwerte, Plan und Prognose."
          icon={<User className="h-5 w-5" />}
        />
        <CardBody className="pt-2 text-sm text-muted-foreground">
          Hier hinterlegst du künftig Name, Alter, Geschlecht, Körpergewicht,
          Division (Open/Pro/Doubles/Relay), Level, Ziel-Renndatum,
          Ziel-Finishzeit und persönliche Bestleistungen pro Station.
        </CardBody>
      </Card>

      <ComingSoon stage="Kommt in Stufe 2">
        Das Profil und das Baseline-Assessment folgen in der nächsten Stufe.
      </ComingSoon>

      <Link
        href="/einstellungen"
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold shadow-sm transition hover:border-primary/40"
      >
        <Settings className="h-5 w-5 text-primary" aria-hidden />
        Einstellungen, Theme &amp; Datensicherung
      </Link>
    </div>
  );
}
