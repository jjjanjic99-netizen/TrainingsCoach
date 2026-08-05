import { describe, it, expect } from "vitest";
import {
  computePaceZones,
  getZone,
  mileageProgression,
  vdotFromRace,
} from "@/lib/hyrox/running";

describe("VDOT & Pace-Zonen", () => {
  it("berechnet VDOT ~49.8 für 5 km in 20:00", () => {
    const vdot = vdotFromRace(5000, 1200)!;
    expect(vdot).toBeGreaterThan(49);
    expect(vdot).toBeLessThan(50.5);
  });

  it("leitet plausible Pace-Zonen ab (Daniels-Tabellen)", () => {
    const zones = computePaceZones(5000, 1200)!;
    expect(zones).not.toBeNull();
    const t = getZone(zones, "threshold").secPerKm;
    const i = getZone(zones, "interval").secPerKm;
    const r = getZone(zones, "repetition").secPerKm;
    const e = getZone(zones, "easy");
    // Threshold ~4:16/km (256 s), Interval ~3:56 (236), Repetition ~3:42 (222)
    expect(t).toBeGreaterThan(248);
    expect(t).toBeLessThan(264);
    expect(i).toBeGreaterThan(228);
    expect(i).toBeLessThan(244);
    expect(r).toBeGreaterThan(214);
    expect(r).toBeLessThan(230);
    // Zonen sind geordnet: easy langsamer als threshold langsamer als interval
    expect(e.secPerKm).toBeGreaterThan(t);
    expect(t).toBeGreaterThan(i);
    expect(i).toBeGreaterThan(r);
    // Easy hat einen langsameren Bereichswert
    expect(e.secPerKmSlow!).toBeGreaterThan(e.secPerKm);
  });

  it("gibt null bei ungültigem Test zurück", () => {
    expect(computePaceZones(0, 1200)).toBeNull();
    expect(vdotFromRace(5000, 0)).toBeNull();
  });
});

describe("mileageProgression", () => {
  it("steigert ~10 %/Woche mit Deload in Woche 4", () => {
    const weeks = mileageProgression(40, 8);
    expect(weeks).toHaveLength(8);
    expect(weeks[0].km).toBe(40);
    expect(weeks[1].km).toBe(44);
    expect(weeks[2].km).toBe(48);
    expect(weeks[3].deload).toBe(true);
    expect(weeks[3].km).toBeLessThan(weeks[2].km); // Deload = Rücknahme
    expect(weeks[4].deload).toBe(false);
    expect(weeks[4].km).toBeGreaterThan(weeks[2].km); // danach weiter aufbauen
  });
});
