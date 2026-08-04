import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { Card, CardBody, CardHeader, ComingSoon } from "@/components/ui";

export const metadata: Metadata = { title: "Trainingsplan" };

export default function PlanPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Trainingsplan"
          subtitle="Periodisiert von Base über Build und Peak bis Taper."
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <CardBody className="pt-2 text-sm text-muted-foreground">
          Der Generator erstellt später eine Wochenstruktur mit Easy-/Tempo-/
          Intervall-/Long-Runs, Kraft- und stationsspezifischem Training,
          Compromised-Running-Einheiten und Renntempo-Simulationen – mit
          abhakbaren Einheiten und Deload-Wochen.
        </CardBody>
      </Card>

      <ComingSoon stage="Kommt in Stufe 3">
        Der Trainingsplan-Generator und die Wochenansicht folgen, sobald Profil
        und Baseline-Assessment (Stufe 2) den Plan kalibrieren können.
      </ComingSoon>
    </div>
  );
}
