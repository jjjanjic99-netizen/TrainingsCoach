"use client";

/**
 * Profil-Formular: Grunddaten, Division, Level und Rennziel.
 * Speichert über die Datenschicht (`saveProfile`) und lädt bestehende
 * Werte per Hook. Grundlage für Zielwerte, Plan und Prognose.
 */

import { useEffect, useRef, useState } from "react";
import { Save } from "lucide-react";
import { Button, Card, CardBody } from "@/components/ui";
import {
  Field,
  FormStatus,
  NumberInput,
  SegmentedControl,
  TextInput,
  TimeInput,
} from "@/components/form";
import { useProfile } from "@/lib/hooks/use-live-data";
import { saveProfile } from "@/lib/db/repositories";
import {
  DIVISIONS,
  LEVELS,
  SEX_OPTIONS,
  type DivisionId,
  type LevelId,
  type Sex,
} from "@/lib/hyrox/divisions";
import {
  formatDuration,
  parseDurationInput,
  parseNumberInput,
  weeksUntil,
} from "@/lib/format";

export function ProfileForm() {
  const profile = useProfile();
  const hydrated = useRef(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex>("m");
  const [weight, setWeight] = useState("");
  const [division, setDivision] = useState<DivisionId>("open");
  const [level, setLevel] = useState<LevelId>("beginner");
  const [raceDate, setRaceDate] = useState("");
  const [targetFinish, setTargetFinish] = useState("");

  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  // Bestehendes Profil einmalig in die Felder übernehmen.
  useEffect(() => {
    if (hydrated.current || !profile) return;
    hydrated.current = true;
    setName(profile.name ?? "");
    setAge(profile.age != null ? String(profile.age) : "");
    setSex(profile.sex ?? "m");
    setWeight(profile.bodyweightKg != null ? String(profile.bodyweightKg) : "");
    setDivision(profile.division ?? "open");
    setLevel(profile.level ?? "beginner");
    setRaceDate(profile.targetRaceDate ?? "");
    setTargetFinish(
      profile.targetFinishSeconds != null
        ? formatDuration(profile.targetFinishSeconds)
        : "",
    );
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (name.trim() === "") {
      setStatus({ kind: "error", text: "Bitte einen Namen eingeben." });
      return;
    }
    setBusy(true);
    try {
      await saveProfile({
        name: name.trim(),
        age: parseNumberInput(age) ?? undefined,
        sex,
        bodyweightKg: parseNumberInput(weight) ?? undefined,
        division,
        level,
        targetRaceDate: raceDate || undefined,
        targetFinishSeconds: parseDurationInput(targetFinish) ?? undefined,
      });
      setStatus({ kind: "ok", text: "Profil gespeichert." });
    } catch {
      setStatus({ kind: "error", text: "Speichern fehlgeschlagen." });
    } finally {
      setBusy(false);
    }
  }

  const weeks = weeksUntil(raceDate);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormStatus status={status} />

      <Card>
        <CardBody className="space-y-4 pt-4">
          <Field label="Name">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Name"
              autoComplete="name"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Alter">
              <NumberInput
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="z. B. 34"
              />
            </Field>
            <Field label="Körpergewicht (kg)">
              <NumberInput
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="z. B. 78"
              />
            </Field>
          </div>

          <Field label="Geschlecht" hint="Bestimmt u. a. die Wall-Ball-Reps.">
            <SegmentedControl
              ariaLabel="Geschlecht"
              options={SEX_OPTIONS.map((s) => ({ value: s.id, label: s.name }))}
              value={sex}
              onChange={setSex}
              columns={3}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4 pt-4">
          <Field label="Division">
            <SegmentedControl
              ariaLabel="Division"
              options={DIVISIONS.map((d) => ({ value: d.id, label: d.name }))}
              value={division}
              onChange={setDivision}
              columns={4}
            />
          </Field>

          <Field label="Level">
            <SegmentedControl
              ariaLabel="Level"
              options={LEVELS.map((l) => ({ value: l.id, label: l.name }))}
              value={level}
              onChange={setLevel}
              columns={3}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4 pt-4">
          <Field
            label="Ziel-Renndatum"
            hint={
              weeks != null
                ? weeks >= 0
                  ? `Noch ca. ${weeks} Wochen bis zum Rennen.`
                  : "Das Datum liegt in der Vergangenheit."
                : undefined
            }
          >
            <TextInput
              type="date"
              value={raceDate}
              onChange={(e) => setRaceDate(e.target.value)}
            />
          </Field>

          <Field label="Ziel-Finishzeit" hint="Format mm:ss oder hh:mm:ss.">
            <TimeInput
              value={targetFinish}
              onChange={(e) => setTargetFinish(e.target.value)}
              placeholder="1:15:00"
            />
          </Field>
        </CardBody>
      </Card>

      <Button type="submit" disabled={busy} className="w-full">
        <Save className="h-4 w-4" aria-hidden />
        Profil speichern
      </Button>
    </form>
  );
}
