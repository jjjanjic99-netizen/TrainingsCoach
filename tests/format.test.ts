import { describe, it, expect } from "vitest";
import {
  formatDuration,
  pacePerKm,
  parseDurationInput,
  parseNumberInput,
} from "@/lib/format";

describe("parseDurationInput", () => {
  it("parst mm:ss", () => {
    expect(parseDurationInput("4:30")).toBe(270);
    expect(parseDurationInput("22:30")).toBe(1350);
  });
  it("parst hh:mm:ss", () => {
    expect(parseDurationInput("1:05:00")).toBe(3900);
  });
  it("parst reine Sekunden", () => {
    expect(parseDurationInput("90")).toBe(90);
  });
  it("liefert null bei ungültiger Eingabe", () => {
    expect(parseDurationInput("")).toBeNull();
    expect(parseDurationInput("abc")).toBeNull();
    expect(parseDurationInput(null)).toBeNull();
  });
});

describe("parseNumberInput", () => {
  it("akzeptiert Komma als Dezimaltrennzeichen", () => {
    expect(parseNumberInput("7,5")).toBe(7.5);
    expect(parseNumberInput("80")).toBe(80);
    expect(parseNumberInput("")).toBeNull();
  });
});

describe("pacePerKm / formatDuration", () => {
  it("berechnet Pace aus Distanz und Dauer", () => {
    expect(pacePerKm(5000, 1200)).toBe(240); // 4:00/km
  });
  it("formatiert Sekunden", () => {
    expect(formatDuration(270)).toBe("4:30");
    expect(formatDuration(3900)).toBe("1:05:00");
  });
});
