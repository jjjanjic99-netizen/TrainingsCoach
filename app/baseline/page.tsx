import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { BaselineForm } from "@/components/baseline-form";
import { Card, CardBody, CardHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Baseline-Assessment" };

export default function BaselinePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Baseline-Assessment"
          subtitle="Dein Startpunkt – kalibriert Trends und spätere Prognose."
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <CardBody className="pt-2 text-sm text-muted-foreground">
          Ein Test-Durchlauf pro Station plus Lauf-Benchmarks. Du kannst das
          Assessment jederzeit wiederholen – der jüngste Stand zählt.
        </CardBody>
      </Card>

      <BaselineForm />
    </div>
  );
}
