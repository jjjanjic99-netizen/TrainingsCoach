/**
 * JSON-Export/-Import aller lokalen Daten.
 *
 * Dient als Backup und für späteren Datenimport (z. B. Gerätewechsel).
 * Der Export umfasst generisch alle Dexie-Tabellen, damit neue Tabellen
 * späterer Ausbaustufen automatisch mitgesichert werden.
 */

import { db } from "./db";

/** Struktur einer Backup-Datei. */
export interface BackupFile {
  /** Kennung zur Erkennung gültiger Backups. */
  app: "hyrox-coach";
  /** Format-/Schema-Version des Backups. */
  formatVersion: 1;
  /** Dexie-Schema-Version zum Exportzeitpunkt. */
  dbVersion: number;
  exportedAt: string;
  /** Tabellenname -> Zeilen. */
  data: Record<string, unknown[]>;
}

/** Sammelt alle Tabellen in ein Backup-Objekt. */
export async function exportAllData(): Promise<BackupFile> {
  const data: Record<string, unknown[]> = {};
  await db.transaction("r", db.tables, async () => {
    for (const table of db.tables) {
      data[table.name] = await table.toArray();
    }
  });
  return {
    app: "hyrox-coach",
    formatVersion: 1,
    dbVersion: db.verno,
    exportedAt: new Date().toISOString(),
    data,
  };
}

/** Löst im Browser einen Datei-Download des Backups aus. */
export async function downloadBackup(): Promise<void> {
  const backup = await exportAllData();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const stamp = backup.exportedAt.slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hyrox-coach-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Prüft grob, ob ein Objekt eine gültige Backup-Datei ist. */
export function isBackupFile(value: unknown): value is BackupFile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.app === "hyrox-coach" && typeof v.data === "object" && v.data !== null;
}

export type ImportMode = "replace" | "merge";

export interface ImportResult {
  /** Tabellenname -> Anzahl importierter Zeilen. */
  imported: Record<string, number>;
  skippedTables: string[];
}

/**
 * Importiert ein Backup.
 * - `replace`: bestehende Tabellen werden vorher geleert.
 * - `merge`: Zeilen werden per Primärschlüssel eingefügt/überschrieben (put).
 */
export async function importAllData(
  backup: BackupFile,
  mode: ImportMode = "replace",
): Promise<ImportResult> {
  const imported: Record<string, number> = {};
  const skippedTables: string[] = [];
  const knownTableNames = new Set(db.tables.map((t) => t.name));

  // Unbekannte Tabellen im Backup nur vermerken (keine Datenverluste).
  for (const name of Object.keys(backup.data)) {
    if (!knownTableNames.has(name)) skippedTables.push(name);
  }

  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) {
      const rows = backup.data[table.name];
      if (!Array.isArray(rows)) continue;
      if (mode === "replace") await table.clear();
      if (rows.length > 0) {
        await table.bulkPut(rows as never[]);
      }
      imported[table.name] = rows.length;
    }
  });

  return { imported, skippedTables };
}

/** Liest eine hochgeladene Datei ein und importiert sie. */
export async function importFromFile(
  file: File,
  mode: ImportMode = "replace",
): Promise<ImportResult> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Datei ist kein gültiges JSON.");
  }
  if (!isBackupFile(parsed)) {
    throw new Error("Datei ist kein gültiges Hyrox-Coach-Backup.");
  }
  return importAllData(parsed, mode);
}

/** Löscht alle Daten (Zurücksetzen). */
export async function clearAllData(): Promise<void> {
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });
}

/** Liefert die Anzahl Zeilen je Tabelle (für Speicher-Übersicht). */
export async function getTableCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  await db.transaction("r", db.tables, async () => {
    for (const table of db.tables) {
      counts[table.name] = await table.count();
    }
  });
  return counts;
}
