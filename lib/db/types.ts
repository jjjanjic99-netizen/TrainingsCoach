/**
 * Typisierte Datenmodelle für die lokale Persistenz (IndexedDB via Dexie).
 *
 * Diese Typen bilden die Domäne ab und werden über alle Ausbaustufen hinweg
 * erweitert. Die UI kennt ausschliesslich diese Typen – nie IndexedDB direkt.
 */

import type { DivisionId, LevelId, Sex } from "@/lib/hyrox/divisions";
import type { HyroxStationId } from "@/lib/hyrox/stations";

/** Einzige Profil-Zeile (Single-User). Fester Primärschlüssel. */
export const PROFILE_ID = "me" as const;

export interface Profile {
  /** Immer PROFILE_ID – es gibt genau ein Profil. */
  id: string;
  name: string;
  age?: number;
  sex: Sex;
  bodyweightKg?: number;
  division: DivisionId;
  level: LevelId;
  /** Ziel-Renndatum als ISO (YYYY-MM-DD). */
  targetRaceDate?: string;
  /** Ziel-Finishzeit in Sekunden. */
  targetFinishSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

/** Persönliche Bestleistung pro Station. */
export interface PersonalRecord {
  id?: number;
  stationId: HyroxStationId;
  /** Bei zeitbasierten Stationen: Bestzeit in Sekunden. */
  valueSeconds?: number;
  /** Bei repbasierten Stationen (z. B. Wall Balls): Wiederholungen. */
  reps?: number;
  /** Optionale Last (kg), z. B. für stationsspezifisches Training. */
  loadKg?: number;
  /** Datum der Leistung (ISO). */
  date: string;
  note?: string;
}

/** Art einer Trainingseinheit. */
export type SessionType =
  | "easy_run"
  | "tempo_run"
  | "interval_run"
  | "long_run"
  | "strength"
  | "station_specific"
  | "compromised_run"
  | "race_simulation"
  | "other";

/** Ein Lauf-Split innerhalb einer Einheit. */
export interface RunSplit {
  /** Distanz des Splits in Metern (z. B. 1000). */
  distanceM: number;
  /** Dauer des Splits in Sekunden. */
  durationSeconds: number;
}

/** Ergebnis einer Station innerhalb einer Einheit. */
export interface SessionStationResult {
  stationId: HyroxStationId;
  durationSeconds?: number;
  reps?: number;
  loadKg?: number;
}

/** Eine geloggte Trainingseinheit. */
export interface TrainingSession {
  id?: number;
  /** Datum (ISO YYYY-MM-DD). */
  date: string;
  type: SessionType;
  durationSeconds?: number;
  /** Wahrgenommene Anstrengung (RPE 1–10). */
  rpe?: number;
  avgHr?: number;
  maxHr?: number;
  notes?: string;
  runSplits?: RunSplit[];
  stationResults?: SessionStationResult[];
  createdAt: string;
  updatedAt: string;
}

/** Startwert einer Station im Baseline-Assessment. */
export interface StationBaseline {
  stationId: HyroxStationId;
  durationSeconds?: number;
  reps?: number;
  loadKg?: number;
}

/** Einmaliges Baseline-Assessment (kalibriert Plan und Prognose). */
export interface Assessment {
  id?: number;
  date: string;
  stationBaselines: StationBaseline[];
  /** 1-km-Time-Trial in Sekunden. */
  timeTrial1kSeconds?: number;
  /** 5-km-Benchmark in Sekunden. */
  run5kSeconds?: number;
  notes?: string;
  createdAt: string;
}

/** Täglicher Kurz-Input für Recovery/Readiness. */
export interface ReadinessEntry {
  /** Datum als Primärschlüssel (ISO YYYY-MM-DD, ein Eintrag pro Tag). */
  date: string;
  /** Schlafqualität 1–5. */
  sleepQuality?: number;
  /** Muskelkater 1–5 (5 = stark). */
  soreness?: number;
  /** Motivation 1–5. */
  motivation?: number;
  notes?: string;
  createdAt: string;
}
