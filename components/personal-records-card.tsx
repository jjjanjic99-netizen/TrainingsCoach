"use client";

/**
 * Persönliche Bestleistungen pro Station – automatisch abgeleitet aus dem
 * Baseline-Assessment und allen geloggten Einheiten (bestes = schnellste Zeit
 * bzw. meiste Reps). Wird auf Profil und Dashboard verwendet.
 */

import { Trophy } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { useSessions, useLatestAssessment } from "@/lib/hooks/use-live-data";
import { bestPerStation } from "@/lib/hyrox/stats";
import { HYROX_STATIONS } from "@/lib/hyrox/stations";
import { formatDate, formatDuration } from "@/lib/format";

export function PersonalRecordsCard() {
  const sessions = useSessions();
  const assessment = useLatestAssessment();

  const loading = sessions === undefined;
  const best = bestPerStation(sessions ?? [], assessment ?? undefined);
  const hasAny = best.size > 0;

  return (
    <Card>
      <CardHeader
        title="Persönliche Bestleistungen"
        subtitle="Automatisch aus Baseline und Einheiten aktualisiert."
        icon={<Trophy className="h-5 w-5" />}
      />
      <CardBody className="pt-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Lädt…</p>
        ) : !hasAny ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Werte. Erfasse das Baseline-Assessment oder logge eine
            Einheit mit Stationsergebnissen.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {HYROX_STATIONS.map((station) => {
              const entry = best.get(station.id);
              return (
                <li
                  key={station.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span className="text-muted-foreground">{station.name}</span>
                  {entry ? (
                    <span className="text-right">
                      <span className="font-semibold tabular-nums">
                        {entry.metric === "time"
                          ? formatDuration(entry.value)
                          : `${entry.value} Reps`}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDate(entry.date)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
