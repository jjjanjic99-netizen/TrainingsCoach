import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { Card, CardBody, CardHeader, ComingSoon } from "@/components/ui";

export const metadata: Metadata = { title: "Fortschritt" };

export default function FortschrittPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Fortschritts-Dashboard"
          subtitle="Auf einen Blick sehen, ob und wo du besser wirst."
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <CardBody className="pt-2 text-sm text-muted-foreground">
          Später zeigt das Dashboard objektive Trends: Verlauf pro Station,
          Lauf-Pace-Entwicklung, prognostizierte Finishzeit, ein Stärken-/
          Schwächen-Radar über die 8 Stationen sowie Wochenvolumen und
          PR-Übersicht.
        </CardBody>
      </Card>

      <ComingSoon stage="Kommt in Stufe 2 & 5">
        Erste Stationstrends erscheinen mit dem Logging (Stufe 2). Prognose,
        Radar und Was-wäre-wenn-Szenarien folgen in Stufe 5.
      </ComingSoon>
    </div>
  );
}
