"use client";

/**
 * Diagramm-Bausteine auf Basis von recharts. Theme-bewusst (Farben je nach
 * hell/dunkel) und SSR-sicher (rendern erst nach dem Mounten, damit
 * ResponsiveContainer eine echte Breite hat).
 */

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@/components/theme-provider";

function useChartColors() {
  const { resolved } = useTheme();
  const dark = resolved === "dark";
  return {
    line: dark ? "#22c55e" : "#16a34a",
    accent: dark ? "#a3e635" : "#65a30d",
    sky: dark ? "#38bdf8" : "#0ea5e9",
    grid: dark ? "#28334a" : "#e2e8f0",
    axis: dark ? "#94a3b8" : "#64748b",
    tooltipBg: dark ? "#161f36" : "#ffffff",
    tooltipBorder: dark ? "#28334a" : "#e2e8f0",
    tooltipText: dark ? "#e2e8f0" : "#0f172a",
  };
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** ISO-Datum -> "TT.MM". */
function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" });
}

function ChartFrame({
  children,
  height = 220,
}: {
  children: React.ReactElement;
  height?: number;
}) {
  const mounted = useMounted();
  if (!mounted) return <div style={{ height }} className="w-full" aria-hidden />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  );
}

interface TooltipEntry {
  payload?: { date: string; value: number };
}
function makeTooltip(
  colors: ReturnType<typeof useChartColors>,
  valueFormatter: (v: number) => string,
  label: string,
) {
  function CustomTooltip({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: TooltipEntry[];
  }) {
    const p = payload && payload.length ? payload[0].payload : undefined;
    if (!active || !p) return null;
    return (
      <div
        style={{
          background: colors.tooltipBg,
          border: `1px solid ${colors.tooltipBorder}`,
          color: colors.tooltipText,
        }}
        className="rounded-lg px-3 py-2 text-xs shadow-md"
      >
        <div className="font-medium">{shortDate(p.date)}</div>
        <div className="text-muted-foreground">
          {label}: <span className="font-semibold">{valueFormatter(p.value)}</span>
        </div>
      </div>
    );
  }
  return CustomTooltip;
}

export interface TrendDatum {
  date: string;
  value: number;
}

/** Linien-Diagramm für Zeit-/Wert-Trends über die Zeit. */
export function TrendLineChart({
  data,
  valueFormatter,
  label,
  variant = "primary",
}: {
  data: TrendDatum[];
  valueFormatter: (v: number) => string;
  label: string;
  variant?: "primary" | "sky";
}) {
  const colors = useChartColors();
  const stroke = variant === "sky" ? colors.sky : colors.line;

  return (
    <ChartFrame>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tick={{ fontSize: 11, fill: colors.axis }}
          tickLine={false}
          axisLine={{ stroke: colors.grid }}
          minTickGap={20}
        />
        <YAxis
          tickFormatter={valueFormatter}
          tick={{ fontSize: 11, fill: colors.axis }}
          tickLine={false}
          axisLine={false}
          width={52}
          domain={["auto", "auto"]}
        />
        <Tooltip
          content={makeTooltip(colors, valueFormatter, label)}
          cursor={{ stroke: colors.grid }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={stroke}
          strokeWidth={2.5}
          dot={{ r: 3, fill: stroke }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartFrame>
  );
}

export interface BarDatum {
  date: string;
  value: number;
}

/** Balken-Diagramm für Wochenvolumen o. Ä. */
export function VolumeBarChart({
  data,
  valueFormatter,
  label,
}: {
  data: BarDatum[];
  valueFormatter: (v: number) => string;
  label: string;
}) {
  const colors = useChartColors();
  return (
    <ChartFrame>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tick={{ fontSize: 11, fill: colors.axis }}
          tickLine={false}
          axisLine={{ stroke: colors.grid }}
          minTickGap={10}
        />
        <YAxis
          tickFormatter={valueFormatter}
          tick={{ fontSize: 11, fill: colors.axis }}
          tickLine={false}
          axisLine={false}
          width={36}
          allowDecimals={false}
        />
        <Tooltip
          content={makeTooltip(colors, valueFormatter, label)}
          cursor={{ fill: colors.grid, opacity: 0.4 }}
        />
        <Bar dataKey="value" fill={colors.accent} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartFrame>
  );
}

export interface RadarDatum {
  subject: string;
  score: number;
}

/**
 * Stärken/Schwächen-Radar. Score 1.0 = auf Zielsplit, >1 = besser (Stärke),
 * <1 = schlechter (Schwäche). Der Kreis bei 1.0 markiert das Ziel.
 */
export function StrengthRadar({ data }: { data: RadarDatum[] }) {
  const colors = useChartColors();
  return (
    <ChartFrame height={300}>
      <RadarChart data={data} outerRadius="68%" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke={colors.grid} />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 10, fill: colors.axis }}
        />
        <PolarRadiusAxis domain={[0.6, 1.4]} tick={false} axisLine={false} />
        <Radar
          dataKey="score"
          stroke={colors.line}
          fill={colors.line}
          fillOpacity={0.35}
          isAnimationActive={false}
        />
      </RadarChart>
    </ChartFrame>
  );
}
