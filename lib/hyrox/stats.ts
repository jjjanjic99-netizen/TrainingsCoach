/**
 * Auswertungs-Helfer (reine Funktionen) für Trends, Bestleistungen und
 * Trainingslast. Grundlage für das Fortschritts-Dashboard.
 *
 * Datenquellen: geloggte Einheiten (`TrainingSession`) und das jüngste
 * Baseline-Assessment. Keine Abhängigkeit zur UI oder zur DB.
 */

import type { Assessment, TrainingSession } from "@/lib/db/types";
import { getStation, type HyroxStationId, type StationMetric } from "./stations";
import { getSessionTypeMeta, isRunCategory } from "./sessions";
import { pacePerKm } from "@/lib/format";

/* --------------------------- Stationswerte ----------------------------- */

/** Ein Messpunkt einer Station über die Zeit. */
export interface StationPoint {
  date: string;
  value: number; // Sekunden (time) oder Wiederholungen (reps)
  source: "assessment" | "session";
}

/** Rohwert einer Station aus einem Result/Baseline ziehen. */
function stationValue(
  metric: StationMetric,
  entry: { durationSeconds?: number; reps?: number },
): number | undefined {
  return metric === "time" ? entry.durationSeconds : entry.reps;
}

/**
 * Alle Messpunkte einer Station (aus Baseline + Einheiten), aufsteigend
 * nach Datum sortiert.
 */
export function stationTrend(
  sessions: TrainingSession[],
  assessment: Assessment | undefined,
  stationId: HyroxStationId,
): StationPoint[] {
  const metric = getStation(stationId).metric;
  const points: StationPoint[] = [];

  if (assessment) {
    const base = assessment.stationBaselines.find((b) => b.stationId === stationId);
    const v = base ? stationValue(metric, base) : undefined;
    if (v != null) points.push({ date: assessment.date, value: v, source: "assessment" });
  }

  for (const session of sessions) {
    for (const result of session.stationResults ?? []) {
      if (result.stationId !== stationId) continue;
      const v = stationValue(metric, result);
      if (v != null) points.push({ date: session.date, value: v, source: "session" });
    }
  }

  return points.sort((a, b) => a.date.localeCompare(b.date));
}

/** Beste Leistung einer Station. */
export interface StationBest {
  stationId: HyroxStationId;
  metric: StationMetric;
  value: number;
  date: string;
}

/** Ist a besser als b für die gegebene Metrik? (Zeit: kleiner, Reps: grösser) */
function isBetter(metric: StationMetric, a: number, b: number): boolean {
  return metric === "time" ? a < b : a > b;
}

/** Beste Leistung pro Station über alle Datenquellen. */
export function bestPerStation(
  sessions: TrainingSession[],
  assessment: Assessment | undefined,
): Map<HyroxStationId, StationBest> {
  const result = new Map<HyroxStationId, StationBest>();

  const consider = (stationId: HyroxStationId, value: number, date: string) => {
    const metric = getStation(stationId).metric;
    const current = result.get(stationId);
    if (!current || isBetter(metric, value, current.value)) {
      result.set(stationId, { stationId, metric, value, date });
    }
  };

  if (assessment) {
    for (const base of assessment.stationBaselines) {
      const v = stationValue(getStation(base.stationId).metric, base);
      if (v != null) consider(base.stationId, v, assessment.date);
    }
  }
  for (const session of sessions) {
    for (const result2 of session.stationResults ?? []) {
      const v = stationValue(getStation(result2.stationId).metric, result2);
      if (v != null) consider(result2.stationId, v, session.date);
    }
  }

  return result;
}

/* ------------------------------ Lauf-Pace ------------------------------ */

/** Distanz (m) und Dauer (s) einer Einheit – aus Feldern oder Splits. */
export function sessionDistanceAndDuration(session: TrainingSession): {
  distanceM: number;
  durationSeconds: number;
} {
  const splitDistance =
    session.runSplits?.reduce((sum, s) => sum + (s.distanceM || 0), 0) ?? 0;
  const splitDuration =
    session.runSplits?.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) ?? 0;
  return {
    distanceM: session.distanceM ?? splitDistance,
    durationSeconds: session.durationSeconds ?? splitDuration,
  };
}

export interface PacePoint {
  date: string;
  secondsPerKm: number;
}

/** Pace-Entwicklung aus Lauf-/Hybrid-Einheiten mit Distanz und Dauer. */
export function runPaceTrend(sessions: TrainingSession[]): PacePoint[] {
  const points: PacePoint[] = [];
  for (const session of sessions) {
    if (!isRunCategory(getSessionTypeMeta(session.type).category)) continue;
    const { distanceM, durationSeconds } = sessionDistanceAndDuration(session);
    if (distanceM <= 0 || durationSeconds <= 0) continue;
    const pace = pacePerKm(distanceM, durationSeconds);
    if (pace == null) continue;
    points.push({ date: session.date, secondsPerKm: pace });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

/* --------------------------- Trainingslast ----------------------------- */

/** Montag der Woche eines Datums (ISO YYYY-MM-DD). */
export function startOfWeekIso(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const day = (d.getDay() + 6) % 7; // Mo=0 … So=6
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export interface WeekVolume {
  weekStartIso: string;
  sessions: number;
  durationSeconds: number;
  distanceM: number;
}

/** Wochenvolumen (Anzahl, Dauer, Distanz) je Kalenderwoche, aufsteigend. */
export function weeklyVolume(sessions: TrainingSession[]): WeekVolume[] {
  const map = new Map<string, WeekVolume>();
  for (const session of sessions) {
    const week = startOfWeekIso(session.date);
    const { distanceM, durationSeconds } = sessionDistanceAndDuration(session);
    const entry = map.get(week) ?? {
      weekStartIso: week,
      sessions: 0,
      durationSeconds: 0,
      distanceM: 0,
    };
    entry.sessions += 1;
    entry.durationSeconds += durationSeconds;
    entry.distanceM += distanceM;
    map.set(week, entry);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.weekStartIso.localeCompare(b.weekStartIso),
  );
}

/** Kennzahlen der aktuellen Kalenderwoche. */
export function currentWeekSummary(sessions: TrainingSession[], todayIso: string) {
  const week = startOfWeekIso(todayIso);
  const inWeek = sessions.filter((s) => startOfWeekIso(s.date) === week);
  const totals = inWeek.reduce(
    (acc, s) => {
      const { distanceM, durationSeconds } = sessionDistanceAndDuration(s);
      acc.durationSeconds += durationSeconds;
      acc.distanceM += distanceM;
      return acc;
    },
    { durationSeconds: 0, distanceM: 0 },
  );
  return { sessions: inWeek.length, ...totals };
}
