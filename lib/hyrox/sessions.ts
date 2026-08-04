/**
 * Metadaten zu den Trainings-Typen (Labels, Kategorie).
 * Zentraler Ort für Anzeige und Filterung von Einheiten.
 */

import type { SessionType } from "@/lib/db/types";

export type SessionCategory = "run" | "strength" | "hybrid" | "other";

export interface SessionTypeMeta {
  id: SessionType;
  label: string;
  /** Kurzbeschreibung (Hilfetext im Formular). */
  hint: string;
  category: SessionCategory;
}

export const SESSION_TYPES: readonly SessionTypeMeta[] = [
  {
    id: "easy_run",
    label: "Easy Run",
    hint: "Lockerer Dauerlauf im Wohlfühltempo.",
    category: "run",
  },
  {
    id: "tempo_run",
    label: "Tempo / Schwelle",
    hint: "Zügiger Lauf an der Schwelle.",
    category: "run",
  },
  {
    id: "interval_run",
    label: "Intervalle",
    hint: "Schnelle Abschnitte mit Pausen.",
    category: "run",
  },
  {
    id: "long_run",
    label: "Long Run",
    hint: "Langer Dauerlauf für die Grundlage.",
    category: "run",
  },
  {
    id: "strength",
    label: "Kraft",
    hint: "Krafttraining (Beine, Rumpf, Gesamtkörper).",
    category: "strength",
  },
  {
    id: "station_specific",
    label: "Stationstraining",
    hint: "Gezielt an einzelnen Hyrox-Stationen.",
    category: "strength",
  },
  {
    id: "compromised_run",
    label: "Compromised Running",
    hint: "Lauf + Station im Wechsel – die Hyrox-Schlüsselfähigkeit.",
    category: "hybrid",
  },
  {
    id: "race_simulation",
    label: "Renntempo-Simulation",
    hint: "Renntempo über mehrere Läufe/Stationen.",
    category: "hybrid",
  },
  {
    id: "other",
    label: "Sonstiges",
    hint: "Andere Einheit (z. B. Mobility, Radfahren).",
    category: "other",
  },
] as const;

const BY_ID = new Map(SESSION_TYPES.map((t) => [t.id, t]));

export function getSessionTypeMeta(id: SessionType): SessionTypeMeta {
  return BY_ID.get(id) ?? SESSION_TYPES[SESSION_TYPES.length - 1];
}

export function sessionTypeLabel(id: SessionType): string {
  return getSessionTypeMeta(id).label;
}

/** Enthält diese Einheitenkategorie typischerweise Laufanteile? */
export function isRunCategory(category: SessionCategory): boolean {
  return category === "run" || category === "hybrid";
}
