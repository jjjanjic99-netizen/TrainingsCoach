/**
 * Zentrale Dexie-Datenbank (IndexedDB).
 *
 * Kein Backend – alle Daten liegen lokal auf dem Gerät. Diese Datei ist der
 * einzige Ort, der Dexie kennt; Zugriff erfolgt ausschliesslich über die
 * Repositories (`lib/db/repositories.ts`) und Hooks (`lib/hooks/*`).
 */

import Dexie, { type Table } from "dexie";
import type {
  Assessment,
  PersonalRecord,
  Profile,
  ReadinessEntry,
  TrainingSession,
} from "./types";
import type { TrainingPlan } from "@/lib/hyrox/plan";

export class HyroxDatabase extends Dexie {
  // Tabellen (typisiert)
  profiles!: Table<Profile, string>;
  personalRecords!: Table<PersonalRecord, number>;
  sessions!: Table<TrainingSession, number>;
  assessments!: Table<Assessment, number>;
  readiness!: Table<ReadinessEntry, string>;
  plans!: Table<TrainingPlan, string>;

  constructor() {
    super("hyrox-coach");

    // Schema-Version 1. Nur indizierte Felder werden hier gelistet;
    // weitere Felder werden als Objekt gespeichert. Spätere Ausbaustufen
    // erhöhen die Version und migrieren bei Bedarf.
    this.version(1).stores({
      profiles: "id",
      personalRecords: "++id, stationId, date",
      sessions: "++id, date, type",
      assessments: "++id, date",
      readiness: "date",
    });

    // Version 2: Trainingsplan (Stufe 3). Bestehende Tabellen bleiben
    // unverändert; nur die neue Tabelle wird ergänzt.
    this.version(2).stores({
      plans: "id",
    });
  }
}

/**
 * Singleton-Instanz. Dexie öffnet die IndexedDB erst beim ersten Zugriff,
 * daher ist das blosse Anlegen auch beim serverseitigen Rendern unkritisch;
 * echte DB-Operationen finden nur im Browser statt (Client-Hooks).
 */
export const db = new HyroxDatabase();

/** Namen aller Tabellen (für generischen Export/Import). */
export const TABLE_NAMES = [
  "profiles",
  "personalRecords",
  "sessions",
  "assessments",
  "readiness",
  "plans",
] as const;
