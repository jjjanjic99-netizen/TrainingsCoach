/**
 * Demo-Daten (Seed) zum Ausprobieren – klar als Testdaten markiert
 * (`demo: true`) und mit einem Klick wieder löschbar.
 *
 * Erzeugt mehrere Wochen realistischer Hyrox-/Lauf-Einträge plus ein
 * Baseline-Assessment, Readiness-Verlauf und (falls nötig) Profil und Plan,
 * damit Dashboard, Charts, Prognose und Radar sofort befüllt sind.
 */

import { db } from "./db";
import {
  PROFILE_ID,
  type Assessment,
  type ReadinessEntry,
  type SessionType,
  type TrainingSession,
} from "./types";
import { HYROX_STATIONS, type HyroxStationId } from "@/lib/hyrox/stations";
import { generatePlan, PLAN_ID } from "@/lib/hyrox/plan";
import { todayIso } from "@/lib/format";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Ältere (langsamere) Ausgangs-Stationszeiten in Sekunden. */
const STATION_BASE: Record<HyroxStationId, number> = {
  ski_erg: 265,
  sled_push: 150,
  sled_pull: 175,
  burpee_broad_jumps: 300,
  rowing: 255,
  farmers_carry: 115,
  sandbag_lunges: 220,
  wall_balls: 345,
};

const DAYS_BACK = 42; // 6 Wochen

/** Löscht ausschliesslich als Demo markierte Daten. */
export async function clearDemoData(): Promise<void> {
  await db.transaction("rw", db.tables, async () => {
    await db.sessions.filter((s) => s.demo === true).delete();
    await db.assessments.filter((a) => a.demo === true).delete();
    await db.readiness.filter((r) => r.demo === true).delete();
    const plan = await db.plans.get(PLAN_ID);
    if (plan?.demo) await db.plans.delete(PLAN_ID);
    const profile = await db.profiles.get(PROFILE_ID);
    if (profile?.demo) await db.profiles.delete(PROFILE_ID);
  });
}

/** Gibt es aktuell Demo-Daten? */
export async function hasDemoData(): Promise<boolean> {
  const count = await db.sessions.filter((s) => s.demo === true).count();
  return count > 0;
}

/** Legt Demo-Daten an (idempotent – vorhandene Demo-Daten werden ersetzt). */
export async function seedDemoData(): Promise<void> {
  await clearDemoData();

  const today = todayIso();
  const nowIso = new Date().toISOString();

  // Profil nur anlegen, wenn keines existiert (echte Profile bleiben unberührt).
  const existingProfile = await db.profiles.get(PROFILE_ID);
  const level = existingProfile?.level ?? "intermediate";
  const raceDate = existingProfile?.targetRaceDate ?? addDaysIso(today, 70);
  const goalFinish = existingProfile?.targetFinishSeconds ?? 4800; // 1:20:00

  if (!existingProfile) {
    await db.profiles.put({
      id: PROFILE_ID,
      name: "Demo Athlet",
      age: 32,
      sex: "m",
      bodyweightKg: 78,
      division: "open",
      level,
      targetRaceDate: raceDate,
      targetFinishSeconds: goalFinish,
      createdAt: nowIso,
      updatedAt: nowIso,
      demo: true,
    });
  }

  // Baseline-Assessment (vor 6 Wochen) – deckt alle 8 Stationen ab.
  const assessment: Assessment = {
    date: addDaysIso(today, -DAYS_BACK),
    stationBaselines: HYROX_STATIONS.map((s) => ({
      stationId: s.id,
      durationSeconds: STATION_BASE[s.id],
    })),
    timeTrial1kSeconds: 240, // 4:00
    run5kSeconds: 1350, // 22:30
    notes: "Demo-Baseline",
    createdAt: nowIso,
    demo: true,
  };
  await db.assessments.add(assessment);

  // Trainingseinheiten über 6 Wochen (Werte verbessern sich zum Renntag hin).
  const sessions: TrainingSession[] = [];
  let stationRotation = 0;

  for (let ago = DAYS_BACK; ago >= 0; ago--) {
    const date = addDaysIso(today, -ago);
    const dow = new Date(`${date}T00:00:00`).getDay(); // 0=So … 6=Sa
    const progress = (DAYS_BACK - ago) / DAYS_BACK; // 0 (alt) … 1 (neu)

    const base = (type: SessionType, extra: Partial<TrainingSession>): TrainingSession => ({
      date,
      type,
      createdAt: nowIso,
      updatedAt: nowIso,
      demo: true,
      ...extra,
    });

    if (dow === 1) {
      // Montag: Easy Run
      const dist = 6000;
      sessions.push(
        base("easy_run", {
          distanceM: dist,
          durationSeconds: Math.round((dist / 1000) * lerp(320, 292, progress)),
          rpe: 4,
          avgHr: 138,
        }),
      );
    } else if (dow === 3) {
      // Mittwoch: Tempo bzw. Intervalle im Wechsel
      const dist = 7000;
      const isTempo = ago % 14 < 7;
      sessions.push(
        base(isTempo ? "tempo_run" : "interval_run", {
          distanceM: dist,
          durationSeconds: Math.round((dist / 1000) * lerp(300, 268, progress)),
          rpe: 7,
          avgHr: 168,
        }),
      );
    } else if (dow === 5) {
      // Freitag: Stationstraining (rotierende Stationen mit Verbesserung)
      const picks: HyroxStationId[] = [];
      for (let k = 0; k < 3; k++) {
        picks.push(HYROX_STATIONS[(stationRotation + k) % HYROX_STATIONS.length].id);
      }
      stationRotation = (stationRotation + 3) % HYROX_STATIONS.length;
      sessions.push(
        base("station_specific", {
          rpe: 7,
          stationResults: picks.map((id) => ({
            stationId: id,
            durationSeconds: Math.round(STATION_BASE[id] * lerp(1.0, 0.88, progress)),
          })),
        }),
      );
    } else if (dow === 0) {
      // Sonntag: Long Run
      const dist = Math.round(lerp(12000, 15000, progress) / 500) * 500;
      sessions.push(
        base("long_run", {
          distanceM: dist,
          durationSeconds: Math.round((dist / 1000) * lerp(360, 336, progress)),
          rpe: 5,
          avgHr: 150,
        }),
      );
    }
  }

  // Eine Renntempo-Simulation vor ~2 Wochen mit allen Stationen + Lauf.
  const simDate = addDaysIso(today, -14);
  sessions.push({
    date: simDate,
    type: "race_simulation",
    distanceM: 8000,
    durationSeconds: 8 * Math.round(lerp(320, 300, 0.66)),
    rpe: 9,
    avgHr: 172,
    stationResults: HYROX_STATIONS.map((s) => ({
      stationId: s.id,
      durationSeconds: Math.round(STATION_BASE[s.id] * 0.92),
    })),
    notes: "Demo-Renntempo-Simulation",
    createdAt: nowIso,
    updatedAt: nowIso,
    demo: true,
  });

  await db.sessions.bulkAdd(sessions);

  // Readiness der letzten 10 Tage.
  const readiness: ReadinessEntry[] = [];
  const pattern: Array<[number, number, number]> = [
    [4, 2, 4],
    [4, 2, 5],
    [3, 3, 4],
    [4, 1, 4],
    [3, 3, 3],
    [4, 2, 4],
    [2, 4, 3],
    [3, 3, 4],
    [4, 2, 5],
    [4, 1, 4],
  ];
  pattern.forEach(([sleep, soreness, motivation], i) => {
    readiness.push({
      date: addDaysIso(today, -i),
      sleepQuality: sleep,
      soreness,
      motivation,
      createdAt: nowIso,
      demo: true,
    });
  });
  await db.readiness.bulkPut(readiness);

  // Plan nur anlegen, wenn keiner existiert.
  const existingPlan = await db.plans.get(PLAN_ID);
  if (!existingPlan) {
    const plan = generatePlan({
      weeks: 10,
      level,
      startDateIso: today,
      raceDateIso: raceDate,
    });
    await db.plans.put({ ...plan, demo: true });
  }
}
