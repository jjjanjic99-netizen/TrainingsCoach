/**
 * Lauf-Coaching-Logik (reine Funktionen, keine UI/DB).
 *
 * Leitet aus einem Lauf-Test (Distanz + Zeit) einen VDOT ab (Jack Daniels)
 * und daraus Trainings-Pace-Zonen (Easy/Marathon/Threshold/Interval/
 * Repetition). Erzeugt konkrete Intervall-Workouts sowie eine
 * Wochenkilometer-Progression mit begrenzter Steigerung und Deload.
 */

import type { TrainingSession } from "@/lib/db/types";
import { sessionDistanceAndDuration, startOfWeekIso } from "@/lib/hyrox/stats";
import { getSessionTypeMeta, isRunCategory } from "@/lib/hyrox/sessions";

/* ------------------------------- VDOT ---------------------------------- */

/** VO₂-Kosten einer Geschwindigkeit v (m/min) nach Daniels. */
function velocityToVO2(v: number): number {
  return -4.6 + 0.182258 * v + 0.000104 * v * v;
}

/** Anteil von VO₂max, der über die Dauer t (min) gehalten werden kann. */
function fractionOfMax(tMin: number): number {
  return (
    0.8 +
    0.1894393 * Math.exp(-0.012778 * tMin) +
    0.2989558 * Math.exp(-0.1932605 * tMin)
  );
}

/** Kehrt velocityToVO2 um: Geschwindigkeit (m/min) für gegebenes VO₂. */
function vo2ToVelocity(vo2: number): number {
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.6 - vo2;
  const disc = b * b - 4 * a * c;
  return (-b + Math.sqrt(disc)) / (2 * a);
}

/** VDOT aus einem Lauf-Test (Distanz in m, Zeit in s). */
export function vdotFromRace(distanceM: number, timeSec: number): number | null {
  if (distanceM <= 0 || timeSec <= 0) return null;
  const tMin = timeSec / 60;
  const v = distanceM / tMin; // m/min
  const vo2 = velocityToVO2(v);
  return vo2 / fractionOfMax(tMin);
}

/** Pace (Sekunden/km) für eine Intensität (Anteil von VDOT). */
function paceForIntensity(vdot: number, fraction: number): number {
  const targetVO2 = fraction * vdot;
  const v = vo2ToVelocity(targetVO2); // m/min
  return 60000 / v; // s pro km
}

/* ---------------------------- Pace-Zonen ------------------------------- */

export type PaceZoneId =
  | "easy"
  | "marathon"
  | "threshold"
  | "interval"
  | "repetition";

export interface PaceZone {
  id: PaceZoneId;
  name: string;
  shortName: string;
  /** Repräsentative Pace in Sekunden/km. */
  secPerKm: number;
  /** Für „Easy" ein zusätzlicher, langsamerer Wert (Bereich). */
  secPerKmSlow?: number;
  purpose: string;
}

/** Intensitäten (Anteil von VDOT) je Zone. */
const ZONE_INTENSITY: Record<PaceZoneId, number> = {
  easy: 0.72,
  marathon: 0.84,
  threshold: 0.88,
  interval: 0.975,
  repetition: 1.05,
};

const ZONE_META: Record<PaceZoneId, { name: string; shortName: string; purpose: string }> = {
  easy: {
    name: "Easy (E)",
    shortName: "E",
    purpose: "Ruhig – Grundlage & Regeneration, Gespräch möglich.",
  },
  marathon: {
    name: "Marathon (M)",
    shortName: "M",
    purpose: "Langes, ökonomisches Renntempo für lange Läufe.",
  },
  threshold: {
    name: "Threshold (T)",
    shortName: "T",
    purpose: "Schwelle – Tempohärte, komfortabel hart (Cruise/Tempo).",
  },
  interval: {
    name: "Interval (I)",
    shortName: "I",
    purpose: "VO₂max – harte 3–5-min-Intervalle.",
  },
  repetition: {
    name: "Repetition (R)",
    shortName: "R",
    purpose: "Schnelligkeit & Ökonomie – kurze, schnelle Wiederholungen.",
  },
};

export interface PaceZones {
  vdot: number;
  basis: { distanceM: number; timeSec: number; secPerKm: number };
  zones: PaceZone[];
}

/** Berechnet VDOT und alle Pace-Zonen aus einem Lauf-Test. */
export function computePaceZones(
  distanceM: number,
  timeSec: number,
): PaceZones | null {
  const vdot = vdotFromRace(distanceM, timeSec);
  if (vdot == null || !Number.isFinite(vdot)) return null;

  const zones: PaceZone[] = (Object.keys(ZONE_INTENSITY) as PaceZoneId[]).map(
    (id) => {
      const secPerKm = paceForIntensity(vdot, ZONE_INTENSITY[id]);
      const zone: PaceZone = {
        id,
        name: ZONE_META[id].name,
        shortName: ZONE_META[id].shortName,
        secPerKm,
        purpose: ZONE_META[id].purpose,
      };
      if (id === "easy") {
        zone.secPerKmSlow = paceForIntensity(vdot, 0.65);
      }
      return zone;
    },
  );

  return {
    vdot: Math.round(vdot * 10) / 10,
    basis: { distanceM, timeSec, secPerKm: (timeSec / distanceM) * 1000 },
    zones,
  };
}

export function getZone(zones: PaceZones, id: PaceZoneId): PaceZone {
  const z = zones.zones.find((x) => x.id === id);
  if (!z) throw new Error(`Zone ${id} fehlt`);
  return z;
}

/* -------------------------- Intervall-Workouts ------------------------- */

export interface RunWorkout {
  id: string;
  title: string;
  zone: PaceZoneId;
  /** Gesamter Netto-Laufumfang in Metern (ohne Pausen). */
  totalM: number;
  description: string;
  /** Zielzeit je Wiederholung (Sekunden), falls sinnvoll. */
  repTargetSec?: number;
  repLabel?: string;
}

/** Erzeugt konkrete Intervall-Workouts aus den Pace-Zonen. */
export function generateWorkouts(zones: PaceZones): RunWorkout[] {
  const t = getZone(zones, "threshold").secPerKm;
  const i = getZone(zones, "interval").secPerKm;
  const r = getZone(zones, "repetition").secPerKm;

  return [
    {
      id: "cruise",
      title: "Schwellen-Intervalle (Cruise)",
      zone: "threshold",
      totalM: 4 * 1500,
      description:
        "4× 1500 m im T-Tempo mit je 60 s Trabpause. 10–15 min ein- und auslaufen.",
      repTargetSec: Math.round(t * 1.5),
      repLabel: "je 1500 m",
    },
    {
      id: "vo2",
      title: "VO₂max-Intervalle",
      zone: "interval",
      totalM: 5 * 1000,
      description:
        "5× 1000 m im I-Tempo mit je 3 min Trabpause. Sauber und gleichmässig laufen.",
      repTargetSec: Math.round(i * 1.0),
      repLabel: "je 1000 m",
    },
    {
      id: "reps",
      title: "Wiederholungen (Schnelligkeit)",
      zone: "repetition",
      totalM: 8 * 400,
      description:
        "8× 400 m im R-Tempo mit voller Erholung (400 m Trab). Locker und schnell.",
      repTargetSec: Math.round(r * 0.4),
      repLabel: "je 400 m",
    },
  ];
}

/* --------------------- Wochenkilometer-Progression --------------------- */

export interface MileageWeek {
  week: number;
  km: number;
  deload: boolean;
}

/**
 * Progression der Wochenkilometer: ~10 %/Woche Steigerung, jede 4. Woche
 * Deload (−20 %). Reine Empfehlung mit sinnvoller Steigerungsbegrenzung.
 */
export function mileageProgression(startKm: number, weeks: number): MileageWeek[] {
  const result: MileageWeek[] = [];
  const w = Math.min(16, Math.max(1, Math.round(weeks)));
  let current = Math.max(1, startKm);
  for (let i = 1; i <= w; i++) {
    const deload = i % 4 === 0;
    if (deload) {
      result.push({ week: i, km: Math.round(current * 0.8), deload: true });
    } else {
      result.push({ week: i, km: Math.round(current), deload: false });
      current = current * 1.1;
    }
  }
  return result;
}

/**
 * Repräsentative aktuelle Wochenkilometer aus geloggten Lauf-/Hybrid-Einheiten
 * (jüngste Woche mit Laufanteil). 0, wenn keine Laufdaten vorhanden.
 */
export function recentWeeklyRunKm(sessions: TrainingSession[]): number {
  const byWeek = new Map<string, number>();
  for (const s of sessions) {
    if (!isRunCategory(getSessionTypeMeta(s.type).category)) continue;
    const { distanceM } = sessionDistanceAndDuration(s);
    if (distanceM <= 0) continue;
    const week = startOfWeekIso(s.date);
    byWeek.set(week, (byWeek.get(week) ?? 0) + distanceM);
  }
  if (byWeek.size === 0) return 0;
  const latest = Array.from(byWeek.keys()).sort().reverse()[0];
  return Math.round((byWeek.get(latest) ?? 0) / 1000);
}
