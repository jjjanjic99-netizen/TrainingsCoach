/**
 * Hyrox-Divisionen. Reihenfolge und Distanzen sind weltweit identisch,
 * nur die Gewichte (Sled, Kettlebells, Sandsack, Wall Ball) unterscheiden
 * sich je Division. Die konkreten Kilogramm-Werte werden in einer späteren
 * Ausbaustufe (Zielsplits/Prognose) ergänzt – hier wird zunächst die
 * Auswahl im Profil abgebildet.
 */

export type DivisionId = "open" | "pro" | "doubles" | "relay";

export interface Division {
  id: DivisionId;
  name: string;
  description: string;
}

export const DIVISIONS: readonly Division[] = [
  {
    id: "open",
    name: "Open",
    description: "Standardgewichte – der übliche Einstieg.",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Höhere Gewichte für erfahrene Athletinnen und Athleten.",
  },
  {
    id: "doubles",
    name: "Doubles",
    description: "Zu zweit – Stationen und Läufe werden geteilt.",
  },
  {
    id: "relay",
    name: "Relay",
    description: "Staffel im Team – jede Person übernimmt einen Abschnitt.",
  },
] as const;

/** Trainingslevel – steuert später Plan-Generierung und Zielwerte. */
export type LevelId = "beginner" | "intermediate" | "competition";

export interface Level {
  id: LevelId;
  name: string;
  description: string;
}

export const LEVELS: readonly Level[] = [
  {
    id: "beginner",
    name: "Einsteiger",
    description: "Erstes Hyrox oder Wiedereinstieg – Grundlagen aufbauen.",
  },
  {
    id: "intermediate",
    name: "Fortgeschritten",
    description: "Solide Basis – gezielt schneller werden.",
  },
  {
    id: "competition",
    name: "Wettkampf",
    description: "Leistungsorientiert – auf eine Zielzeit hin trainieren.",
  },
] as const;

/** Geschlecht (für Wall-Ball-Reps und Benchmarks). */
export type Sex = "m" | "f" | "d";

export const SEX_OPTIONS: readonly { id: Sex; name: string }[] = [
  { id: "m", name: "Männlich" },
  { id: "f", name: "Weiblich" },
  { id: "d", name: "Divers" },
] as const;
