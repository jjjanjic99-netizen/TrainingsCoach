import { describe, it, expect } from "vitest";
import { generatePlan } from "@/lib/hyrox/plan";

describe("generatePlan (12 Wochen, intermediate)", () => {
  const plan = generatePlan({
    weeks: 12,
    level: "intermediate",
    startDateIso: "2026-08-03",
  });

  it("erzeugt genau 12 Wochen", () => {
    expect(plan.weeks).toHaveLength(12);
  });

  it("periodisiert von Base bis Taper", () => {
    expect(plan.weeks[0].phase).toBe("base");
    expect(plan.weeks[11].phase).toBe("taper");
    const phases = new Set(plan.weeks.map((w) => w.phase));
    expect(phases).toEqual(new Set(["base", "build", "peak", "taper"]));
  });

  it("setzt Deload in Woche 4 und 8, nicht im Taper", () => {
    expect(plan.weeks[3].deload).toBe(true);
    expect(plan.weeks[7].deload).toBe(true);
    expect(plan.weeks[11].deload).toBe(false);
  });

  it("plant pro Woche 5 Einheiten (intermediate)", () => {
    for (const w of plan.weeks) expect(w.sessions).toHaveLength(5);
  });

  it("steigert den Long-Run-Umfang progressiv", () => {
    const longOf = (i: number) =>
      plan.weeks[i].sessions.find((s) => s.type === "long_run")?.targetDistanceM ?? 0;
    expect(longOf(0)).toBeGreaterThan(0);
    expect(longOf(6)).toBeGreaterThan(longOf(0));
  });

  it("enthält Hyrox-spezifische Einheiten (Compromised & Race-Sim)", () => {
    const types = new Set(plan.weeks.flatMap((w) => w.sessions.map((s) => s.type)));
    expect(types.has("compromised_run")).toBe(true);
    expect(types.has("race_simulation")).toBe(true);
  });
});
