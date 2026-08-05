"use client";

/**
 * Trainingsplan-Ansicht (Stufe 3).
 * - Ohne Plan: Generator-Panel (Dauer aus Renndatum oder wählbar).
 * - Mit Plan: Wochenansicht mit Phase, Deload-Hinweis, Fortschritt und
 *   abhakbaren Einheiten. Wochen-Navigation und Neu-Erstellen/Löschen.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Dumbbell,
  Footprints,
  RefreshCw,
  Trash2,
  Zap,
} from "lucide-react";
import { Button, Card, CardBody, CardHeader, SectionTitle } from "@/components/ui";
import { SegmentedControl } from "@/components/form";
import { useProfile, useActivePlan } from "@/lib/hooks/use-live-data";
import { deletePlan, savePlan, setPlanSessionDone } from "@/lib/db/repositories";
import {
  currentWeekIndex,
  generatePlan,
  PHASE_LABELS,
  WEEKDAY_SHORT,
  weekProgress,
  type PlanPhase,
  type PlanSession,
  type PlanWeek,
  type TrainingPlan,
} from "@/lib/hyrox/plan";
import { getSessionTypeMeta } from "@/lib/hyrox/sessions";
import { LEVELS } from "@/lib/hyrox/divisions";
import { cn } from "@/lib/cn";
import { formatDuration, todayIso, weeksUntil } from "@/lib/format";

/* --------------------------- Phasen-Styling ---------------------------- */

const PHASE_CLASSES: Record<PlanPhase, { badge: string; bar: string }> = {
  base: { badge: "bg-sky-500/15 text-sky-500", bar: "bg-sky-500" },
  build: { badge: "bg-primary/15 text-primary", bar: "bg-primary" },
  peak: { badge: "bg-amber-500/15 text-amber-500", bar: "bg-amber-500" },
  taper: { badge: "bg-violet-500/15 text-violet-500", bar: "bg-violet-500" },
};

function categoryIcon(type: PlanSession["type"]) {
  const cat = getSessionTypeMeta(type).category;
  if (cat === "run") return Footprints;
  if (cat === "strength") return Dumbbell;
  if (cat === "hybrid") return Zap;
  return Activity;
}

function shortDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" });
}

function kmLabel(m: number): string {
  return `${(m / 1000).toLocaleString("de-CH", { maximumFractionDigits: 1 })} km`;
}

/* ------------------------------ Hauptview ------------------------------ */

export function PlanView() {
  const profile = useProfile();
  const plan = useActivePlan();

  if (plan === undefined) {
    return <p className="px-1 text-sm text-muted-foreground">Lädt…</p>;
  }
  if (!plan) {
    return <PlanGenerator profileReady={!!profile} profileLevelName={profile ? LEVELS.find((l) => l.id === profile.level)?.name : undefined} />;
  }
  return <PlanWeekView plan={plan} />;
}

/* ----------------------------- Generator ------------------------------- */

function PlanGenerator({
  profileReady,
  profileLevelName,
}: {
  profileReady: boolean;
  profileLevelName?: string;
}) {
  const profile = useProfile();
  const [durationWeeks, setDurationWeeks] = useState<string>("12");
  const [busy, setBusy] = useState(false);

  if (!profileReady || !profile) {
    return (
      <Card>
        <CardHeader
          title="Zuerst Profil anlegen"
          subtitle="Der Plan richtet sich nach deinem Level und Renndatum."
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <CardBody className="pt-2">
          <Link
            href="/profil"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Zum Profil
          </Link>
        </CardBody>
      </Card>
    );
  }

  const raceWeeks = weeksUntil(profile.targetRaceDate);
  const hasRace = profile.targetRaceDate && raceWeeks != null && raceWeeks >= 1;
  const effectiveWeeks = hasRace
    ? Math.min(24, Math.max(4, raceWeeks as number))
    : Number(durationWeeks);

  async function handleGenerate() {
    if (!profile) return;
    setBusy(true);
    try {
      const plan = generatePlan({
        weeks: effectiveWeeks,
        level: profile.level,
        startDateIso: todayIso(),
        raceDateIso: profile.targetRaceDate,
      });
      await savePlan(plan);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Trainingsplan erstellen"
          subtitle="Periodisiert von Base über Build und Peak bis Taper."
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <CardBody className="space-y-4 pt-2">
          <div className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
            Level: <span className="font-medium text-foreground">{profileLevelName}</span>
          </div>

          {hasRace ? (
            <p className="text-sm text-muted-foreground">
              Bis zu deinem Rennen sind es noch{" "}
              <span className="font-semibold text-foreground">{raceWeeks} Wochen</span> –
              der Plan wird darauf ausgerichtet.
            </p>
          ) : (
            <div>
              <p className="mb-2 text-sm font-medium">Dauer wählen</p>
              <SegmentedControl
                ariaLabel="Plandauer"
                options={[
                  { value: "8", label: "8 Wochen" },
                  { value: "12", label: "12 Wochen" },
                  { value: "16", label: "16 Wochen" },
                ]}
                value={durationWeeks}
                onChange={setDurationWeeks}
                columns={3}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Tipp: Mit einem Ziel-Renndatum im Profil wird die Dauer automatisch
                berechnet.
              </p>
            </div>
          )}

          <Button onClick={handleGenerate} disabled={busy} className="w-full">
            <CalendarDays className="h-4 w-4" aria-hidden />
            Plan erstellen ({effectiveWeeks} Wochen)
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

/* ---------------------------- Wochenansicht ---------------------------- */

function PlanWeekView({ plan }: { plan: TrainingPlan }) {
  const [selected, setSelected] = useState(0);
  const initialised = useRef(false);

  // Beim ersten Laden auf die aktuelle Woche springen.
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    setSelected(currentWeekIndex(plan, todayIso()));
  }, [plan]);

  const week = plan.weeks[Math.min(selected, plan.weeks.length - 1)];
  const progress = weekProgress(week);
  const phaseCls = PHASE_CLASSES[week.phase];
  const weekEnd = addDays(week.startDateIso, 6);

  async function toggle(session: PlanSession) {
    await setPlanSessionDone(session.id, !session.done);
  }

  async function handleRegenerate() {
    if (
      !window.confirm(
        "Plan neu erstellen? Der aktuelle Plan inkl. abgehakter Einheiten wird ersetzt.",
      )
    ) {
      return;
    }
    const fresh = generatePlan({
      weeks: plan.weeks.length,
      level: plan.level,
      startDateIso: todayIso(),
      raceDateIso: plan.raceDateIso,
    });
    await savePlan(fresh);
    setSelected(0);
    initialised.current = false;
  }

  async function handleDelete() {
    if (!window.confirm("Trainingsplan wirklich löschen?")) return;
    await deletePlan();
  }

  return (
    <div className="space-y-6">
      {/* Wochen-Auswahlleiste */}
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2">
          {plan.weeks.map((w) => {
            const p = weekProgress(w);
            const complete = p.total > 0 && p.done === p.total;
            const active = w.index === week.index;
            return (
              <button
                key={w.index}
                type="button"
                onClick={() => setSelected(w.index)}
                className={cn(
                  "flex min-w-[52px] flex-col items-center gap-1 rounded-xl border px-2 py-2 transition",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted",
                )}
                aria-current={active ? "true" : undefined}
              >
                <span className="text-[11px] font-semibold">W{w.weekNumber}</span>
                <span className={cn("h-1.5 w-6 rounded-full", PHASE_CLASSES[w.phase].bar)} />
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    complete ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {p.done}/{p.total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wochen-Kopf */}
      <Card>
        <CardBody className="pt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", phaseCls.badge)}>
                {PHASE_LABELS[week.phase]}
              </span>
              {week.deload ? (
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  Deload
                </span>
              ) : null}
            </div>
            <span className="text-xs text-muted-foreground">
              Woche {week.weekNumber} / {plan.weeks.length}
            </span>
          </div>

          <p className="mt-3 text-sm font-semibold">{week.focus}</p>
          <p className="text-xs text-muted-foreground">
            {shortDay(week.startDateIso)} – {shortDay(weekEnd)}
          </p>

          {/* Fortschrittsbalken */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Fortschritt</span>
              <span className="tabular-nums">
                {progress.done}/{progress.total}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Wochen-Navigation */}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelected((i) => Math.max(0, i - 1))}
              disabled={week.index === 0}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Zurück
            </button>
            <button
              type="button"
              onClick={() => setSelected(currentWeekIndex(plan, todayIso()))}
              className="text-sm font-semibold text-primary"
            >
              Diese Woche
            </button>
            <button
              type="button"
              onClick={() => setSelected((i) => Math.min(plan.weeks.length - 1, i + 1))}
              disabled={week.index === plan.weeks.length - 1}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              Weiter
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Einheiten der Woche */}
      <section className="space-y-2">
        <SectionTitle>Einheiten</SectionTitle>
        <div className="space-y-3">
          {week.sessions.map((session) => (
            <PlanSessionCard key={session.id} session={session} onToggle={() => toggle(session)} />
          ))}
        </div>
      </section>

      {/* Aktionen */}
      <div className="space-y-3 pt-2">
        <Button variant="secondary" onClick={handleRegenerate} className="w-full">
          <RefreshCw className="h-4 w-4" aria-hidden />
          Plan neu erstellen
        </Button>
        <Button variant="ghost" onClick={handleDelete} className="w-full text-danger">
          <Trash2 className="h-4 w-4" aria-hidden />
          Plan löschen
        </Button>
      </div>
    </div>
  );
}

function PlanSessionCard({
  session,
  onToggle,
}: {
  session: PlanSession;
  onToggle: () => void;
}) {
  const Icon = categoryIcon(session.type);
  const target = session.targetDistanceM
    ? kmLabel(session.targetDistanceM)
    : session.targetDurationSeconds
      ? formatDuration(session.targetDurationSeconds)
      : null;

  return (
    <Card className={cn(session.done && "opacity-70")}>
      <CardBody className="flex items-start gap-3 pt-4">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={session.done}
          aria-label={session.done ? "Als offen markieren" : "Als erledigt markieren"}
          className="mt-0.5 shrink-0"
        >
          {session.done ? (
            <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground" aria-hidden />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {WEEKDAY_SHORT[session.day]}
            </span>
            <Icon className="h-4 w-4 text-primary" aria-hidden />
            <h3
              className={cn(
                "truncate text-sm font-semibold",
                session.done && "line-through",
              )}
            >
              {session.title}
            </h3>
            {target ? (
              <span className="ml-auto shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
                {target}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{session.description}</p>
          <Link
            href="/training/neu"
            className="mt-2 inline-block text-xs font-semibold text-primary"
          >
            Als Einheit loggen
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
