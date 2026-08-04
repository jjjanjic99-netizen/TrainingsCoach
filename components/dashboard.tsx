"use client";

/**
 * Fortschritts-Dashboard (Stufe 2): objektive Trends über die Zeit.
 * Kennzahlen, Stationstrend (wählbar), Lauf-Pace-Entwicklung, Wochenvolumen
 * und die abgeleiteten Bestleistungen. Prognose/Radar folgen in Stufe 5.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Activity, CalendarClock, ClipboardCheck, Plus } from "lucide-react";
import { Card, CardBody, CardHeader, SectionTitle } from "@/components/ui";
import { Select } from "@/components/form";
import { TrendLineChart, VolumeBarChart } from "@/components/charts";
import { PersonalRecordsCard } from "@/components/personal-records-card";
import { useProfile, useSessions, useLatestAssessment } from "@/lib/hooks/use-live-data";
import {
  currentWeekSummary,
  runPaceTrend,
  stationTrend,
  weeklyVolume,
} from "@/lib/hyrox/stats";
import { HYROX_STATIONS, getStation, type HyroxStationId } from "@/lib/hyrox/stations";
import { formatDuration, formatPace, todayIso, weeksUntil } from "@/lib/format";

export function Dashboard() {
  const profile = useProfile();
  const sessions = useSessions();
  const assessment = useLatestAssessment();

  const [station, setStation] = useState<HyroxStationId>("ski_erg");
  const pickedDefault = useRef(false);

  // Beim ersten Laden eine Station mit Daten vorauswählen.
  useEffect(() => {
    if (pickedDefault.current || sessions === undefined) return;
    const withData = HYROX_STATIONS.find(
      (s) => stationTrend(sessions, assessment ?? undefined, s.id).length > 0,
    );
    if (withData) setStation(withData.id);
    pickedDefault.current = true;
  }, [sessions, assessment]);

  const paceTrend = useMemo(() => runPaceTrend(sessions ?? []), [sessions]);
  const stTrend = useMemo(
    () => stationTrend(sessions ?? [], assessment ?? undefined, station),
    [sessions, assessment, station],
  );
  const volume = useMemo(() => {
    const weeks = weeklyVolume(sessions ?? []).slice(-8);
    return weeks.map((w) => ({ date: w.weekStartIso, value: w.sessions }));
  }, [sessions]);

  if (sessions === undefined) {
    return <p className="px-1 text-sm text-muted-foreground">Lädt…</p>;
  }

  const hasData = sessions.length > 0 || (assessment?.stationBaselines.length ?? 0) > 0;

  if (!hasData) {
    return <EmptyDashboard />;
  }

  const week = currentWeekSummary(sessions, todayIso());
  const weeks = weeksUntil(profile?.targetRaceDate);
  const metric = getStation(station).metric;
  const valueFormatter =
    metric === "time" ? (v: number) => formatDuration(v) : (v: number) => String(v);

  return (
    <div className="space-y-6">
      {/* Kennzahlen */}
      <div className="grid grid-cols-3 gap-3">
        <Stat value={String(sessions.length)} label="Einheiten" />
        <Stat value={String(week.sessions)} label="Diese Woche" />
        <Stat
          value={weeks != null ? (weeks >= 0 ? String(weeks) : "—") : "—"}
          label="Wochen bis Rennen"
        />
      </div>

      {/* Stationstrend */}
      <section className="space-y-2">
        <SectionTitle>Stationstrend</SectionTitle>
        <Card>
          <CardBody className="space-y-3 pt-4">
            <Select
              aria-label="Station wählen"
              value={station}
              onChange={(e) => setStation(e.target.value as HyroxStationId)}
            >
              {HYROX_STATIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>

            {stTrend.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Noch keine Werte für diese Station.
              </p>
            ) : (
              <>
                <TrendLineChart
                  data={stTrend}
                  valueFormatter={valueFormatter}
                  label={metric === "time" ? "Zeit" : "Reps"}
                />
                <p className="text-xs text-muted-foreground">
                  {metric === "time"
                    ? "Niedriger ist besser (schnellere Zeit)."
                    : "Höher ist besser (mehr Wiederholungen)."}
                </p>
              </>
            )}
          </CardBody>
        </Card>
      </section>

      {/* Lauf-Pace */}
      <section className="space-y-2">
        <SectionTitle>Lauf-Pace-Entwicklung</SectionTitle>
        <Card>
          <CardBody className="space-y-3 pt-4">
            {paceTrend.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Logge eine Lauf-Einheit mit Distanz und Dauer, um die Pace zu
                sehen.
              </p>
            ) : (
              <>
                <TrendLineChart
                  data={paceTrend.map((p) => ({ date: p.date, value: p.secondsPerKm }))}
                  valueFormatter={(v) => formatPace(v)}
                  label="Pace"
                  variant="sky"
                />
                <p className="text-xs text-muted-foreground">
                  Niedriger ist besser (schnellere Pace).
                </p>
              </>
            )}
          </CardBody>
        </Card>
      </section>

      {/* Wochenvolumen */}
      <section className="space-y-2">
        <SectionTitle>Wochenvolumen</SectionTitle>
        <Card>
          <CardBody className="pt-4">
            {volume.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Noch keine Einheiten.
              </p>
            ) : (
              <VolumeBarChart data={volume} valueFormatter={(v) => String(v)} label="Einheiten" />
            )}
          </CardBody>
        </Card>
      </section>

      {/* Bestleistungen */}
      <section className="space-y-2">
        <SectionTitle>Bestleistungen</SectionTitle>
        <PersonalRecordsCard />
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card>
      <CardBody className="px-3 pt-4">
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="mt-0.5 text-xs leading-tight text-muted-foreground">{label}</div>
      </CardBody>
    </Card>
  );
}

function EmptyDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Noch keine Daten"
          subtitle="Erfasse zuerst deinen Startpunkt oder logge eine Einheit."
          icon={<Activity className="h-5 w-5" />}
        />
        <CardBody className="space-y-3 pt-2">
          <Link
            href="/baseline"
            className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm font-semibold transition hover:border-primary/40"
          >
            <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden />
            Baseline-Assessment erfassen
          </Link>
          <Link
            href="/training/neu"
            className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm font-semibold transition hover:border-primary/40"
          >
            <Plus className="h-5 w-5 text-primary" aria-hidden />
            Erste Einheit loggen
          </Link>
        </CardBody>
      </Card>

      <Card className="border-dashed">
        <CardBody className="flex items-start gap-3 pt-4 text-sm text-muted-foreground">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          Sobald du Daten erfasst, erscheinen hier Stationstrends, Pace-Entwicklung
          und deine Bestleistungen.
        </CardBody>
      </Card>
    </div>
  );
}
