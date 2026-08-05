/**
 * Import von Watch-/Workout-Daten (CSV oder JSON), reine Logik.
 *
 * Hintergrund: In einer PWA gibt es keinen Live-Zugriff auf Apple Watch /
 * HealthKit. Stattdessen liest dieser Parser exportierte Workout-Daten mit
 * klar dokumentiertem Schema (Datum, Dauer, Distanz, Ø-/Max-HF, Splits) ein,
 * damit sie als neue Einheit angelegt oder einer bestehenden zugeordnet
 * werden können. Manuelle Eingabe bleibt jederzeit möglich.
 */

import type { RunSplit, SessionType } from "@/lib/db/types";
import { SESSION_TYPES } from "@/lib/hyrox/sessions";
import { parseDurationInput, parseNumberInput } from "@/lib/format";

export interface ParsedWorkout {
  date: string; // ISO YYYY-MM-DD
  type?: SessionType;
  durationSeconds?: number;
  distanceM?: number;
  avgHr?: number;
  maxHr?: number;
  notes?: string;
  splits?: RunSplit[];
}

export interface ParseResult {
  workouts: ParsedWorkout[];
  /** Zeilen-/Eintragsfehler (1-basierte Beschreibung). */
  errors: string[];
}

/* --------------------------- Feld-Zuordnung ---------------------------- */

const VALID_TYPES = new Set(SESSION_TYPES.map((t) => t.id));

/** Alias-Namen -> Session-Typ. */
const TYPE_ALIASES: Record<string, SessionType> = {
  run: "easy_run",
  running: "easy_run",
  lauf: "easy_run",
  easy: "easy_run",
  easy_run: "easy_run",
  tempo: "tempo_run",
  tempo_run: "tempo_run",
  threshold: "tempo_run",
  schwelle: "tempo_run",
  interval: "interval_run",
  intervals: "interval_run",
  intervalle: "interval_run",
  interval_run: "interval_run",
  long: "long_run",
  long_run: "long_run",
  longrun: "long_run",
  strength: "strength",
  kraft: "strength",
  station: "station_specific",
  station_specific: "station_specific",
  compromised: "compromised_run",
  compromised_run: "compromised_run",
  hybrid: "compromised_run",
  race: "race_simulation",
  race_simulation: "race_simulation",
  other: "other",
};

/** Header-Aliase je kanonischem Feld (normalisiert: klein, nicht-alnum -> _). */
const FIELD_ALIASES: Record<string, string[]> = {
  date: ["date", "datum", "day"],
  type: ["type", "typ", "art", "workout", "sport"],
  duration: ["duration", "dauer", "time", "zeit", "elapsed"],
  distanceM: ["distance_m", "distance", "distanz", "distanz_m", "meters", "m", "strecke"],
  distanceKm: ["distance_km", "distanz_km", "km"],
  avgHr: ["avg_hr", "avghr", "hf_avg", "avg_heart_rate", "heart_rate_avg", "avg_bpm", "hf"],
  maxHr: ["max_hr", "maxhr", "hf_max", "max_heart_rate", "max_bpm"],
  notes: ["notes", "notizen", "note", "kommentar", "comment"],
};

function normalizeKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/ø/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function resolveType(raw: string | undefined): SessionType | undefined {
  if (!raw) return undefined;
  const key = normalizeKey(raw);
  if (VALID_TYPES.has(key as SessionType)) return key as SessionType;
  return TYPE_ALIASES[key];
}

/** Datum in verschiedenen Formaten -> ISO YYYY-MM-DD (oder null). */
export function parseFlexibleDate(input: string | undefined | null): string | null {
  if (!input) return null;
  const s = String(input).trim();
  if (s === "") return null;
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const deMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (deMatch) {
    const [, d, m, y] = deMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

/* ------------------------------ CSV-Teil ------------------------------- */

function detectDelimiter(line: string): string {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestCount = -1;
  for (const c of candidates) {
    const count = line.split(c).length;
    if (count > bestCount) {
      bestCount = count;
      best = c;
    }
  }
  return best;
}

/** Zerlegt eine CSV-Zeile unter Beachtung von Anführungszeichen. */
function splitCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function parseCsv(text: string): ParseResult {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim() !== "");
  if (lines.length < 2) {
    return { workouts: [], errors: ["CSV enthält keine Datenzeilen."] };
  }

  const delimiter = detectDelimiter(lines[0]);
  const header = splitCsvLine(lines[0], delimiter).map(normalizeKey);

  // Header -> kanonisches Feld
  const colIndex: Record<string, number> = {};
  header.forEach((h, idx) => {
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.includes(h)) colIndex[field] = idx;
    }
  });

  const workouts: ParsedWorkout[] = [];
  const errors: string[] = [];

  for (let r = 1; r < lines.length; r++) {
    const cells = splitCsvLine(lines[r], delimiter);
    const get = (field: string) =>
      colIndex[field] != null ? cells[colIndex[field]] : undefined;

    const date = parseFlexibleDate(get("date"));
    if (!date) {
      errors.push(`Zeile ${r + 1}: gültiges Datum fehlt.`);
      continue;
    }

    const distanceKm = parseNumberInput(get("distanceKm"));
    const distanceM =
      distanceKm != null ? Math.round(distanceKm * 1000) : parseNumberInput(get("distanceM")) ?? undefined;

    const w: ParsedWorkout = { date };
    const type = resolveType(get("type"));
    if (type) w.type = type;
    const dur = parseDurationInput(get("duration"));
    if (dur != null) w.durationSeconds = dur;
    if (distanceM != null) w.distanceM = distanceM;
    const avg = parseNumberInput(get("avgHr"));
    if (avg != null) w.avgHr = Math.round(avg);
    const max = parseNumberInput(get("maxHr"));
    if (max != null) w.maxHr = Math.round(max);
    const notes = get("notes");
    if (notes) w.notes = notes;
    workouts.push(w);
  }

  return { workouts, errors };
}

/* ------------------------------ JSON-Teil ------------------------------ */

function normalizeSplits(value: unknown): RunSplit[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const splits: RunSplit[] = [];
  for (const s of value) {
    if (!s || typeof s !== "object") continue;
    const o = s as Record<string, unknown>;
    const distanceM =
      parseNumberInput(String(o.distanceM ?? o.distance ?? o.distanz ?? "")) ?? undefined;
    const durRaw = o.durationSeconds ?? o.duration ?? o.dauer ?? o.zeit;
    const durationSeconds = parseDurationInput(
      typeof durRaw === "number" ? String(durRaw) : (durRaw as string | undefined),
    );
    if (distanceM != null && durationSeconds != null) {
      splits.push({ distanceM, durationSeconds });
    }
  }
  return splits.length ? splits : undefined;
}

function parseJsonWorkouts(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { workouts: [], errors: ["Ungültiges JSON."] };
  }
  const arr = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).workouts)
      ? ((data as Record<string, unknown>).workouts as unknown[])
      : null;
  if (!arr) {
    return {
      workouts: [],
      errors: ["JSON muss ein Array von Workouts oder { workouts: [...] } sein."],
    };
  }

  const workouts: ParsedWorkout[] = [];
  const errors: string[] = [];
  arr.forEach((item, idx) => {
    if (!item || typeof item !== "object") {
      errors.push(`Eintrag ${idx + 1}: kein Objekt.`);
      return;
    }
    const o = item as Record<string, unknown>;
    const date = parseFlexibleDate(String(o.date ?? o.datum ?? ""));
    if (!date) {
      errors.push(`Eintrag ${idx + 1}: gültiges Datum fehlt.`);
      return;
    }
    const w: ParsedWorkout = { date };
    const type = resolveType(typeof o.type === "string" ? o.type : undefined);
    if (type) w.type = type;

    const durRaw = o.durationSeconds ?? o.duration ?? o.dauer;
    const dur = parseDurationInput(
      typeof durRaw === "number" ? String(durRaw) : (durRaw as string | undefined),
    );
    if (dur != null) w.durationSeconds = dur;

    const km = parseNumberInput(String(o.distanceKm ?? ""));
    const distanceM =
      km != null ? Math.round(km * 1000) : parseNumberInput(String(o.distanceM ?? o.distance ?? "")) ?? undefined;
    if (distanceM != null) w.distanceM = distanceM;

    const avg = parseNumberInput(String(o.avgHr ?? o.avg_hr ?? ""));
    if (avg != null) w.avgHr = Math.round(avg);
    const max = parseNumberInput(String(o.maxHr ?? o.max_hr ?? ""));
    if (max != null) w.maxHr = Math.round(max);
    if (typeof o.notes === "string" && o.notes.trim()) w.notes = o.notes.trim();

    const splits = normalizeSplits(o.splits);
    if (splits) w.splits = splits;

    workouts.push(w);
  });

  return { workouts, errors };
}

/* ------------------------------ Dispatch ------------------------------- */

export type ImportFormat = "csv" | "json" | "auto";

/** Erkennt CSV vs. JSON und parst entsprechend. */
export function parseWorkouts(text: string, format: ImportFormat = "auto"): ParseResult {
  const trimmed = text.trim();
  if (trimmed === "") return { workouts: [], errors: ["Keine Daten."] };
  const isJson = format === "json" || (format === "auto" && /^[[{]/.test(trimmed));
  return isJson ? parseJsonWorkouts(trimmed) : parseCsv(trimmed);
}

/* --------------------------- Beispiele / Doku -------------------------- */

export const CSV_EXAMPLE = `date,type,duration,distance,avg_hr,max_hr,notes
2026-08-01,easy_run,00:42:30,8000,142,156,Lockerer Dauerlauf
2026-08-03,tempo_run,00:35:00,7500,165,178,4x 1km Schwelle`;

export const JSON_EXAMPLE = `[
  {
    "date": "2026-08-01",
    "type": "long_run",
    "durationSeconds": 5400,
    "distanceM": 15000,
    "avgHr": 148,
    "maxHr": 165,
    "notes": "Long Run",
    "splits": [
      { "distanceM": 1000, "durationSeconds": 350 },
      { "distanceM": 1000, "durationSeconds": 345 }
    ]
  }
]`;
