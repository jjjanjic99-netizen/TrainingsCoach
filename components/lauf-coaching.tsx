"use client";

/**
 * Lauf-Coaching (Stufe 4): Pace-Zonen aus einem Lauf-Test (VDOT), konkrete
 * Intervall-Workouts und eine Wochenkilometer-Progression. Verzahnt mit dem
 * Hyrox-Plan – die Läufe zählen in beide Modelle.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Activity, CalendarDays, Gauge, Repeat, TrendingUp } from "lucide-react";
import { Card, CardBody, CardHeader, SectionTitle } from "@/components/ui";
import { Field, NumberInput, SegmentedControl, TimeInput } from "@/components/form";
import {
  useLatestAssessment,
  useProfile,
  useSessions,
} from "@/lib/hooks/use-live-data";
import {
  computePaceZones,
  generateWorkouts,
  mileageProgression,
  recentWeeklyRunKm,
} from "@/lib/hyrox/running";
import type { LevelId } from "@/lib/hyrox/divisions";
import {
  formatDuration,
  formatPace,
  parseDurationInput,
  parseNumberInput,
  weeksUntil,
} from "@/lib/format";
import { cn } from "@/lib/cn";

const DISTANCE_OPTIONS = [
  { value: "1000", label: "1 km" },
  { value: "3000", label: "3 km" },
  { value: "5000", label: "5 km" },
  { value: "10000", label: "10 km" },
];

/** Standard-Wochenkilometer je Level, falls keine Laufdaten vorhanden. */
const DEFAULT_KM: Record<LevelId, number> = {
  beginner: 20,
  intermediate: 35,
  competition: 50,
};

export function LaufCoaching() {
  const assessment = useLatestAssessment();
  const sessions = useSessions();
  const profile = useProfile();

  const [distance, setDistance] = useState("5000");
  const [time, setTime] = useState("");
  const [startKm, setStartKm] = useState("");

  const hydratedTest = useRef(false);

  // Test aus dem jüngsten Assessment vorbelegen (einmalig).
  useEffect(() => {
    if (hydratedTest.current || !assessment) return;
    hydratedTest.current = true;
    if (assessment.run5kSeconds != null) {
      setDistance("5000");
      setTime(formatDuration(assessment.run5kSeconds));
    } else if (assessment.timeTrial1kSeconds != null) {
      setDistance("1000");
      setTime(formatDuration(assessment.timeTrial1kSeconds));
    }
  }, [assessment]);

  // Start-Wochenkilometer aus Laufdaten oder Level-Default vorbelegen.
  // Nur wenn das Feld noch leer ist (überschreibt keine Eingabe); reagiert
  // korrekt, sobald Sessions bzw. Profil geladen sind.
  useEffect(() => {
    if (sessions === undefined) return;
    const fromData = recentWeeklyRunKm(sessions);
    if (fromData > 0) {
      setStartKm((prev) => (prev === "" ? String(fromData) : prev));
    } else if (profile) {
      setStartKm((prev) => (prev === "" ? String(DEFAULT_KM[profile.level]) : prev));
    }
  }, [sessions, profile]);

  const distanceM = Number(distance);
  const timeSec = parseDurationInput(time);
  const zones = useMemo(
    () => (timeSec != null ? computePaceZones(distanceM, timeSec) : null),
    [distanceM, timeSec],
  );
  const workouts = useMemo(() => (zones ? generateWorkouts(zones) : []), [zones]);

  const progWeeks = Math.min(12, Math.max(4, weeksUntil(profile?.targetRaceDate) ?? 10));
  const kmStart = parseNumberInput(startKm) ?? 0;
  const mileage = useMemo(
    () => (kmStart > 0 ? mileageProgression(kmStart, progWeeks) : []),
    [kmStart, progWeeks],
  );
  const maxKm = mileage.reduce((m, w) => Math.max(m, w.km), 0);

  return (
    <div className="space-y-6">
      {/* Test-Eingabe */}
      <Card>
        <CardHeader
          title="Dein Lauf-Test"
          subtitle="Basis für VDOT und alle Pace-Zonen."
          icon={<Gauge className="h-5 w-5" />}
        />
        <CardBody className="space-y-4 pt-2">
          <Field label="Distanz">
            <SegmentedControl
              ariaLabel="Testdistanz"
              options={DISTANCE_OPTIONS}
              value={distance}
              onChange={setDistance}
              columns={4}
            />
          </Field>
          <Field label="Zeit" hint="Format mm:ss oder hh:mm:ss.">
            <TimeInput
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="20:00"
            />
          </Field>

          {zones ? (
            <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                Test-Pace{" "}
                <span className="font-semibold text-foreground">
                  {formatPace(zones.basis.secPerKm)}
                </span>
              </span>
              <span className="text-muted-foreground">
                VDOT{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {zones.vdot.toLocaleString("de-CH")}
                </span>
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Gib Distanz und Zeit ein – oder erfasse das{" "}
              <Link href="/baseline" className="font-semibold text-primary">
                Baseline-Assessment
              </Link>
              .
            </p>
          )}
        </CardBody>
      </Card>

      {zones ? (
        <>
          {/* Pace-Zonen */}
          <section className="space-y-2">
            <SectionTitle>Pace-Zonen</SectionTitle>
            <Card>
              <ul className="divide-y divide-border">
                {zones.zones.map((zone) => (
                  <li key={zone.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary">
                      {zone.shortName}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{zone.name}</span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                          {zone.secPerKmSlow
                            ? `${formatDuration(zone.secPerKm)}–${formatPace(zone.secPerKmSlow)}`
                            : formatPace(zone.secPerKm)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{zone.purpose}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {/* Intervall-Workouts */}
          <section className="space-y-2">
            <SectionTitle>Intervall-Workouts</SectionTitle>
            <div className="space-y-3">
              {workouts.map((w) => (
                <Card key={w.id}>
                  <CardBody className="pt-4">
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-primary" aria-hidden />
                      <h3 className="text-sm font-semibold">{w.title}</h3>
                      <span className="ml-auto text-xs font-semibold text-muted-foreground tabular-nums">
                        {(w.totalM / 1000).toLocaleString("de-CH")} km
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{w.description}</p>
                    {w.repTargetSec != null ? (
                      <p className="mt-2 inline-flex rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold">
                        Ziel {w.repLabel}:{" "}
                        <span className="ml-1 tabular-nums text-primary">
                          {formatDuration(w.repTargetSec)}
                        </span>
                      </p>
                    ) : null}
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {/* Wochenkilometer-Progression */}
      <section className="space-y-2">
        <SectionTitle>Wochenkilometer-Progression</SectionTitle>
        <Card>
          <CardHeader
            title="Umfang aufbauen"
            subtitle="Max. ~10 %/Woche, jede 4. Woche Deload."
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <CardBody className="space-y-4 pt-2">
            <Field label="Aktuelle Wochenkilometer" hint="Basis für die Progression.">
              <NumberInput
                value={startKm}
                onChange={(e) => setStartKm(e.target.value)}
                placeholder="z. B. 35"
              />
            </Field>

            {mileage.length > 0 ? (
              <ul className="space-y-1.5">
                {mileage.map((w) => (
                  <li key={w.week} className="flex items-center gap-3">
                    <span className="w-12 shrink-0 text-xs text-muted-foreground">
                      W{w.week}
                    </span>
                    <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
                      <div
                        className={cn(
                          "flex h-full items-center justify-end rounded-md px-2 text-[11px] font-semibold text-primary-foreground",
                          w.deload ? "bg-violet-500" : "bg-primary",
                        )}
                        style={{ width: `${maxKm ? (w.km / maxKm) * 100 : 0}%` }}
                      >
                        {w.km}
                      </div>
                    </div>
                    {w.deload ? (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Deload
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Gib deine aktuellen Wochenkilometer ein, um die Progression zu sehen.
              </p>
            )}
          </CardBody>
        </Card>
      </section>

      {/* Verzahnung mit dem Hyrox-Plan */}
      <Card className="border-dashed">
        <CardBody className="flex items-start gap-3 pt-4 text-sm text-muted-foreground">
          <Activity className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div>
            Diese Pace-Zonen gelten für die Läufe in deinem{" "}
            <Link href="/plan" className="inline-flex items-center gap-1 font-semibold text-primary">
              <CalendarDays className="h-4 w-4" aria-hidden />
              Trainingsplan
            </Link>
            . Läufe zählen in beide Modelle – logge sie wie gewohnt im Training.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
