/**
 * Renn-Prognose (reine Logik, keine UI/DB).
 *
 * Schätzt die Gesamt-Finishzeit aus aktuellen Benchmarks:
 *   Summe realistischer Stationssplits + 8 × 1 km Laufen + Roxzone-Schätzung.
 * Vergleicht die aktuellen Splits mit Zielsplits (aus der Ziel-Finishzeit oder
 * einem Referenz-Benchmark) für Stärken/Schwächen-Radar und limitierende
 * Stationen. Liefert zudem einen Prognose-Verlauf über die Zeit.
 */

import type { Assessment, TrainingSession } from "@/lib/db/types";
import {
  HYROX_STATIONS,
  RUN_SEGMENTS,
  type HyroxStationId,
} from "@/lib/hyrox/stations";
import { bestPerStation } from "@/lib/hyrox/stats";
import { getSessionTypeMeta, isRunCategory } from "@/lib/hyrox/sessions";
import { pacePerKm } from "@/lib/format";

/* --------------------------- Referenzwerte ----------------------------- */

/** Referenz-Splits (Sekunden) eines soliden Amateur-Rennens (~70 min). */
const REF_STATION_SEC: Record<HyroxStationId, number> = {
  ski_erg: 240,
  sled_push: 130,
  sled_pull: 160,
  burpee_broad_jumps: 260,
  rowing: 235,
  farmers_carry: 100,
  sandbag_lunges: 200,
  wall_balls: 300,
};
const REF_RUN_PER_KM = 285; // 4:45/km
const REF_ROXZONE_SEC = 280; // Summe aller Transitions

const REF_STATION_TOTAL = Object.values(REF_STATION_SEC).reduce((a, b) => a + b, 0);
const REF_TOTAL = REF_RUN_PER_KM * RUN_SEGMENTS + REF_STATION_TOTAL + REF_ROXZONE_SEC;

export interface Targets {
  runPerKm: number;
  station: Record<HyroxStationId, number>;
  roxzone: number;
  total: number;
}

/**
 * Zielsplits: aus der Ziel-Finishzeit proportional skaliert, sonst der
 * Referenz-Benchmark.
 */
export function computeTargets(goalFinishSeconds?: number): Targets {
  const k =
    goalFinishSeconds && goalFinishSeconds > 0 ? goalFinishSeconds / REF_TOTAL : 1;
  const station = {} as Record<HyroxStationId, number>;
  for (const s of HYROX_STATIONS) station[s.id] = Math.round(REF_STATION_SEC[s.id] * k);
  return {
    runPerKm: REF_RUN_PER_KM * k,
    station,
    roxzone: Math.round(REF_ROXZONE_SEC * k),
    total: Math.round(REF_TOTAL * k),
  };
}

/* ----------------------------- Ist-Werte ------------------------------- */

export interface CurrentInputs {
  /** Aktuelle Renn-Lauf-Pace (s/km), falls ableitbar. */
  runPerKm?: number;
  /** Beste Stationszeiten (s), wo vorhanden. */
  station: Partial<Record<HyroxStationId, number>>;
}

/** Repräsentative Lauf-Pace (s/km) aus Einheiten und Assessment (beste). */
function deriveRunPace(
  sessions: TrainingSession[],
  assessment: Assessment | undefined,
): number | undefined {
  let best: number | undefined;
  const consider = (p: number | null | undefined) => {
    if (p != null && Number.isFinite(p)) best = best == null ? p : Math.min(best, p);
  };
  // Aus längeren Lauf-/Hybrid-Einheiten (>= 2 km) die schnellste Pace.
  for (const s of sessions) {
    if (!isRunCategory(getSessionTypeMeta(s.type).category)) continue;
    const splitDist = s.runSplits?.reduce((a, x) => a + (x.distanceM || 0), 0) ?? 0;
    const splitDur = s.runSplits?.reduce((a, x) => a + (x.durationSeconds || 0), 0) ?? 0;
    const dist = s.distanceM ?? splitDist;
    const dur = s.durationSeconds ?? splitDur;
    if (dist >= 2000 && dur > 0) consider(pacePerKm(dist, dur));
  }
  // Aus Benchmarks (5 km bevorzugt, sonst 1 km).
  if (assessment?.run5kSeconds) consider(assessment.run5kSeconds / 5);
  else if (assessment?.timeTrial1kSeconds) consider(assessment.timeTrial1kSeconds);
  return best;
}

/** Leitet aktuelle Werte (Lauf-Pace, beste Stationszeiten) aus den Daten ab. */
export function deriveCurrent(
  sessions: TrainingSession[],
  assessment: Assessment | undefined,
): CurrentInputs {
  const best = bestPerStation(sessions, assessment);
  const station: Partial<Record<HyroxStationId, number>> = {};
  for (const [id, entry] of best) {
    if (entry.metric === "time") station[id] = entry.value;
  }
  return { runPerKm: deriveRunPace(sessions, assessment), station };
}

/* ------------------------------ Prognose ------------------------------- */

export interface StationForecast {
  stationId: HyroxStationId;
  current?: number;
  target: number;
  used: number;
  hasData: boolean;
  /** target/used: >1 = besser als Ziel (Stärke), <1 = Schwäche. */
  ratio: number;
}

export interface Forecast {
  totalSeconds: number;
  runPerKm: number;
  runTotalSeconds: number;
  runHasData: boolean;
  roxzoneSeconds: number;
  stations: StationForecast[];
  /** Bis zu 2 limitierende Stationen (mit Daten, deutlich über Ziel). */
  limiting: HyroxStationId[];
  targets: Targets;
}

/** Berechnet die Prognose aus aktuellen Werten und Zielsplits. */
export function computeForecast(current: CurrentInputs, targets: Targets): Forecast {
  const runPerKm = current.runPerKm ?? targets.runPerKm;
  const runTotalSeconds = runPerKm * RUN_SEGMENTS;

  const stations: StationForecast[] = HYROX_STATIONS.map((s) => {
    const cur = current.station[s.id];
    const target = targets.station[s.id];
    const used = cur ?? target;
    return {
      stationId: s.id,
      current: cur,
      target,
      used,
      hasData: cur != null,
      ratio: used > 0 ? target / used : 1,
    };
  });

  const stationTotal = stations.reduce((a, s) => a + s.used, 0);
  const roxzoneSeconds = targets.roxzone;
  const totalSeconds = Math.round(runTotalSeconds + stationTotal + roxzoneSeconds);

  const limiting = stations
    .filter((s) => s.hasData && s.used / s.target > 1.03)
    .sort((a, b) => b.used / b.target - a.used / a.target)
    .slice(0, 2)
    .map((s) => s.stationId);

  return {
    totalSeconds,
    runPerKm,
    runTotalSeconds: Math.round(runTotalSeconds),
    runHasData: current.runPerKm != null,
    roxzoneSeconds,
    stations,
    limiting,
    targets,
  };
}

/* --------------------------- Prognose-Verlauf -------------------------- */

export interface ForecastPoint {
  date: string;
  totalSeconds: number;
}

interface DataEvent {
  date: string;
  station: Partial<Record<HyroxStationId, number>>;
  pace?: number;
}

/**
 * Prognose-Verlauf: spielt Assessment + Einheiten chronologisch ab und
 * berechnet nach jedem neuen Datenpunkt die Prognose aus den bis dahin
 * besten Werten. Ergebnis: eine (idealerweise fallende) Kurve über die Zeit.
 */
export function forecastHistory(
  sessions: TrainingSession[],
  assessment: Assessment | undefined,
  targets: Targets,
): ForecastPoint[] {
  const events: DataEvent[] = [];

  if (assessment) {
    const station: Partial<Record<HyroxStationId, number>> = {};
    for (const b of assessment.stationBaselines) {
      if (b.durationSeconds != null) station[b.stationId] = b.durationSeconds;
    }
    const pace = assessment.run5kSeconds
      ? assessment.run5kSeconds / 5
      : assessment.timeTrial1kSeconds
        ? assessment.timeTrial1kSeconds
        : undefined;
    events.push({ date: assessment.date, station, pace });
  }

  for (const s of sessions) {
    const station: Partial<Record<HyroxStationId, number>> = {};
    for (const r of s.stationResults ?? []) {
      if (r.durationSeconds != null) station[r.stationId] = r.durationSeconds;
    }
    let pace: number | undefined;
    if (isRunCategory(getSessionTypeMeta(s.type).category)) {
      const splitDist = s.runSplits?.reduce((a, x) => a + (x.distanceM || 0), 0) ?? 0;
      const splitDur = s.runSplits?.reduce((a, x) => a + (x.durationSeconds || 0), 0) ?? 0;
      const dist = s.distanceM ?? splitDist;
      const dur = s.durationSeconds ?? splitDur;
      if (dist >= 2000 && dur > 0) pace = pacePerKm(dist, dur) ?? undefined;
    }
    events.push({ date: s.date, station, pace });
  }

  events.sort((a, b) => a.date.localeCompare(b.date));

  const bestStation: Partial<Record<HyroxStationId, number>> = {};
  let bestPace: number | undefined;
  const byDate = new Map<string, number>();

  for (const e of events) {
    for (const [id, v] of Object.entries(e.station)) {
      const key = id as HyroxStationId;
      const val = v as number;
      bestStation[key] = bestStation[key] == null ? val : Math.min(bestStation[key]!, val);
    }
    if (e.pace != null) bestPace = bestPace == null ? e.pace : Math.min(bestPace, e.pace);

    const f = computeForecast({ runPerKm: bestPace, station: bestStation }, targets);
    byDate.set(e.date, f.totalSeconds); // pro Datum letzter Stand
  }

  return Array.from(byDate.entries())
    .map(([date, totalSeconds]) => ({ date, totalSeconds }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
