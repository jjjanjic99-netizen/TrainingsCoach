/**
 * Trainingsplan-Generator (reine Logik, keine UI/DB).
 *
 * Erzeugt einen periodisierten Plan (Base → Build → Peak → Taper) nach
 * „Wochen bis Rennen" und Level. Jede Woche enthält Lauf-Einheiten
 * (Easy/Tempo/Intervall/Long), Kraft-/Stationstraining, Compromised-Running
 * (die Hyrox-Schlüsselfähigkeit) und – in Peak/Taper – Renntempo-Simulationen.
 * Progressive Steigerung mit regelmässigen Deload-Wochen.
 */

import type { SessionType } from "@/lib/db/types";
import type { LevelId } from "@/lib/hyrox/divisions";

export const PLAN_ID = "active" as const;

export type PlanPhase = "base" | "build" | "peak" | "taper";

export const PHASE_LABELS: Record<PlanPhase, string> = {
  base: "Base",
  build: "Build",
  peak: "Peak",
  taper: "Taper",
};

export const WEEKDAY_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;
export const WEEKDAY_LONG = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
] as const;

/** Eine geplante Einheit innerhalb einer Woche. */
export interface PlanSession {
  /** Stabile ID (z. B. "w2-3"), Referenz für Abhaken/Persistenz. */
  id: string;
  /** Wochentag 0=Mo … 6=So. */
  day: number;
  type: SessionType;
  title: string;
  description: string;
  targetDistanceM?: number;
  targetDurationSeconds?: number;
  done?: boolean;
  completedDate?: string;
}

export interface PlanWeek {
  index: number; // 0-basiert
  weekNumber: number; // 1-basiert
  phase: PlanPhase;
  deload: boolean;
  startDateIso: string; // Montag der Woche
  focus: string;
  sessions: PlanSession[];
}

export interface TrainingPlan {
  id: string; // PLAN_ID
  createdAt: string;
  level: LevelId;
  startDateIso: string;
  raceDateIso?: string;
  weeks: PlanWeek[];
}

/* ----------------------------- Datum-Helfer ---------------------------- */

function mondayOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const day = (d.getDay() + 6) % 7; // Mo=0 … So=6
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/* --------------------------- Phasen-Verteilung ------------------------- */

/** Bestimmt die Phase je Woche (Länge = weeks). */
function buildPhases(weeks: number): PlanPhase[] {
  const w = Math.max(4, weeks);
  const taper = w >= 12 ? 2 : 1;
  const rem = w - taper;
  let peak = Math.max(1, Math.round(w * 0.15));
  let build = Math.max(1, Math.round(w * 0.3));
  let base = rem - peak - build;
  // Rundungsfehler ausgleichen, jede Phase mindestens 1 Woche.
  if (base < 1) {
    base = 1;
    build = Math.max(1, rem - base - peak);
    if (rem - base - build < 1) peak = Math.max(1, rem - base - build);
  }
  base = rem - peak - build; // Summe garantieren
  if (base < 1) base = 1;

  const phases: PlanPhase[] = [];
  for (let i = 0; i < base; i++) phases.push("base");
  for (let i = 0; i < build; i++) phases.push("build");
  for (let i = 0; i < peak; i++) phases.push("peak");
  for (let i = 0; i < taper; i++) phases.push("taper");
  // Falls Rundung die Länge verändert hat, auf `weeks` trimmen/auffüllen.
  while (phases.length > w) phases.pop();
  while (phases.length < w) phases.splice(phases.length - taper, 0, "peak");
  return phases;
}

/* ----------------------- Wochen-Vorlagen (Rollen) ---------------------- */

type Role =
  | "easy"
  | "long"
  | "tempo"
  | "interval"
  | "strength"
  | "station"
  | "compromised"
  | "raceSim";

/** Einheiten je Level und Phase, in Wochentag-Reihenfolge. */
const TEMPLATES: Record<LevelId, Record<PlanPhase, Role[]>> = {
  beginner: {
    base: ["strength", "easy", "compromised", "long"],
    build: ["tempo", "strength", "compromised", "long"],
    peak: ["interval", "compromised", "raceSim", "long"],
    taper: ["easy", "compromised", "tempo", "raceSim"],
  },
  intermediate: {
    base: ["easy", "strength", "tempo", "compromised", "long"],
    build: ["tempo", "strength", "interval", "compromised", "long"],
    peak: ["interval", "strength", "compromised", "raceSim", "long"],
    taper: ["easy", "tempo", "compromised", "easy", "raceSim"],
  },
  competition: {
    base: ["easy", "strength", "tempo", "station", "compromised", "long"],
    build: ["tempo", "strength", "interval", "station", "compromised", "long"],
    peak: ["tempo", "interval", "station", "compromised", "raceSim", "long"],
    taper: ["easy", "tempo", "compromised", "station", "raceSim", "easy"],
  },
};

/** Wochentage je Level (passend zur Anzahl Einheiten). */
const DAYS: Record<LevelId, number[]> = {
  beginner: [0, 2, 4, 6],
  intermediate: [0, 1, 3, 4, 6],
  competition: [0, 1, 2, 4, 5, 6],
};

/** Distanz-Eckwerte (m) je Level. */
const LEVEL_DIST: Record<
  LevelId,
  { easyBase: number; easyCap: number; longBase: number; longCap: number }
> = {
  beginner: { easyBase: 5000, easyCap: 7000, longBase: 8000, longCap: 14000 },
  intermediate: { easyBase: 7000, easyCap: 9000, longBase: 12000, longCap: 20000 },
  competition: { easyBase: 8000, easyCap: 10000, longBase: 15000, longCap: 24000 },
};

const FOCUS: Record<PlanPhase, string> = {
  base: "Grundlage & Umfang",
  build: "Tempohärte & Hyrox-Spezifik",
  peak: "Renntempo & Schärfe",
  taper: "Erholen & Spritzigkeit",
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const round500 = (m: number) => Math.round(m / 500) * 500;

interface BuildCtx {
  weekIndex: number;
  sessionIdx: number;
  day: number;
  deload: boolean;
  easyDist: number;
  longDist: number;
}

/** Baut aus einer Rolle eine konkrete geplante Einheit. */
function buildSession(role: Role, ctx: BuildCtx): PlanSession {
  const id = `w${ctx.weekIndex}-${ctx.sessionIdx}`;
  const base = { id, day: ctx.day, done: false };
  const deloadNote = ctx.deload ? " Deload: Intensität zurücknehmen." : "";

  switch (role) {
    case "easy":
      return {
        ...base,
        type: "easy_run" as SessionType,
        title: "Easy Run",
        description: "Lockeres Grundlagentempo, Gespräch möglich.",
        targetDistanceM: ctx.easyDist,
      };
    case "long":
      return {
        ...base,
        type: "long_run" as SessionType,
        title: "Long Run",
        description: "Ruhiges Tempo, langer Dauerlauf für die Grundlage.",
        targetDistanceM: ctx.longDist,
      };
    case "tempo":
      return {
        ...base,
        type: "tempo_run" as SessionType,
        title: "Tempo / Schwelle",
        description:
          "Einlaufen, dann 20–30 min an der Schwelle (zügig, kontrolliert), auslaufen." +
          deloadNote,
      };
    case "interval":
      return {
        ...base,
        type: "interval_run" as SessionType,
        title: "Intervalle",
        description: "z. B. 6× 800 m schnell / 200 m Trabpause." + deloadNote,
      };
    case "strength":
      return {
        ...base,
        type: "strength" as SessionType,
        title: "Kraft",
        description: "Beine, Rumpf, Zug/Druck – 45–60 min, sauber ausführen.",
      };
    case "station":
      return {
        ...base,
        type: "station_specific" as SessionType,
        title: "Stationstraining",
        description:
          "Schwächste Stationen gezielt üben (Technik + Kraftausdauer, z. B. Wall Balls, Sled, Burpees).",
      };
    case "compromised":
      return {
        ...base,
        type: "compromised_run" as SessionType,
        title: "Compromised Running",
        description:
          "Lauf + Station im Wechsel ohne Pause, z. B. 4–6× (1 km Lauf + 1 Station)." +
          deloadNote,
      };
    case "raceSim":
      return {
        ...base,
        type: "race_simulation" as SessionType,
        title: "Renntempo-Simulation",
        description:
          "Teil-Simulation im Zieltempo, z. B. 4× (1 km Lauf + Station) im Renntempo." +
          deloadNote,
      };
  }
}

/* ------------------------------ Generator ------------------------------ */

export interface GeneratePlanOptions {
  weeks: number;
  level: LevelId;
  /** Startdatum (wird auf den Montag der Woche normalisiert). */
  startDateIso: string;
  raceDateIso?: string;
}

/** Erzeugt einen periodisierten Trainingsplan. */
export function generatePlan(opts: GeneratePlanOptions): TrainingPlan {
  const weeks = Math.min(24, Math.max(4, Math.round(opts.weeks)));
  const phases = buildPhases(weeks);
  const dist = LEVEL_DIST[opts.level];
  const start = mondayOf(opts.startDateIso);

  const nonTaperTotal = phases.filter((p) => p !== "taper").length;
  let progOrdinal = 0;
  let taperOrdinal = 0;

  const planWeeks: PlanWeek[] = phases.map((phase, i) => {
    const weekNumber = i + 1;
    const deload = phase !== "taper" && weekNumber % 4 === 0;

    let easyDist: number;
    let longDist: number;
    if (phase !== "taper") {
      const p = nonTaperTotal > 1 ? progOrdinal / (nonTaperTotal - 1) : 1;
      easyDist = lerp(dist.easyBase, dist.easyCap, p);
      longDist = lerp(dist.longBase, dist.longCap, p);
      if (deload) {
        easyDist *= 0.8;
        longDist *= 0.65;
      }
      progOrdinal++;
    } else {
      taperOrdinal++;
      const shrink = taperOrdinal === 1 ? 0.6 : 0.4;
      easyDist = dist.easyBase * 0.8;
      longDist = dist.longBase * shrink;
    }
    easyDist = round500(easyDist);
    longDist = round500(longDist);

    const roles = TEMPLATES[opts.level][phase];
    const days = DAYS[opts.level];
    const sessions = roles.map((role, idx) =>
      buildSession(role, {
        weekIndex: i,
        sessionIdx: idx,
        day: days[idx] ?? idx,
        deload,
        easyDist,
        longDist,
      }),
    );

    return {
      index: i,
      weekNumber,
      phase,
      deload,
      startDateIso: addDaysIso(start, i * 7),
      focus: FOCUS[phase] + (deload ? " · Deload" : ""),
      sessions,
    };
  });

  return {
    id: PLAN_ID,
    createdAt: new Date().toISOString(),
    level: opts.level,
    startDateIso: start,
    raceDateIso: opts.raceDateIso,
    weeks: planWeeks,
  };
}

/** Index der Woche, die das gegebene Datum enthält (begrenzt auf Plangrenzen). */
export function currentWeekIndex(plan: TrainingPlan, todayIso: string): number {
  const startMon = new Date(`${plan.startDateIso}T00:00:00`).getTime();
  const todayMon = new Date(`${mondayOf(todayIso)}T00:00:00`).getTime();
  const diffWeeks = Math.floor((todayMon - startMon) / (7 * 24 * 3600 * 1000));
  return Math.min(plan.weeks.length - 1, Math.max(0, diffWeeks));
}

/** Fortschritt (erledigte/gesamt) über eine Woche. */
export function weekProgress(week: PlanWeek): { done: number; total: number } {
  return {
    done: week.sessions.filter((s) => s.done).length,
    total: week.sessions.length,
  };
}
