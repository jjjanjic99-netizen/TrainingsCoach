import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Circle,
  Dumbbell,
  Footprints,
} from "lucide-react";
import { InstallPrompt } from "@/components/install-prompt";
import { HomeStatus } from "@/components/home-status";
import { Card, CardBody, CardHeader, SectionTitle } from "@/components/ui";
import { HYROX_STATIONS, RUN_SEGMENTS, RUN_DISTANCE_M } from "@/lib/hyrox/stations";

/** Ausbaustufen der App (für die Roadmap auf der Startseite). */
const STAGES: Array<{ n: number; title: string; done: boolean }> = [
  { n: 1, title: "PWA-Grundgerüst, Datenschicht, Navigation", done: true },
  { n: 2, title: "Profil, Baseline-Assessment, Logging, Dashboard", done: true },
  { n: 3, title: "Trainingsplan-Generator & Wochenansicht", done: true },
  { n: 4, title: "Lauf-Coaching & Pace-Zonen", done: false },
  { n: 5, title: "Renn-Simulator, Prognose & Radar", done: false },
  { n: 6, title: "Watch-Import (CSV/JSON) & Readiness", done: false },
];

export default function HomePage() {
  const nextStage = STAGES.find((s) => !s.done)?.n;

  return (
    <div className="space-y-6">
      <InstallPrompt />

      {/* Dynamischer Status: Begrüssung, Countdown, Setup-Fortschritt */}
      <HomeStatus />

      {/* Roadmap */}
      <section className="space-y-2">
        <SectionTitle>Dein Weg</SectionTitle>
        <Card>
          <ul className="divide-y divide-border">
            {STAGES.map((stage) => (
              <li key={stage.n} className="flex items-center gap-3 px-4 py-3">
                {stage.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    Stufe {stage.n}
                    {stage.done ? (
                      <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        erledigt
                      </span>
                    ) : stage.n === nextStage ? (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        als Nächstes
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">{stage.title}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Wettkampf-Referenz */}
      <section className="space-y-2">
        <SectionTitle>Der Hyrox-Wettkampf</SectionTitle>
        <Card>
          <CardHeader
            title="8 Läufe · 8 Stationen"
            subtitle={`${RUN_SEGMENTS}× ${RUN_DISTANCE_M} m Laufen im Wechsel mit den Stationen – feste Reihenfolge, weltweit identisch.`}
            icon={<Footprints className="h-5 w-5" />}
          />
          <CardBody className="pt-2">
            <ol className="space-y-1.5">
              {HYROX_STATIONS.map((station) => (
                <li key={station.id} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {station.order}
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">Lauf</span> →{" "}
                    {station.name}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              Zwischen den Stationen liegt die Roxzone (Transitwege), die in die
              spätere Zeitprognose einfliesst.
            </p>
          </CardBody>
        </Card>
      </section>

      {/* Schnellzugriff */}
      <section className="space-y-2">
        <SectionTitle>Schnellzugriff</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <QuickLink href="/training" label="Training loggen" icon={<Dumbbell className="h-5 w-5" />} />
          <QuickLink href="/fortschritt" label="Fortschritt" icon={<Activity className="h-5 w-5" />} />
        </div>
      </section>
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-semibold shadow-sm transition hover:border-primary/40"
    >
      <span className="flex items-center gap-2">
        <span className="text-primary" aria-hidden>
          {icon}
        </span>
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
    </Link>
  );
}
