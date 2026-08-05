/**
 * Recovery/Readiness-Logik (reine Funktionen).
 *
 * Aus dem täglichen Kurz-Input (Schlaf, Muskelkater, Motivation – je 1–5)
 * wird ein Readiness-Score abgeleitet und eine einfache Empfehlung gegeben
 * (bis hin zu einer Deload-/Erholungs-Empfehlung).
 */

import type { ReadinessEntry } from "@/lib/db/types";

/** Score eines Eintrags (1–5). Muskelkater wird invertiert (5 = frisch). */
export function entryScore(e: ReadinessEntry): number | null {
  const parts: number[] = [];
  if (e.sleepQuality != null) parts.push(e.sleepQuality);
  if (e.soreness != null) parts.push(6 - e.soreness);
  if (e.motivation != null) parts.push(e.motivation);
  if (parts.length === 0) return null;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

export type ReadinessLevel = "good" | "ok" | "low";

export interface ReadinessAdvice {
  /** Durchschnittlicher Score der jüngsten Einträge (oder null). */
  avg: number | null;
  level: ReadinessLevel;
  title: string;
  recommendation: string;
}

/**
 * Empfehlung aus den jüngsten (bis zu 3) Einträgen.
 * `entries` sollte nach Datum absteigend sortiert sein.
 */
export function readinessAdvice(entries: ReadinessEntry[]): ReadinessAdvice {
  const scores = entries
    .slice(0, 3)
    .map(entryScore)
    .filter((s): s is number => s != null);

  if (scores.length === 0) {
    return {
      avg: null,
      level: "ok",
      title: "Noch keine Daten",
      recommendation:
        "Erfasse deinen Zustand ein paar Tage, dann gibt es eine Empfehlung.",
    };
  }

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  if (avg >= 4) {
    return {
      avg,
      level: "good",
      title: "Gut erholt",
      recommendation:
        "Grünes Licht – die geplante Einheit kann wie vorgesehen (oder etwas härter) laufen.",
    };
  }
  if (avg >= 3) {
    return {
      avg,
      level: "ok",
      title: "Solide",
      recommendation:
        "Trainiere wie geplant, aber achte aufs Aufwärmen und höre in dich hinein.",
    };
  }
  return {
    avg,
    level: "low",
    title: "Erholung empfohlen",
    recommendation:
      "Mehrere Tage niedrige Readiness. Nimm den Umfang zurück oder schiebe einen Deload-/Ruhetag ein.",
  };
}

/** Anzeige-Labels für die 1–5-Skalen. */
export const SLEEP_LABEL = "Schlaf";
export const SORENESS_LABEL = "Muskelkater";
export const MOTIVATION_LABEL = "Motivation";
