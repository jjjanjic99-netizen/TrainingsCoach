import type { Metadata } from "next";
import { Footprints } from "lucide-react";
import { LaufCoaching } from "@/components/lauf-coaching";
import { Card, CardBody, CardHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Lauf-Coaching" };

export default function LaufPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Lauf-Coaching"
          subtitle="Pace-Zonen, Intervalle und Umfang-Progression."
          icon={<Footprints className="h-5 w-5" />}
        />
        <CardBody className="pt-2 text-sm text-muted-foreground">
          Aus einem Lauf-Test werden nach VDOT-Logik deine Trainings-Pace-Zonen
          abgeleitet (Easy/Marathon/Threshold/Interval/Repetition) – Grundlage für
          Intervalle und den Umfangaufbau.
        </CardBody>
      </Card>

      <LaufCoaching />
    </div>
  );
}
