"use client";

/**
 * Einstellungen: Darstellung (Theme), Datensicherung (JSON-Export/-Import),
 * Speicherübersicht und Zurücksetzen. Nutzt ausschliesslich die Datenschicht
 * (Repositories/Backup) – kein direkter IndexedDB-Zugriff.
 */

import { useRef, useState } from "react";
import {
  Database,
  Download,
  Info,
  Monitor,
  Moon,
  Palette,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { Button, Card, CardBody, CardHeader, SectionTitle } from "@/components/ui";
import { useTheme, type ThemeMode } from "@/components/theme-provider";
import { useTableCounts } from "@/lib/hooks/use-live-data";
import { cn } from "@/lib/cn";
import {
  clearAllData,
  downloadBackup,
  importFromFile,
  type ImportMode,
} from "@/lib/db/backup";

/** Deutsche Labels für die Tabellen in der Speicherübersicht. */
const TABLE_LABELS: Record<string, string> = {
  profiles: "Profil",
  personalRecords: "Persönliche Rekorde",
  sessions: "Trainingseinheiten",
  assessments: "Assessments",
  readiness: "Readiness-Einträge",
  plans: "Trainingsplan",
};

type Status = { kind: "ok" | "error"; text: string } | null;

export function SettingsView() {
  const { mode, setMode } = useTheme();
  const counts = useTableCounts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<ImportMode>("replace");
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setStatus(null);
    try {
      await downloadBackup();
      setStatus({ kind: "ok", text: "Backup wurde heruntergeladen." });
    } catch {
      setStatus({ kind: "error", text: "Export fehlgeschlagen." });
    }
  }

  async function handleImportFile(file: File) {
    setBusy(true);
    setStatus(null);
    try {
      const result = await importFromFile(file, importMode);
      const total = Object.values(result.imported).reduce((a, b) => a + b, 0);
      setStatus({
        kind: "ok",
        text: `${total} Einträge importiert (${importMode === "replace" ? "ersetzt" : "zusammengeführt"}).`,
      });
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "Import fehlgeschlagen.",
      });
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleClearAll() {
    if (
      !window.confirm(
        "Wirklich ALLE lokalen Daten löschen? Das lässt sich nicht rückgängig machen. Tipp: vorher ein Backup exportieren.",
      )
    ) {
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await clearAllData();
      setStatus({ kind: "ok", text: "Alle Daten wurden gelöscht." });
    } catch {
      setStatus({ kind: "error", text: "Löschen fehlgeschlagen." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {status ? (
        <div
          role="status"
          className={cn(
            "rounded-xl px-3 py-2 text-sm",
            status.kind === "ok"
              ? "bg-primary/10 text-primary"
              : "bg-danger/10 text-danger",
          )}
        >
          {status.text}
        </div>
      ) : null}

      {/* Darstellung / Theme */}
      <section className="space-y-2">
        <SectionTitle>Darstellung</SectionTitle>
        <Card>
          <CardHeader title="Theme" icon={<Palette className="h-5 w-5" />} />
          <CardBody className="pt-2">
            <div
              role="radiogroup"
              aria-label="Theme"
              className="grid grid-cols-3 gap-2"
            >
              <ThemeOption
                current={mode}
                value="system"
                label="System"
                icon={<Monitor className="h-5 w-5" />}
                onSelect={setMode}
              />
              <ThemeOption
                current={mode}
                value="light"
                label="Hell"
                icon={<Sun className="h-5 w-5" />}
                onSelect={setMode}
              />
              <ThemeOption
                current={mode}
                value="dark"
                label="Dunkel"
                icon={<Moon className="h-5 w-5" />}
                onSelect={setMode}
              />
            </div>
          </CardBody>
        </Card>
      </section>

      {/* Datensicherung */}
      <section className="space-y-2">
        <SectionTitle>Daten</SectionTitle>
        <Card>
          <CardHeader
            title="Backup & Import"
            subtitle="Alle Daten als JSON sichern oder wiederherstellen."
            icon={<Database className="h-5 w-5" />}
          />
          <CardBody className="space-y-4 pt-2">
            <Button variant="secondary" onClick={handleExport} disabled={busy}>
              <Download className="h-4 w-4" aria-hidden />
              Backup exportieren
            </Button>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Beim Import:
              </p>
              <div role="radiogroup" className="grid grid-cols-2 gap-2">
                <ModeOption
                  current={importMode}
                  value="replace"
                  label="Ersetzen"
                  hint="Vorhandene Daten überschreiben"
                  onSelect={setImportMode}
                />
                <ModeOption
                  current={importMode}
                  value="merge"
                  label="Zusammenführen"
                  hint="Ergänzen/aktualisieren"
                  onSelect={setImportMode}
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
              >
                <Upload className="h-4 w-4" aria-hidden />
                Backup importieren
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImportFile(file);
                }}
              />
            </div>
          </CardBody>
        </Card>
      </section>

      {/* Speicherübersicht */}
      <section className="space-y-2">
        <SectionTitle>Speicher</SectionTitle>
        <Card>
          <ul className="divide-y divide-border">
            {counts === undefined ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">Lädt…</li>
            ) : (
              Object.entries(counts).map(([table, count]) => (
                <li
                  key={table}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="text-muted-foreground">
                    {TABLE_LABELS[table] ?? table}
                  </span>
                  <span className="font-semibold tabular-nums">{count}</span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </section>

      {/* Gefahrenzone */}
      <section className="space-y-2">
        <SectionTitle>Zurücksetzen</SectionTitle>
        <Card className="border-danger/30">
          <CardBody className="space-y-3 pt-4">
            <p className="text-sm text-muted-foreground">
              Löscht alle lokal gespeicherten Daten unwiderruflich. Erstelle
              vorher am besten ein Backup.
            </p>
            <Button variant="danger" onClick={handleClearAll} disabled={busy}>
              <Trash2 className="h-4 w-4" aria-hidden />
              Alle Daten löschen
            </Button>
          </CardBody>
        </Card>
      </section>

      {/* Info */}
      <section className="space-y-2">
        <SectionTitle>Über die App</SectionTitle>
        <Card>
          <CardBody className="flex items-start gap-3 pt-4 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div>
              <p>
                <span className="font-medium text-foreground">Hyrox Coach</span> –
                Stufe 1. Läuft komplett offline; alle Daten bleiben lokal auf
                deinem Gerät (kein Backend).
              </p>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function ThemeOption({
  current,
  value,
  label,
  icon,
  onSelect,
}: {
  current: ThemeMode;
  value: ThemeMode;
  label: string;
  icon: React.ReactNode;
  onSelect: (mode: ThemeMode) => void;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={() => onSelect(value)}
      className={cn(
        "flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-medium transition",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      <span aria-hidden>{icon}</span>
      {label}
    </button>
  );
}

function ModeOption({
  current,
  value,
  label,
  hint,
  onSelect,
}: {
  current: ImportMode;
  value: ImportMode;
  label: string;
  hint: string;
  onSelect: (mode: ImportMode) => void;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={() => onSelect(value)}
      className={cn(
        "rounded-xl border px-3 py-2 text-left transition",
        active ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
      )}
    >
      <span
        className={cn(
          "block text-sm font-semibold",
          active ? "text-primary" : "text-foreground",
        )}
      >
        {label}
      </span>
      <span className="block text-xs text-muted-foreground">{hint}</span>
    </button>
  );
}
