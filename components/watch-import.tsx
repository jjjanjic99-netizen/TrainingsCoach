"use client";

/**
 * Import von Watch-/Workout-Daten (CSV oder JSON).
 * Datei wählen oder Text einfügen -> Vorschau -> je Eintrag als neue Einheit
 * anlegen oder einer bestehenden zuordnen. Manuelle Eingabe bleibt möglich.
 */

import { useRef, useState } from "react";
import { Upload, FileText, ClipboardPaste, Check } from "lucide-react";
import { Button, Card, CardBody, CardHeader, SectionTitle } from "@/components/ui";
import { FormStatus, Select } from "@/components/form";
import { useSessions } from "@/lib/hooks/use-live-data";
import { addSession, updateSession } from "@/lib/db/repositories";
import type { SessionType, TrainingSession } from "@/lib/db/types";
import { SESSION_TYPES, sessionTypeLabel } from "@/lib/hyrox/sessions";
import {
  CSV_EXAMPLE,
  JSON_EXAMPLE,
  parseWorkouts,
  type ParsedWorkout,
  type ParseResult,
} from "@/lib/import/watch-import";
import { formatDate, formatDuration } from "@/lib/format";

export function WatchImport() {
  const sessions = useSessions();
  const fileRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [defaultType, setDefaultType] = useState<SessionType>("easy_run");
  const [targets, setTargets] = useState<string[]>([]); // "new" | sessionId
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  function doParse(input: string) {
    const parsed = parseWorkouts(input);
    setResult(parsed);
    setTargets(parsed.workouts.map(() => "new"));
    setStatus(null);
  }

  async function onFile(file: File) {
    const content = await file.text();
    setText(content);
    doParse(content);
  }

  async function handleImport() {
    if (!result) return;
    setBusy(true);
    setStatus(null);
    let created = 0;
    let merged = 0;
    try {
      for (let i = 0; i < result.workouts.length; i++) {
        const w = result.workouts[i];
        const target = targets[i];
        if (target === "new") {
          await addSession({
            date: w.date,
            type: w.type ?? defaultType,
            durationSeconds: w.durationSeconds,
            distanceM: w.distanceM,
            avgHr: w.avgHr,
            maxHr: w.maxHr,
            notes: w.notes,
            runSplits: w.splits,
          });
          created++;
        } else {
          const patch: Partial<TrainingSession> = {};
          if (w.durationSeconds != null) patch.durationSeconds = w.durationSeconds;
          if (w.distanceM != null) patch.distanceM = w.distanceM;
          if (w.avgHr != null) patch.avgHr = w.avgHr;
          if (w.maxHr != null) patch.maxHr = w.maxHr;
          if (w.splits) patch.runSplits = w.splits;
          await updateSession(Number(target), patch);
          merged++;
        }
      }
      setStatus({
        kind: "ok",
        text: `${created} neu angelegt, ${merged} zugeordnet.`,
      });
      setResult(null);
      setText("");
      setTargets([]);
    } catch {
      setStatus({ kind: "error", text: "Import fehlgeschlagen." });
    } finally {
      setBusy(false);
    }
  }

  const recentSessions = (sessions ?? []).slice(0, 30);

  return (
    <div className="space-y-6">
      <FormStatus status={status} />

      {/* Schema-Dokumentation */}
      <Card>
        <CardHeader
          title="Datei-Format"
          subtitle="CSV oder JSON – Datum ist Pflicht, alles andere optional."
          icon={<FileText className="h-5 w-5" />}
        />
        <CardBody className="space-y-3 pt-2 text-sm text-muted-foreground">
          <p>
            Unterstützte Felder: <strong className="text-foreground">date</strong>,
            type, duration (mm:ss / hh:mm:ss / Sekunden), distance (Meter) bzw.
            distance_km, avg_hr, max_hr, notes. Splits nur via JSON.
          </p>
          <details className="rounded-xl bg-muted p-3">
            <summary className="cursor-pointer text-xs font-semibold text-foreground">
              Beispiel CSV
            </summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre text-[11px] leading-relaxed">
              {CSV_EXAMPLE}
            </pre>
          </details>
          <details className="rounded-xl bg-muted p-3">
            <summary className="cursor-pointer text-xs font-semibold text-foreground">
              Beispiel JSON (mit Splits)
            </summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre text-[11px] leading-relaxed">
              {JSON_EXAMPLE}
            </pre>
          </details>
        </CardBody>
      </Card>

      {/* Eingabe */}
      <Card>
        <CardBody className="space-y-3 pt-4">
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" aria-hidden />
            CSV/JSON-Datei wählen
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />

          <p className="text-center text-xs text-muted-foreground">oder Text einfügen</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="CSV- oder JSON-Inhalt hier einfügen…"
            className="min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => doParse(text)} disabled={text.trim() === ""}>
              <ClipboardPaste className="h-4 w-4" aria-hidden />
              Parsen
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setText(CSV_EXAMPLE);
                doParse(CSV_EXAMPLE);
              }}
            >
              Beispiel CSV
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setText(JSON_EXAMPLE);
                doParse(JSON_EXAMPLE);
              }}
            >
              Beispiel JSON
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Vorschau */}
      {result ? (
        <section className="space-y-2">
          <SectionTitle>
            Vorschau ({result.workouts.length}{" "}
            {result.workouts.length === 1 ? "Eintrag" : "Einträge"})
          </SectionTitle>

          {result.errors.length > 0 ? (
            <Card className="border-danger/30">
              <CardBody className="pt-4 text-xs text-danger">
                <p className="mb-1 font-semibold">Übersprungen:</p>
                <ul className="list-inside list-disc space-y-0.5">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}

          {result.workouts.length > 0 ? (
            <>
              <Card>
                <CardBody className="pt-4">
                  <label className="text-sm font-medium">
                    Standard-Typ (für Einträge ohne Typ)
                  </label>
                  <Select
                    value={defaultType}
                    onChange={(e) => setDefaultType(e.target.value as SessionType)}
                    className="mt-1.5"
                  >
                    {SESSION_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </CardBody>
              </Card>

              <div className="space-y-3">
                {result.workouts.map((w, i) => (
                  <PreviewRow
                    key={i}
                    workout={w}
                    defaultType={defaultType}
                    target={targets[i]}
                    recent={recentSessions}
                    onTarget={(val) =>
                      setTargets((prev) => prev.map((t, idx) => (idx === i ? val : t)))
                    }
                  />
                ))}
              </div>

              <Button onClick={handleImport} disabled={busy} className="w-full">
                <Check className="h-4 w-4" aria-hidden />
                {result.workouts.length} importieren
              </Button>
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function PreviewRow({
  workout,
  defaultType,
  target,
  recent,
  onTarget,
}: {
  workout: ParsedWorkout;
  defaultType: SessionType;
  target: string;
  recent: TrainingSession[];
  onTarget: (val: string) => void;
}) {
  const km = workout.distanceM != null ? workout.distanceM / 1000 : null;
  return (
    <Card>
      <CardBody className="space-y-2 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{formatDate(workout.date)}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {sessionTypeLabel(workout.type ?? defaultType)}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {workout.durationSeconds != null ? (
            <span>{formatDuration(workout.durationSeconds)}</span>
          ) : null}
          {km != null ? (
            <span>{km.toLocaleString("de-CH", { maximumFractionDigits: 2 })} km</span>
          ) : null}
          {workout.avgHr != null ? <span>Ø {workout.avgHr} bpm</span> : null}
          {workout.maxHr != null ? <span>max {workout.maxHr} bpm</span> : null}
          {workout.splits?.length ? <span>{workout.splits.length} Splits</span> : null}
        </div>
        <Select value={target} onChange={(e) => onTarget(e.target.value)}>
          <option value="new">→ Neue Einheit anlegen</option>
          {recent.map((s) => (
            <option key={s.id} value={String(s.id)}>
              → Zuordnen: {formatDate(s.date)} · {sessionTypeLabel(s.type)}
            </option>
          ))}
        </Select>
      </CardBody>
    </Card>
  );
}
