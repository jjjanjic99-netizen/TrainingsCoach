import type { Metadata } from "next";
import { Dumbbell } from "lucide-react";
import { Card, CardBody, CardHeader, ComingSoon } from "@/components/ui";

export const metadata: Metadata = { title: "Training" };

export default function TrainingPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Trainings-Logging"
          subtitle="Jede Einheit schnell erfassen – auch unterwegs."
          icon={<Dumbbell className="h-5 w-5" />}
        />
        <CardBody className="pt-2 text-sm text-muted-foreground">
          Hier loggst du künftig Typ, Stationszeiten/Reps/Gewichte, Lauf-Splits,
          RPE (1–10), optional Herzfrequenz und Notizen.
        </CardBody>
      </Card>

      <ComingSoon stage="Kommt in Stufe 2">
        Das Trainings-Logging mit Schnell-Eingabe wird in der nächsten
        Ausbaustufe umgesetzt. Die Datenschicht dafür ist bereits vorbereitet.
      </ComingSoon>
    </div>
  );
}
