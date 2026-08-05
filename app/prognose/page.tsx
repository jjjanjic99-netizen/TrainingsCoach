import type { Metadata } from "next";
import { Timer } from "lucide-react";
import { RaceSimulator } from "@/components/race-simulator";
import { Card, CardBody, CardHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Prognose" };

export default function PrognosePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Renn-Simulator"
          subtitle="Finishzeit schätzen, Schwächen finden, Szenarien durchspielen."
          icon={<Timer className="h-5 w-5" />}
        />
        <CardBody className="pt-2 text-sm text-muted-foreground">
          Die Prognose summiert realistische Stationssplits, die 8 Läufe und eine
          Roxzone-Schätzung. Sie wird persönlicher, je mehr Benchmarks du erfasst.
        </CardBody>
      </Card>

      <RaceSimulator />
    </div>
  );
}
