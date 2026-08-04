"use client";

/**
 * Liste der geloggten Trainingseinheiten (neueste zuerst).
 * Jede Zeile verlinkt auf die Bearbeitung.
 */

import Link from "next/link";
import { ChevronRight, Clock, Footprints, Gauge, Dumbbell, Plus } from "lucide-react";
import { Card, CardBody } from "@/components/ui";
import { useSessions } from "@/lib/hooks/use-live-data";
import type { TrainingSession } from "@/lib/db/types";
import { getSessionTypeMeta, sessionTypeLabel } from "@/lib/hyrox/sessions";
import { sessionDistanceAndDuration } from "@/lib/hyrox/stats";
import { formatDate, formatDuration, formatPace, pacePerKm } from "@/lib/format";

export function SessionList() {
  const sessions = useSessions();

  if (sessions === undefined) {
    return <p className="px-1 text-sm text-muted-foreground">Lädt…</p>;
  }
  if (sessions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardBody className="pt-4 text-sm text-muted-foreground">
          Noch keine Einheiten. Logge deine erste Einheit über{" "}
          <Link href="/training/neu" className="font-semibold text-primary">
            „Einheit hinzufügen“
          </Link>
          .
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <ul className="divide-y divide-border">
        {sessions.map((session) => (
          <li key={session.id}>
            <SessionRow session={session} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SessionRow({ session }: { session: TrainingSession }) {
  const category = getSessionTypeMeta(session.type).category;
  const { distanceM, durationSeconds } = sessionDistanceAndDuration(session);
  const isRun = category === "run" || category === "hybrid";
  const pace =
    isRun && distanceM > 0 && durationSeconds > 0
      ? pacePerKm(distanceM, durationSeconds)
      : null;
  const stationCount = session.stationResults?.length ?? 0;

  return (
    <Link
      href={`/training/${session.id}`}
      className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-muted/50"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">
            {sessionTypeLabel(session.type)}
          </span>
          {session.rpe != null ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              RPE {session.rpe}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{formatDate(session.date)}</span>
          {durationSeconds > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {formatDuration(durationSeconds)}
            </span>
          ) : null}
          {distanceM > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Footprints className="h-3.5 w-3.5" aria-hidden />
              {(distanceM / 1000).toLocaleString("de-CH", {
                maximumFractionDigits: 2,
              })}{" "}
              km
            </span>
          ) : null}
          {pace != null ? (
            <span className="inline-flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" aria-hidden />
              {formatPace(pace)}
            </span>
          ) : null}
          {stationCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Dumbbell className="h-3.5 w-3.5" aria-hidden />
              {stationCount} {stationCount === 1 ? "Station" : "Stationen"}
            </span>
          ) : null}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

/** Auffälliger Button zum Hinzufügen einer Einheit. */
export function AddSessionButton() {
  return (
    <Link
      href="/training/neu"
      className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
    >
      <Plus className="h-5 w-5" aria-hidden />
      Einheit hinzufügen
    </Link>
  );
}
