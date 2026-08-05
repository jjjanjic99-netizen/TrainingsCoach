"use client";

/**
 * React-Hooks über die Datenschicht.
 *
 * Nutzen `useLiveQuery` von dexie-react-hooks: die Komponenten aktualisieren
 * sich automatisch, sobald sich Daten in IndexedDB ändern. Server-seitig
 * liefern die Hooks `undefined` (keine IndexedDB) – die UI behandelt das
 * als Ladezustand.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import {
  getActivePlan,
  getLatestAssessment,
  getProfile,
  getSession,
  listPersonalRecords,
  listSessions,
} from "@/lib/db/repositories";

/** Aktuelles Profil (oder undefined, solange nicht geladen/vorhanden). */
export function useProfile() {
  return useLiveQuery(() => getProfile(), []);
}

/** Alle Trainingseinheiten, neueste zuerst. */
export function useSessions() {
  return useLiveQuery(() => listSessions(), []);
}

/**
 * Einzelne Trainingseinheit per ID.
 * Rückgabe: undefined = lädt, null = nicht gefunden.
 */
export function useSession(id: number | undefined) {
  return useLiveQuery(
    async () => {
      if (id == null || Number.isNaN(id)) return null;
      return (await getSession(id)) ?? null;
    },
    [id],
  );
}

/** Alle persönlichen Rekorde. */
export function usePersonalRecords() {
  return useLiveQuery(() => listPersonalRecords(), []);
}

/** Jüngstes Baseline-Assessment. */
export function useLatestAssessment() {
  return useLiveQuery(() => getLatestAssessment(), []);
}

/**
 * Aktiver Trainingsplan.
 * Rückgabe: undefined = lädt, null = keiner vorhanden.
 */
export function useActivePlan() {
  return useLiveQuery(async () => (await getActivePlan()) ?? null, []);
}

/** Anzahl Zeilen je Tabelle (für Speicher-/Datenübersicht). */
export function useTableCounts() {
  return useLiveQuery(async () => {
    const counts: Record<string, number> = {};
    for (const table of db.tables) {
      counts[table.name] = await table.count();
    }
    return counts;
  }, []);
}
