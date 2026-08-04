/**
 * Formatierungs-Helfer (Deutsch, Schweizer Kontext, metrisch).
 * Reine Funktionen ohne Abhängigkeit zur UI.
 */

/** Sekunden -> "m:ss" bzw. "h:mm:ss". */
export function formatDuration(totalSeconds: number | undefined | null): string {
  if (totalSeconds == null || !Number.isFinite(totalSeconds)) return "–";
  const s = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

/** Sekunden pro Kilometer -> "m:ss/km". */
export function formatPace(secondsPerKm: number | undefined | null): string {
  if (secondsPerKm == null || !Number.isFinite(secondsPerKm)) return "–";
  return `${formatDuration(secondsPerKm)}/km`;
}

/** Pace aus Distanz (m) und Dauer (s). */
export function pacePerKm(distanceM: number, durationSeconds: number): number | null {
  if (!distanceM || distanceM <= 0) return null;
  return durationSeconds / (distanceM / 1000);
}

/** Kilogramm mit Einheit, Dezimaltrennzeichen als Komma. */
export function formatKg(kg: number | undefined | null): string {
  if (kg == null || !Number.isFinite(kg)) return "–";
  return `${kg.toLocaleString("de-CH")} kg`;
}

/** ISO-Datum (YYYY-MM-DD) -> "04.08.2026". */
export function formatDate(iso: string | undefined | null): string {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Heutiges Datum als ISO (YYYY-MM-DD), lokale Zeitzone. */
export function todayIso(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/** Ganze Wochen zwischen heute und einem Zieldatum (kann negativ sein). */
export function weeksUntil(targetIso: string | undefined | null): number | null {
  if (!targetIso) return null;
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) return null;
  const diffMs = target - Date.now();
  return Math.round(diffMs / (7 * 24 * 3600 * 1000));
}

/**
 * Parst eine Zeiteingabe zu Sekunden.
 * Akzeptiert "mm:ss", "hh:mm:ss" oder eine reine Sekundenzahl.
 * Komma wird als Dezimaltrennzeichen akzeptiert. Ungültig -> null.
 */
export function parseDurationInput(input: string | undefined | null): number | null {
  if (input == null) return null;
  const raw = String(input).trim();
  if (raw === "") return null;

  if (raw.includes(":")) {
    const parts = raw.split(":").map((p) => p.trim());
    if (parts.some((p) => !/^\d+([.,]\d+)?$/.test(p))) return null;
    const nums = parts.map((p) => parseFloat(p.replace(",", ".")));
    if (nums.length === 2) return Math.round(nums[0] * 60 + nums[1]);
    if (nums.length === 3) return Math.round(nums[0] * 3600 + nums[1] * 60 + nums[2]);
    return null;
  }

  if (!/^\d+([.,]\d+)?$/.test(raw)) return null;
  return Math.round(parseFloat(raw.replace(",", ".")));
}

/** Parst eine Zahleneingabe (Komma erlaubt) -> number | null. */
export function parseNumberInput(input: string | undefined | null): number | null {
  if (input == null) return null;
  const raw = String(input).trim().replace(",", ".");
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
