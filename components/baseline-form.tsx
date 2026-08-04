"use client";

/**
 * Baseline-Assessment: einmaliger Test-Durchlauf mit Startwert pro Station
 * (Zeit/Reps/Last) plus Lauf-Benchmarks (1 km Time-Trial, 5 km).
 * Kalibriert später Plan und Prognose. Speichert über `addAssessment`;
 * ein erneuter Test legt einen neuen (jüngeren) Datensatz an.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button, Card, CardBody, CardHeader, SectionTitle } from "@/components/ui";
import { Field, FormStatus, NumberInput, Textarea, TimeInput } from "@/components/form";
import { useLatestAssessment } from "@/lib/hooks/use-live-data";
import { addAssessment } from "@/lib/db/repositories";
import type { StationBaseline } from "@/lib/db/types";
import {
  HYROX_STATIONS,
  STATIONS_WITH_LOAD,
  type HyroxStationId,
} from "@/lib/hyrox/stations";
import {
  formatDuration,
  parseDurationInput,
  parseNumberInput,
  todayIso,
} from "@/lib/format";

type ValueMap = Record<string, string>;

export function BaselineForm() {
  const router = useRouter();
  const latest = useLatestAssessment();
  const hydrated = useRef(false);

  const [date, setDate] = useState(todayIso());
  const [values, setValues] = useState<ValueMap>({}); // primärer Wert je Station
  const [loads, setLoads] = useState<ValueMap>({}); // Last (kg) je Station
  const [tt1k, setTt1k] = useState("");
  const [run5k, setRun5k] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  // Letztes Assessment als Vorlage übernehmen (Re-Test erleichtern).
  useEffect(() => {
    if (hydrated.current || !latest) return;
    hydrated.current = true;
    const v: ValueMap = {};
    const l: ValueMap = {};
    for (const base of latest.stationBaselines) {
      const station = HYROX_STATIONS.find((s) => s.id === base.stationId);
      if (!station) continue;
      if (station.metric === "time" && base.durationSeconds != null) {
        v[base.stationId] = formatDuration(base.durationSeconds);
      } else if (station.metric === "reps" && base.reps != null) {
        v[base.stationId] = String(base.reps);
      }
      if (base.loadKg != null) l[base.stationId] = String(base.loadKg);
    }
    setValues(v);
    setLoads(l);
    if (latest.timeTrial1kSeconds != null) setTt1k(formatDuration(latest.timeTrial1kSeconds));
    if (latest.run5kSeconds != null) setRun5k(formatDuration(latest.run5kSeconds));
    setNotes(latest.notes ?? "");
  }, [latest]);

  const setValue = (id: HyroxStationId, val: string) =>
    setValues((prev) => ({ ...prev, [id]: val }));
  const setLoad = (id: HyroxStationId, val: string) =>
    setLoads((prev) => ({ ...prev, [id]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    const stationBaselines: StationBaseline[] = [];
    for (const station of HYROX_STATIONS) {
      const raw = values[station.id];
      const loadKg = parseNumberInput(loads[station.id]) ?? undefined;
      let entry: StationBaseline | null = null;
      if (station.metric === "time") {
        const s = parseDurationInput(raw);
        if (s != null) entry = { stationId: station.id, durationSeconds: s };
      } else {
        const reps = parseNumberInput(raw);
        if (reps != null) entry = { stationId: station.id, reps };
      }
      if (entry) {
        if (loadKg != null) entry.loadKg = loadKg;
        stationBaselines.push(entry);
      } else if (loadKg != null) {
        stationBaselines.push({ stationId: station.id, loadKg });
      }
    }

    const tt = parseDurationInput(tt1k);
    const r5 = parseDurationInput(run5k);

    if (stationBaselines.length === 0 && tt == null && r5 == null) {
      setStatus({ kind: "error", text: "Bitte mindestens einen Wert erfassen." });
      return;
    }

    setBusy(true);
    try {
      await addAssessment({
        date: date || todayIso(),
        stationBaselines,
        timeTrial1kSeconds: tt ?? undefined,
        run5kSeconds: r5 ?? undefined,
        notes: notes.trim() || undefined,
      });
      setStatus({ kind: "ok", text: "Assessment gespeichert." });
      setTimeout(() => router.push("/fortschritt"), 700);
    } catch {
      setStatus({ kind: "error", text: "Speichern fehlgeschlagen." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormStatus status={status} />

      <Card>
        <CardBody className="space-y-4 pt-4">
          <Field label="Datum">
            <TimeInputDate value={date} onChange={setDate} />
          </Field>
          <p className="text-sm text-muted-foreground">
            Erfasse für einen Test-Durchlauf deine Startwerte. Alle Felder sind
            optional – trag ein, was du gemessen hast.
          </p>
        </CardBody>
      </Card>

      {/* Lauf-Benchmarks */}
      <section className="space-y-2">
        <SectionTitle>Lauf-Benchmarks</SectionTitle>
        <Card>
          <CardBody className="grid grid-cols-2 gap-3 pt-4">
            <Field label="1 km Time-Trial">
              <TimeInput value={tt1k} onChange={(e) => setTt1k(e.target.value)} placeholder="3:45" />
            </Field>
            <Field label="5 km Lauf">
              <TimeInput value={run5k} onChange={(e) => setRun5k(e.target.value)} placeholder="22:30" />
            </Field>
          </CardBody>
        </Card>
      </section>

      {/* Stationen */}
      <section className="space-y-2">
        <SectionTitle>Stationen</SectionTitle>
        <Card>
          <CardHeader title="Startwerte pro Station" />
          <CardBody className="space-y-4 pt-2">
            {HYROX_STATIONS.map((station) => {
              const withLoad = STATIONS_WITH_LOAD.has(station.id);
              return (
                <div key={station.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {station.order}
                    </span>
                    {station.name}
                  </div>
                  <div className={withLoad ? "grid grid-cols-2 gap-3" : ""}>
                    <Field label={station.metric === "time" ? "Zeit" : "Wiederholungen"}>
                      {station.metric === "time" ? (
                        <TimeInput
                          value={values[station.id] ?? ""}
                          onChange={(e) => setValue(station.id, e.target.value)}
                        />
                      ) : (
                        <NumberInput
                          value={values[station.id] ?? ""}
                          onChange={(e) => setValue(station.id, e.target.value)}
                          placeholder="z. B. 100"
                        />
                      )}
                    </Field>
                    {withLoad ? (
                      <Field label="Last (kg)">
                        <NumberInput
                          value={loads[station.id] ?? ""}
                          onChange={(e) => setLoad(station.id, e.target.value)}
                          placeholder="optional"
                        />
                      </Field>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardBody className="pt-4">
          <Field label="Notizen">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bedingungen, Gefühl, Besonderheiten…"
            />
          </Field>
        </CardBody>
      </Card>

      <Button type="submit" disabled={busy} className="w-full">
        <Save className="h-4 w-4" aria-hidden />
        Assessment speichern
      </Button>
    </form>
  );
}

/** Datums-Eingabe (native), separat gehalten für Klarheit. */
function TimeInputDate({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-h-[44px] rounded-xl border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary"
    />
  );
}
