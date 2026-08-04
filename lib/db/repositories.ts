/**
 * Repository-Schicht: gekapselter Datenzugriff.
 *
 * Die UI ruft ausschliesslich diese Funktionen (bzw. die Hooks in
 * `lib/hooks/*`) auf und kennt IndexedDB/Dexie nicht direkt.
 */

import { db } from "./db";
import {
  PROFILE_ID,
  type Assessment,
  type PersonalRecord,
  type Profile,
  type ReadinessEntry,
  type TrainingSession,
} from "./types";

const now = () => new Date().toISOString();

/* ------------------------------- Profil -------------------------------- */

export async function getProfile(): Promise<Profile | undefined> {
  return db.profiles.get(PROFILE_ID);
}

/** Legt das Profil an oder aktualisiert es (Upsert). */
export async function saveProfile(
  data: Omit<Profile, "id" | "createdAt" | "updatedAt"> &
    Partial<Pick<Profile, "createdAt">>,
): Promise<Profile> {
  const existing = await db.profiles.get(PROFILE_ID);
  const profile: Profile = {
    ...data,
    id: PROFILE_ID,
    createdAt: existing?.createdAt ?? data.createdAt ?? now(),
    updatedAt: now(),
  };
  await db.profiles.put(profile);
  return profile;
}

/* -------------------------- Persönliche Rekorde ------------------------ */

export function listPersonalRecords(): Promise<PersonalRecord[]> {
  return db.personalRecords.orderBy("date").reverse().toArray();
}

export async function addPersonalRecord(
  record: Omit<PersonalRecord, "id">,
): Promise<number> {
  return db.personalRecords.add(record as PersonalRecord);
}

export async function deletePersonalRecord(id: number): Promise<void> {
  await db.personalRecords.delete(id);
}

/* ---------------------------- Trainingseinheiten ----------------------- */

export function listSessions(): Promise<TrainingSession[]> {
  return db.sessions.orderBy("date").reverse().toArray();
}

export function getSession(id: number): Promise<TrainingSession | undefined> {
  return db.sessions.get(id);
}

export async function addSession(
  session: Omit<TrainingSession, "id" | "createdAt" | "updatedAt">,
): Promise<number> {
  const ts = now();
  return db.sessions.add({ ...session, createdAt: ts, updatedAt: ts });
}

export async function updateSession(
  id: number,
  patch: Partial<Omit<TrainingSession, "id" | "createdAt">>,
): Promise<void> {
  await db.sessions.update(id, { ...patch, updatedAt: now() });
}

export async function deleteSession(id: number): Promise<void> {
  await db.sessions.delete(id);
}

/* ------------------------------ Assessment ----------------------------- */

export function listAssessments(): Promise<Assessment[]> {
  return db.assessments.orderBy("date").reverse().toArray();
}

export function getLatestAssessment(): Promise<Assessment | undefined> {
  return db.assessments.orderBy("date").last();
}

export async function addAssessment(
  assessment: Omit<Assessment, "id" | "createdAt">,
): Promise<number> {
  return db.assessments.add({ ...assessment, createdAt: now() });
}

/* ------------------------------ Readiness ------------------------------ */

export async function upsertReadiness(
  entry: Omit<ReadinessEntry, "createdAt"> & Partial<Pick<ReadinessEntry, "createdAt">>,
): Promise<void> {
  const existing = await db.readiness.get(entry.date);
  await db.readiness.put({
    ...entry,
    createdAt: existing?.createdAt ?? entry.createdAt ?? now(),
  });
}

export function listReadiness(): Promise<ReadinessEntry[]> {
  return db.readiness.orderBy("date").reverse().toArray();
}
