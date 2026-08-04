"use client";

/**
 * Formular zum Erfassen/Bearbeiten einer Trainingseinheit.
 * Adaptiv nach Typ: Lauf-Details (Distanz/Splits) bei Lauf-/Hybrid-Einheiten,
 * Stationsergebnisse bei Kraft-/Hybrid-Einheiten. RPE, HF und Notizen immer.
 * Nutzt ausschliesslich die Datenschicht (addSession/updateSession/deleteSession).
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2, X } from "lucide-react";
import { Button, Card, CardBody, CardHeader, SectionTitle } from "@/components/ui";
import {
  Field,
  FormStatus,
  NumberInput,
  Select,
  Textarea,
  TextInput,
  TimeInput,
} from "@/components/form";
import { useSession } from "@/lib/hooks/use-live-data";
import { addSession, deleteSession, updateSession } from "@/lib/db/repositories";
import type {
  RunSplit,
  SessionStationResult,
  SessionType,
  TrainingSession,
} from "@/lib/db/types";
import { SESSION_TYPES, getSessionTypeMeta } from "@/lib/hyrox/sessions";
import { HYROX_STATIONS, getStation, type HyroxStationId } from "@/lib/hyrox/stations";
import {
  formatDuration,
  parseDurationInput,
  parseNumberInput,
  todayIso,
} from "@/lib/format";

interface SplitRow {
  distance: string;
  time: string;
}
interface StationRow {
  stationId: HyroxStationId;
  value: string;
  load: string;
}

export function SessionForm({ sessionId }: { sessionId?: number }) {
  const router = useRouter();
  const isEdit = sessionId != null;
  const existing = useSession(sessionId);
  const hydrated = useRef(false);

  const [date, setDate] = useState(todayIso());
  const [type, setType] = useState<SessionType>("easy_run");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [rpe, setRpe] = useState("");
  const [avgHr, setAvgHr] = useState("");
  const [maxHr, setMaxHr] = useState("");
  const [notes, setNotes] = useState("");
  const [splits, setSplits] = useState<SplitRow[]>([]);
  const [stations, setStations] = useState<StationRow[]>([]);

  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  // Bestehende Einheit im Bearbeiten-Modus einmalig laden.
  useEffect(() => {
    if (!isEdit || hydrated.current || existing === undefined || existing === null) {
      return;
    }
    hydrated.current = true;
    const s = existing;
    setDate(s.date);
    setType(s.type);
    setDuration(s.durationSeconds != null ? formatDuration(s.durationSeconds) : "");
    setDistance(s.distanceM != null ? String(s.distanceM) : "");
    setRpe(s.rpe != null ? String(s.rpe) : "");
    setAvgHr(s.avgHr != null ? String(s.avgHr) : "");
    setMaxHr(s.maxHr != null ? String(s.maxHr) : "");
    setNotes(s.notes ?? "");
    setSplits(
      (s.runSplits ?? []).map((r) => ({
        distance: String(r.distanceM),
        time: formatDuration(r.durationSeconds),
      })),
    );
    setStations(
      (s.stationResults ?? []).map((r) => {
        const metric = getStation(r.stationId).metric;
        return {
          stationId: r.stationId,
          value:
            metric === "time"
              ? r.durationSeconds != null
                ? formatDuration(r.durationSeconds)
                : ""
              : r.reps != null
                ? String(r.reps)
                : "",
          load: r.loadKg != null ? String(r.loadKg) : "",
        };
      }),
    );
  }, [existing, isEdit]);

  const category = getSessionTypeMeta(type).category;
  const showRun = category === "run" || category === "hybrid";
  const showStations = category === "strength" || category === "hybrid";

  /* -------------------------- Split-Zeilen -------------------------- */
  const addSplit = () =>
    setSplits((prev) => [...prev, { distance: "1000", time: "" }]);
  const updateSplit = (i: number, patch: Partial<SplitRow>) =>
    setSplits((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeSplit = (i: number) =>
    setSplits((prev) => prev.filter((_, idx) => idx !== i));

  /* ------------------------- Stations-Zeilen ------------------------ */
  const addStation = () =>
    setStations((prev) => [
      ...prev,
      { stationId: HYROX_STATIONS[0].id, value: "", load: "" },
    ]);
  const updateStation = (i: number, patch: Partial<StationRow>) =>
    setStations((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeStation = (i: number) =>
    setStations((prev) => prev.filter((_, idx) => idx !== i));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    const runSplits: RunSplit[] = splits
      .map((r) => ({
        distanceM: parseNumberInput(r.distance),
        durationSeconds: parseDurationInput(r.time),
      }))
      .filter(
        (r): r is RunSplit => r.distanceM != null && r.durationSeconds != null,
      );

    const stationResults: SessionStationResult[] = stations
      .map((r) => {
        const metric = getStation(r.stationId).metric;
        const load = parseNumberInput(r.load) ?? undefined;
        const result: SessionStationResult = { stationId: r.stationId };
        if (metric === "time") {
          const s = parseDurationInput(r.value);
          if (s != null) result.durationSeconds = s;
        } else {
          const reps = parseNumberInput(r.value);
          if (reps != null) result.reps = reps;
        }
        if (load != null) result.loadKg = load;
        return result;
      })
      .filter((r) => r.durationSeconds != null || r.reps != null || r.loadKg != null);

    const rpeNum = parseNumberInput(rpe);
    const payload: Omit<TrainingSession, "id" | "createdAt" | "updatedAt"> = {
      date: date || todayIso(),
      type,
      durationSeconds: parseDurationInput(duration) ?? undefined,
      distanceM: showRun ? (parseNumberInput(distance) ?? undefined) : undefined,
      rpe: rpeNum != null ? Math.min(10, Math.max(1, Math.round(rpeNum))) : undefined,
      avgHr: parseNumberInput(avgHr) ?? undefined,
      maxHr: parseNumberInput(maxHr) ?? undefined,
      notes: notes.trim() || undefined,
      runSplits: showRun && runSplits.length ? runSplits : undefined,
      stationResults: showStations && stationResults.length ? stationResults : undefined,
    };

    setBusy(true);
    try {
      if (isEdit && sessionId != null) {
        await updateSession(sessionId, payload);
      } else {
        await addSession(payload);
      }
      router.push("/training");
    } catch {
      setStatus({ kind: "error", text: "Speichern fehlgeschlagen." });
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (sessionId == null) return;
    if (!window.confirm("Diese Einheit wirklich löschen?")) return;
    setBusy(true);
    try {
      await deleteSession(sessionId);
      router.push("/training");
    } catch {
      setStatus({ kind: "error", text: "Löschen fehlgeschlagen." });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormStatus status={status} />

      <Card>
        <CardBody className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Datum">
              <TextInput
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Dauer">
              <TimeInput
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="45:00"
              />
            </Field>
          </div>

          <Field label="Typ" hint={getSessionTypeMeta(type).hint}>
            <Select value={type} onChange={(e) => setType(e.target.value as SessionType)}>
              {SESSION_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>

      {/* Lauf-Details */}
      {showRun ? (
        <section className="space-y-2">
          <SectionTitle>Lauf</SectionTitle>
          <Card>
            <CardBody className="space-y-4 pt-4">
              <Field label="Distanz (m)" hint="Gesamtdistanz – ergibt zusammen mit der Dauer die Pace.">
                <NumberInput
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="z. B. 5000"
                />
              </Field>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Splits</span>
                  <button
                    type="button"
                    onClick={addSplit}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Split
                  </button>
                </div>
                {splits.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Optional – z. B. je 1 km ein Split.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {splits.map((row, i) => (
                      <div key={i} className="flex items-end gap-2">
                        <Field label="Distanz (m)" className="flex-1">
                          <NumberInput
                            value={row.distance}
                            onChange={(e) => updateSplit(i, { distance: e.target.value })}
                          />
                        </Field>
                        <Field label="Zeit" className="flex-1">
                          <TimeInput
                            value={row.time}
                            onChange={(e) => updateSplit(i, { time: e.target.value })}
                          />
                        </Field>
                        <button
                          type="button"
                          onClick={() => removeSplit(i)}
                          aria-label="Split entfernen"
                          className="mb-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
                        >
                          <X className="h-5 w-5" aria-hidden />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </section>
      ) : null}

      {/* Stationsergebnisse */}
      {showStations ? (
        <section className="space-y-2">
          <SectionTitle>Stationen</SectionTitle>
          <Card>
            <CardBody className="space-y-3 pt-4">
              {stations.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Füge Stationsergebnisse hinzu (Zeit oder Reps, optional Last).
                </p>
              ) : (
                stations.map((row, i) => {
                  const metric = getStation(row.stationId).metric;
                  return (
                    <div key={i} className="rounded-xl border border-border p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Select
                          value={row.stationId}
                          onChange={(e) =>
                            updateStation(i, {
                              stationId: e.target.value as HyroxStationId,
                            })
                          }
                          className="flex-1"
                        >
                          {HYROX_STATIONS.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name}
                            </option>
                          ))}
                        </Select>
                        <button
                          type="button"
                          onClick={() => removeStation(i)}
                          aria-label="Station entfernen"
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
                        >
                          <X className="h-5 w-5" aria-hidden />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label={metric === "time" ? "Zeit" : "Reps"}>
                          {metric === "time" ? (
                            <TimeInput
                              value={row.value}
                              onChange={(e) => updateStation(i, { value: e.target.value })}
                            />
                          ) : (
                            <NumberInput
                              value={row.value}
                              onChange={(e) => updateStation(i, { value: e.target.value })}
                            />
                          )}
                        </Field>
                        <Field label="Last (kg)">
                          <NumberInput
                            value={row.load}
                            onChange={(e) => updateStation(i, { load: e.target.value })}
                            placeholder="optional"
                          />
                        </Field>
                      </div>
                    </div>
                  );
                })
              )}
              <button
                type="button"
                onClick={addStation}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Station hinzufügen
              </button>
            </CardBody>
          </Card>
        </section>
      ) : null}

      {/* Belastung & Notizen */}
      <section className="space-y-2">
        <SectionTitle>Belastung &amp; Notizen</SectionTitle>
        <Card>
          <CardBody className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-3">
              <Field label="RPE (1–10)">
                <NumberInput
                  value={rpe}
                  onChange={(e) => setRpe(e.target.value)}
                  placeholder="7"
                />
              </Field>
              <Field label="Ø-HF">
                <NumberInput
                  value={avgHr}
                  onChange={(e) => setAvgHr(e.target.value)}
                  placeholder="bpm"
                />
              </Field>
              <Field label="Max-HF">
                <NumberInput
                  value={maxHr}
                  onChange={(e) => setMaxHr(e.target.value)}
                  placeholder="bpm"
                />
              </Field>
            </div>
            <Field label="Notizen">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Wie lief die Einheit?"
              />
            </Field>
          </CardBody>
        </Card>
      </section>

      <div className="space-y-3">
        <Button type="submit" disabled={busy} className="w-full">
          <Save className="h-4 w-4" aria-hidden />
          {isEdit ? "Änderungen speichern" : "Einheit speichern"}
        </Button>
        {isEdit ? (
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={busy}
            className="w-full"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Einheit löschen
          </Button>
        ) : null}
      </div>
    </form>
  );
}
