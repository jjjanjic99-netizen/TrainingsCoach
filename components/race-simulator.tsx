"use client";

/**
 * Renn-Simulator / Prognose (Stufe 5).
 * - Prognostizierte Finishzeit aus aktuellen Benchmarks (Läufe + Stationen +
 *   Roxzone) inkl. Verlauf über die Zeit.
 * - Stärken/Schwächen-Radar relativ zu den Zielsplits.
 * - Limitierende Stationen und interaktive „Was-wäre-wenn"-Szenarien.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, RotateCcw, Timer, TriangleAlert, Trophy } from "lucide-react";
import { Button, Card, CardBody, CardHeader, SectionTitle } from "@/components/ui";
import { StrengthRadar, TrendLineChart } from "@/components/charts";
import { useProfile, useSessions, useLatestAssessment } from "@/lib/hooks/use-live-data";
import {
  computeForecast,
  computeTargets,
  deriveCurrent,
  forecastHistory,
} from "@/lib/hyrox/forecast";
import { HYROX_STATIONS, getStation, type HyroxStationId } from "@/lib/hyrox/stations";
import { formatDuration, formatPace } from "@/lib/format";
import { cn } from "@/lib/cn";

interface Scenario {
  run: number;
  station: Record<HyroxStationId, number>;
}

export function RaceSimulator() {
  const profile = useProfile();
  const sessions = useSessions();
  const assessment = useLatestAssessment();

  const targets = useMemo(
    () => computeTargets(profile?.targetFinishSeconds),
    [profile?.targetFinishSeconds],
  );
  const current = useMemo(
    () => deriveCurrent(sessions ?? [], assessment ?? undefined),
    [sessions, assessment],
  );
  const base = useMemo(() => computeForecast(current, targets), [current, targets]);
  const history = useMemo(
    () => forecastHistory(sessions ?? [], assessment ?? undefined, targets),
    [sessions, assessment, targets],
  );

  // Szenario-Overrides für „Was-wäre-wenn"; setzen sich bei neuen Daten zurück.
  const [scenario, setScenario] = useState<Scenario | null>(null);
  useEffect(() => {
    const station = {} as Record<HyroxStationId, number>;
    for (const s of base.stations) station[s.stationId] = Math.round(s.used);
    setScenario({ run: Math.round(base.runPerKm), station });
  }, [base]);

  const scenarioForecast = useMemo(
    () =>
      scenario
        ? computeForecast({ runPerKm: scenario.run, station: scenario.station }, targets)
        : base,
    [scenario, targets, base],
  );

  if (sessions === undefined) {
    return <p className="px-1 text-sm text-muted-foreground">Lädt…</p>;
  }

  const dataStations = base.stations.filter((s) => s.hasData).length;
  const hasAnyData = current.runPerKm != null || dataStations > 0;
  const goal = profile?.targetFinishSeconds;
  const deltaToGoal = goal != null ? base.totalSeconds - goal : null;

  const radarData = base.stations.map((s) => ({
    subject: getStation(s.stationId).shortName,
    score: Math.max(0.6, Math.min(1.4, s.ratio)),
  }));

  const scenarioDelta = scenarioForecast.totalSeconds - base.totalSeconds;

  const adjustStation = (id: HyroxStationId, delta: number) =>
    setScenario((prev) =>
      prev
        ? { ...prev, station: { ...prev.station, [id]: Math.max(20, prev.station[id] + delta) } }
        : prev,
    );
  const adjustRun = (delta: number) =>
    setScenario((prev) => (prev ? { ...prev, run: Math.max(150, prev.run + delta) } : prev));
  const resetScenario = () => {
    const station = {} as Record<HyroxStationId, number>;
    for (const s of base.stations) station[s.stationId] = Math.round(s.used);
    setScenario({ run: Math.round(base.runPerKm), station });
  };

  return (
    <div className="space-y-6">
      {!hasAnyData ? (
        <Card className="border-dashed">
          <CardBody className="pt-4 text-sm text-muted-foreground">
            Noch keine Benchmarks. Die Prognose nutzt vorerst Zielwerte – erfasse
            das{" "}
            <Link href="/baseline" className="font-semibold text-primary">
              Baseline-Assessment
            </Link>{" "}
            oder logge Stationszeiten, damit sie persönlich wird.
          </CardBody>
        </Card>
      ) : null}

      {/* Prognostizierte Finishzeit */}
      <Card>
        <CardBody className="pt-4 text-center">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Timer className="h-5 w-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Prognostizierte Finishzeit
            </span>
          </div>
          <div className="mt-2 text-4xl font-bold tabular-nums">
            {formatDuration(base.totalSeconds)}
          </div>
          {deltaToGoal != null ? (
            <p
              className={cn(
                "mt-1 text-sm font-medium",
                deltaToGoal <= 0 ? "text-primary" : "text-amber-500",
              )}
            >
              {deltaToGoal <= 0
                ? `${formatDuration(Math.abs(deltaToGoal))} unter Ziel`
                : `${formatDuration(deltaToGoal)} über Ziel (${formatDuration(goal!)})`}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {dataStations}/8 Stationen mit Daten · Läufe{" "}
            {base.runHasData ? "aus deinen Zeiten" : "geschätzt"} · Roxzone geschätzt
          </p>
        </CardBody>
      </Card>

      {/* Limitierende Stationen */}
      {base.limiting.length > 0 ? (
        <section className="space-y-2">
          <SectionTitle>Limitierende Stationen</SectionTitle>
          <div className="space-y-2">
            {base.limiting.map((id) => {
              const s = base.stations.find((x) => x.stationId === id)!;
              const over = Math.round(s.used - s.target);
              return (
                <Card key={id} className="border-amber-500/30">
                  <CardBody className="flex items-center gap-3 pt-4">
                    <TriangleAlert className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{getStation(id).name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(s.used)} · {formatDuration(over)} über Zielsplit
                      </p>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </section>
      ) : hasAnyData ? (
        <Card>
          <CardBody className="flex items-center gap-3 pt-4">
            <Trophy className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Keine Station fällt deutlich hinter die Zielsplits zurück – stark!
            </p>
          </CardBody>
        </Card>
      ) : null}

      {/* Stärken/Schwächen-Radar */}
      <section className="space-y-2">
        <SectionTitle>Stärken / Schwächen</SectionTitle>
        <Card>
          <CardBody className="pt-4">
            <StrengthRadar data={radarData} />
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Aussen = schneller als Zielsplit (Stärke), innen = langsamer
              (Schwäche). Die mittlere Linie ist der Zielsplit.
            </p>
          </CardBody>
        </Card>
      </section>

      {/* Prognose-Verlauf */}
      {history.length >= 2 ? (
        <section className="space-y-2">
          <SectionTitle>Prognose-Verlauf</SectionTitle>
          <Card>
            <CardBody className="pt-4">
              <TrendLineChart
                data={history.map((p) => ({ date: p.date, value: p.totalSeconds }))}
                valueFormatter={(v) => formatDuration(v)}
                label="Prognose"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Niedriger ist besser – so entwickelt sich deine prognostizierte
                Finishzeit.
              </p>
            </CardBody>
          </Card>
        </section>
      ) : null}

      {/* Was-wäre-wenn */}
      <section className="space-y-2">
        <SectionTitle>Was wäre wenn?</SectionTitle>
        <Card>
          <CardBody className="space-y-3 pt-4">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Szenario-Finishzeit</p>
                <p className="text-2xl font-bold tabular-nums">
                  {formatDuration(scenarioForecast.totalSeconds)}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    scenarioDelta < 0
                      ? "bg-primary/15 text-primary"
                      : scenarioDelta > 0
                        ? "bg-amber-500/15 text-amber-500"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {scenarioDelta === 0
                    ? "±0"
                    : `${scenarioDelta < 0 ? "−" : "+"}${formatDuration(Math.abs(scenarioDelta))}`}
                </span>
              </div>
            </div>

            <AdjustRow
              label="Läufe (8× 1 km)"
              value={formatPace(scenario?.run ?? base.runPerKm)}
              onMinus={() => adjustRun(-5)}
              onPlus={() => adjustRun(5)}
              hint="Pace pro km"
            />
            {HYROX_STATIONS.map((st) => {
              const forecastStation = base.stations.find((x) => x.stationId === st.id)!;
              return (
                <AdjustRow
                  key={st.id}
                  label={st.name}
                  value={formatDuration(scenario?.station[st.id] ?? forecastStation.used)}
                  onMinus={() => adjustStation(st.id, -5)}
                  onPlus={() => adjustStation(st.id, 5)}
                  muted={!forecastStation.hasData}
                  hint={!forecastStation.hasData ? "geschätzt (Zielsplit)" : undefined}
                />
              );
            })}

            <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
              <span>Roxzone {formatDuration(base.roxzoneSeconds)} (geschätzt)</span>
              <button
                type="button"
                onClick={resetScenario}
                className="inline-flex items-center gap-1 font-semibold text-primary"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Zurücksetzen
              </button>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function AdjustRow({
  label,
  value,
  hint,
  muted,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  hint?: string;
  muted?: boolean;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", muted && "text-muted-foreground")}>
          {label}
        </p>
        {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMinus}
          aria-label={`${label} schneller`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <span className="w-16 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={onPlus}
          aria-label={`${label} langsamer`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
