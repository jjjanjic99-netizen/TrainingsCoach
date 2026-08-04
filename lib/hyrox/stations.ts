/**
 * Hyrox-Domänenwissen – fest verdrahtet (Saison 25/26).
 *
 * Ein Hyrox-Rennen besteht aus 8 × 1 km Laufen im Wechsel mit 8 Stationen
 * in weltweit identischer, fester Reihenfolge. Dadurch sind Zeiten direkt
 * vergleichbar. Zwischen den Stationen liegt die „Roxzone" (Transitwege),
 * die real Zeit kostet und in die Prognose einfliesst.
 *
 * Einheiten: metrisch (km, kg, min/km, Sekunden).
 */

/** Stabile IDs der 8 Stationen (in Wettkampfreihenfolge). */
export type HyroxStationId =
  | "ski_erg"
  | "sled_push"
  | "sled_pull"
  | "burpee_broad_jumps"
  | "rowing"
  | "farmers_carry"
  | "sandbag_lunges"
  | "wall_balls";

/** Wie die Leistung einer Station gemessen wird. */
export type StationMetric = "time" | "reps";

export interface HyroxStation {
  /** Stabile ID (für Speicherung/Referenzen). */
  id: HyroxStationId;
  /** Reihenfolge im Rennen (1–8). */
  order: number;
  /** Anzeigename (Deutsch, Schweizer Schreibweise). */
  name: string;
  /** Kurzname für enge Ansichten (z. B. Radar/Charts). */
  shortName: string;
  /** Primäre Messgrösse der Station. */
  metric: StationMetric;
  /** Distanz in Metern, falls zutreffend. */
  distanceM?: number;
  /** Kurzbeschreibung der Ausführung. */
  description: string;
}

/**
 * Die 8 Stationen in fester Wettkampfreihenfolge.
 * Jeder Station geht ein 1-km-Lauf voraus (Lauf → Station).
 */
export const HYROX_STATIONS: readonly HyroxStation[] = [
  {
    id: "ski_erg",
    order: 1,
    name: "SkiErg 1000 m",
    shortName: "SkiErg",
    metric: "time",
    distanceM: 1000,
    description: "1000 m am SkiErg.",
  },
  {
    id: "sled_push",
    order: 2,
    name: "Sled Push 50 m",
    shortName: "Sled Push",
    metric: "time",
    distanceM: 50,
    description: "Schlitten über 50 m schieben (4 × 12,5 m).",
  },
  {
    id: "sled_pull",
    order: 3,
    name: "Sled Pull 50 m",
    shortName: "Sled Pull",
    metric: "time",
    distanceM: 50,
    description: "Schlitten über 50 m ziehen (4 × 12,5 m).",
  },
  {
    id: "burpee_broad_jumps",
    order: 4,
    name: "Burpee Broad Jumps 80 m",
    shortName: "Burpees",
    metric: "time",
    distanceM: 80,
    description: "Burpee Broad Jumps über 80 m.",
  },
  {
    id: "rowing",
    order: 5,
    name: "Rowing 1000 m",
    shortName: "Row",
    metric: "time",
    distanceM: 1000,
    description: "1000 m rudern.",
  },
  {
    id: "farmers_carry",
    order: 6,
    name: "Farmers Carry 200 m",
    shortName: "Farmers",
    metric: "time",
    distanceM: 200,
    description: "Kettlebells über 200 m tragen.",
  },
  {
    id: "sandbag_lunges",
    order: 7,
    name: "Sandbag Lunges 100 m",
    shortName: "Lunges",
    metric: "time",
    distanceM: 100,
    description: "Ausfallschritte mit Sandsack über 100 m.",
  },
  {
    id: "wall_balls",
    order: 8,
    name: "Wall Balls",
    shortName: "Wall Balls",
    metric: "reps",
    description: "Wall Balls: 100 Reps (Männer) bzw. 75 Reps (Frauen).",
  },
] as const;

/** Anzahl Läufe und Distanz je Lauf. */
export const RUN_SEGMENTS = 8;
export const RUN_DISTANCE_M = 1000;
export const TOTAL_RUN_DISTANCE_M = RUN_SEGMENTS * RUN_DISTANCE_M; // 8000 m

/** Wall-Ball-Wiederholungen nach Geschlecht (Open/Pro identisch, nur Gewicht variiert). */
export const WALL_BALL_REPS = {
  m: 100,
  f: 75,
  /** Divers: Standardwert; im Profil anpassbar. */
  d: 100,
} as const;

/**
 * Stationen mit relevantem Gewicht (Last in kg) – abhängig von der Division.
 * Für diese Stationen wird im Baseline-Assessment/Logging ein kg-Feld angeboten.
 */
export const STATIONS_WITH_LOAD: ReadonlySet<HyroxStationId> = new Set<HyroxStationId>([
  "sled_push",
  "sled_pull",
  "farmers_carry",
  "sandbag_lunges",
  "wall_balls",
]);

/** Schnellzugriff auf eine Station per ID. */
export function getStation(id: HyroxStationId): HyroxStation {
  const station = HYROX_STATIONS.find((s) => s.id === id);
  if (!station) throw new Error(`Unbekannte Station: ${id}`);
  return station;
}
