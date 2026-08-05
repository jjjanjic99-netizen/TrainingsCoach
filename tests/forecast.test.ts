import { describe, it, expect } from "vitest";
import {
  computeForecast,
  computeTargets,
  deriveCurrent,
  forecastHistory,
} from "@/lib/hyrox/forecast";
import { HYROX_STATIONS, RUN_SEGMENTS } from "@/lib/hyrox/stations";
import type { Assessment, TrainingSession } from "@/lib/db/types";

const session = (s: Partial<TrainingSession>): TrainingSession => ({
  date: "2026-01-01",
  type: "easy_run",
  createdAt: "",
  updatedAt: "",
  ...s,
});

describe("computeTargets", () => {
  it("skaliert die Zielsplits auf die Ziel-Finishzeit", () => {
    const targets = computeTargets(4500);
    expect(targets.total).toBe(4500);
    expect(targets.roxzone).toBeGreaterThan(0);
    // Ohne Ziel: Referenz-Benchmark
    const ref = computeTargets();
    expect(ref.total).toBeGreaterThan(4000);
  });
});

describe("computeForecast", () => {
  const targets = computeTargets(4500);

  it("summiert Läufe + Stationen + Roxzone", () => {
    const station = { ...targets.station };
    const f = computeForecast({ runPerKm: 240, station }, targets);
    const stationSum = HYROX_STATIONS.reduce((a, s) => a + targets.station[s.id], 0);
    expect(f.totalSeconds).toBe(
      Math.round(240 * RUN_SEGMENTS + stationSum + targets.roxzone),
    );
    expect(f.limiting).toHaveLength(0);
  });

  it("erkennt eine deutlich zu langsame Station als limitierend", () => {
    const station = {
      ...targets.station,
      wall_balls: Math.round(targets.station.wall_balls * 1.2),
    };
    const f = computeForecast({ runPerKm: 240, station }, targets);
    expect(f.limiting).toContain("wall_balls");
  });

  it("nutzt Zielsplits als Platzhalter für fehlende Stationen", () => {
    const f = computeForecast({ runPerKm: 240, station: {} }, targets);
    const wb = f.stations.find((s) => s.stationId === "wall_balls")!;
    expect(wb.hasData).toBe(false);
    expect(wb.used).toBe(targets.station.wall_balls);
  });
});

describe("deriveCurrent", () => {
  it("liest beste Stationszeiten und Lauf-Pace aus den Daten", () => {
    const assessment: Assessment = {
      date: "2026-06-01",
      stationBaselines: [
        { stationId: "ski_erg", durationSeconds: 240 },
        { stationId: "wall_balls", durationSeconds: 330 },
      ],
      run5kSeconds: 1300, // 260 s/km
      createdAt: "",
    };
    const sessions = [session({ distanceM: 6000, durationSeconds: 1500 })]; // 250 s/km
    const current = deriveCurrent(sessions, assessment);
    expect(current.station.ski_erg).toBe(240);
    expect(current.station.wall_balls).toBe(330);
    expect(current.runPerKm).toBe(250); // schnellste Pace gewinnt
  });
});

describe("forecastHistory", () => {
  it("liefert eine über die Zeit fallende Kurve bei Verbesserung", () => {
    const targets = computeTargets(4500);
    const assessment: Assessment = {
      date: "2026-06-01",
      stationBaselines: [{ stationId: "ski_erg", durationSeconds: 260 }],
      run5kSeconds: 1350,
      createdAt: "",
    };
    const sessions = [
      session({
        date: "2026-07-01",
        type: "station_specific",
        stationResults: [{ stationId: "ski_erg", durationSeconds: 240 }],
      }),
    ];
    const history = forecastHistory(sessions, assessment, targets);
    expect(history).toHaveLength(2);
    expect(history[1].totalSeconds).toBeLessThanOrEqual(history[0].totalSeconds);
  });
});
