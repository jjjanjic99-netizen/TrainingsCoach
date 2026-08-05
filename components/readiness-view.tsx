"use client";

/**
 * Recovery/Readiness: täglicher Kurz-Input (Schlaf, Muskelkater, Motivation)
 * plus eine einfache Empfehlung (bis zur Deload-/Erholungs-Empfehlung).
 */

import { useEffect, useRef, useState } from "react";
import { HeartPulse, Moon, Zap, Dumbbell } from "lucide-react";
import { Card, CardBody, CardHeader, SectionTitle } from "@/components/ui";
import { useReadiness } from "@/lib/hooks/use-live-data";
import { upsertReadiness } from "@/lib/db/repositories";
import {
  MOTIVATION_LABEL,
  SLEEP_LABEL,
  SORENESS_LABEL,
  entryScore,
  readinessAdvice,
} from "@/lib/hyrox/readiness";
import { formatDate, todayIso } from "@/lib/format";
import { cn } from "@/lib/cn";

const ADVICE_CLASSES = {
  good: "border-primary/30 bg-primary/5",
  ok: "border-border",
  low: "border-amber-500/40 bg-amber-500/5",
} as const;

export function ReadinessView() {
  const entries = useReadiness();
  const today = todayIso();
  const hydrated = useRef(false);

  const [sleep, setSleep] = useState<number | undefined>();
  const [soreness, setSoreness] = useState<number | undefined>();
  const [motivation, setMotivation] = useState<number | undefined>();

  // Heutigen Eintrag einmalig laden.
  useEffect(() => {
    if (hydrated.current || entries === undefined) return;
    hydrated.current = true;
    const todayEntry = entries.find((e) => e.date === today);
    if (todayEntry) {
      setSleep(todayEntry.sleepQuality);
      setSoreness(todayEntry.soreness);
      setMotivation(todayEntry.motivation);
    }
  }, [entries, today]);

  function persist(next: { sleep?: number; soreness?: number; motivation?: number }) {
    void upsertReadiness({
      date: today,
      sleepQuality: next.sleep ?? sleep,
      soreness: next.soreness ?? soreness,
      motivation: next.motivation ?? motivation,
    });
  }

  const advice = readinessAdvice(entries ?? []);

  return (
    <div className="space-y-6">
      {/* Heutiger Input */}
      <Card>
        <CardHeader
          title="Heute"
          subtitle="Kurz einschätzen – 1 bis 5."
          icon={<HeartPulse className="h-5 w-5" />}
        />
        <CardBody className="space-y-5 pt-2">
          <Scale
            label={SLEEP_LABEL}
            icon={<Moon className="h-4 w-4" />}
            value={sleep}
            low="schlecht"
            high="top"
            onChange={(v) => {
              setSleep(v);
              persist({ sleep: v });
            }}
          />
          <Scale
            label={SORENESS_LABEL}
            icon={<Dumbbell className="h-4 w-4" />}
            value={soreness}
            low="keiner"
            high="stark"
            onChange={(v) => {
              setSoreness(v);
              persist({ soreness: v });
            }}
          />
          <Scale
            label={MOTIVATION_LABEL}
            icon={<Zap className="h-4 w-4" />}
            value={motivation}
            low="niedrig"
            high="hoch"
            onChange={(v) => {
              setMotivation(v);
              persist({ motivation: v });
            }}
          />
        </CardBody>
      </Card>

      {/* Empfehlung */}
      <Card className={ADVICE_CLASSES[advice.level]}>
        <CardBody className="pt-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">{advice.title}</h2>
            {advice.avg != null ? (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold tabular-nums">
                Score {advice.avg.toLocaleString("de-CH", { maximumFractionDigits: 1 })}/5
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{advice.recommendation}</p>
        </CardBody>
      </Card>

      {/* Verlauf */}
      {entries && entries.length > 0 ? (
        <section className="space-y-2">
          <SectionTitle>Verlauf</SectionTitle>
          <Card>
            <ul className="divide-y divide-border">
              {entries.slice(0, 7).map((e) => {
                const score = entryScore(e);
                return (
                  <li
                    key={e.date}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <span className="text-muted-foreground">{formatDate(e.date)}</span>
                    <span className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>S {e.sleepQuality ?? "–"}</span>
                      <span>M {e.soreness ?? "–"}</span>
                      <span>Mo {e.motivation ?? "–"}</span>
                      {score != null ? (
                        <span className="font-semibold text-foreground tabular-nums">
                          {score.toLocaleString("de-CH", { maximumFractionDigits: 1 })}
                        </span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function Scale({
  label,
  icon,
  value,
  low,
  high,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: number | undefined;
  low: string;
  high: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 text-sm font-medium">
        <span className="text-primary" aria-hidden>
          {icon}
        </span>
        {label}
      </div>
      <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => onChange(n)}
            className={cn(
              "min-h-[44px] rounded-xl border text-sm font-semibold tabular-nums transition",
              value === n
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
