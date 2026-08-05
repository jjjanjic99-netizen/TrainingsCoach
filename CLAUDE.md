# CLAUDE.md – Dauer-Regeln für die Hyrox-Coach-App

Diese Datei hält die verbindlichen Rahmenbedingungen fest, damit spätere
Aufgaben konsistent bleiben. **Immer beachten.**

## Produktidee

Persönliche Hyrox-Trainings-Coach-App als installierbare **PWA**, primär für
die Nutzung auf dem iPhone über „Zum Home-Bildschirm hinzufügen" (Vollbild,
eigenes Icon, offline-fähig, eigener lokaler Speicher). Die App trackt das
Training, schlägt strukturierte Einheiten vor und liefert messbare
Fortschrittswerte inkl. Lauf-Coaching.

## Sprache & Schreibweise

- **Die gesamte Oberfläche ist auf Deutsch.**
- **Schweizer Kontext: immer „ss" statt „ß"** (z. B. „fliesst", „schliessen").
- Typografische Anführungszeichen in JSX-Text verwenden (`„…"`), keine
  geraden `"` (sonst ESLint `react/no-unescaped-entities`).

## Einheiten

- **Durchgehend metrisch:** km, m, kg, min/km, Sekunden.
- Dezimaltrennzeichen für die Anzeige: Komma (`toLocaleString("de-CH")`).

## Tech-Stack (nicht ohne Grund abweichen)

- **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**.
- **PWA via Serwist** (`@serwist/next`): Service Worker aus `app/sw.ts` →
  `public/sw.js`, automatische Registrierung. Im Dev-Modus deaktiviert
  (siehe `next.config.mjs`), aktiv im Production-Build.
- **Persistenz: IndexedDB via Dexie.** **Kein Backend** – alle Daten liegen
  lokal auf dem Gerät.
- **Charts: `recharts`. Icons: `lucide-react`.**

## Architektur-Regeln

- **Getrennte Datenschicht (Repository-/Hook-Pattern).** Nur `lib/db/*` kennt
  Dexie/IndexedDB. Die UI nutzt ausschliesslich:
  - Repositories: `lib/db/repositories.ts`
  - Hooks: `lib/hooks/use-live-data.ts` (basieren auf `dexie-react-hooks`)
  - Backup: `lib/db/backup.ts`
- **Typisierte Datenmodelle** in `lib/db/types.ts`. Schema-Änderungen über eine
  neue Dexie-Version in `lib/db/db.ts` (bestehende Version 1 nicht brechen).
- **JSON-Export/-Import** aller Daten bleibt funktionsfähig (Backup &
  Gerätewechsel). Der Export ist generisch über alle Tabellen – neue Tabellen
  werden automatisch mitgesichert.
- Komponenten sind mobile-first, mit grossen Touch-Zielen (min. 44 px), gut
  lesbar auch in Bewegung. **Dunkles Theme** als Option (siehe
  `components/theme-provider.tsx`).
- **Safe-Area-Insets** (Notch/Home-Indicator) über `env(safe-area-inset-*)`
  bzw. die Utilities `pt-safe`/`pb-safe` und `viewport-fit=cover`.
- Code kommentieren, klare Projektstruktur beibehalten.

## iOS-PWA-Besonderheiten

- Kein automatischer Install-Prompt auf iOS → Onboarding-Hinweis
  (`components/install-prompt.tsx`) erklärt den Weg über das Teilen-Menü.
  Erkennt Standalone-Modus und blendet sich dann aus.
- Push-Benachrichtigungen (Trainingserinnerungen) sind eine **spätere Stufe**
  und funktionieren auf iOS nur nach „Zum Home-Bildschirm hinzufügen"
  (ab iOS 16.4). Nicht ins MVP.

## Domänen-Wissen (fest verdrahtet – nicht erfinden)

Quelle: `lib/hyrox/stations.ts` und `lib/hyrox/divisions.ts`.

Hyrox-Wettkampf (Saison 25/26), **feste Reihenfolge**, 8 × 1 km Laufen im
Wechsel mit 8 Stationen (jeweils **Lauf → Station**):

1. Lauf → **SkiErg 1000 m**
2. Lauf → **Sled Push 50 m**
3. Lauf → **Sled Pull 50 m**
4. Lauf → **Burpee Broad Jumps 80 m**
5. Lauf → **Rowing 1000 m**
6. Lauf → **Farmers Carry 200 m**
7. Lauf → **Sandbag Lunges 100 m**
8. Lauf → **Wall Balls** (100 Reps Männer / 75 Frauen)

- **Roxzone**: Transitwege zwischen den Stationen kosten real Zeit und fliessen
  in die Prognose ein.
- **Divisionen**: Open, Pro, Doubles, Relay (im Profil wählbar; Zielwerte daran
  ausrichten). Reihenfolge und Distanzen sind weltweit identisch → Zeiten direkt
  vergleichbar.

## Ausbaustufen (in dieser Reihenfolge, je Stufe stoppen)

1. **[erledigt]** Projekt-Setup + PWA-Grundgerüst: Scaffold, Manifest, Service
   Worker/Offline, Home-Screen-Onboarding, Safe-Area, Dexie-Datenschicht,
   JSON-Export/Import, Tab-Bar-Navigation, Dark-Mode.
2. **[erledigt]** MVP: Profil + Baseline-Assessment + Trainings-Logging +
   Dashboard mit Stationstrend (Auswertungen in `lib/hyrox/stats.ts`,
   Diagramme via recharts in `components/charts.tsx`).
3. **[erledigt]** Trainingsplan-Generator + Wochenansicht (periodisiert
   Base→Build→Peak→Taper mit Deload; Logik in `lib/hyrox/plan.ts`, UI in
   `components/plan-view.tsx`, Persistenz in Dexie-Tabelle `plans`).
4. **[erledigt]** Lauf-Coaching-Modul + Pace-Zonen (VDOT-Logik in
   `lib/hyrox/running.ts`: Pace-Zonen, Intervall-Workouts,
   Wochenkilometer-Progression; UI in `components/lauf-coaching.tsx`,
   Route `/lauf`).
5. **[erledigt]** Renn-Simulator/Prognose + Stärken/Schwächen-Radar +
   Was-wäre-wenn (Logik in `lib/hyrox/forecast.ts`, UI in
   `components/race-simulator.tsx`, Radar via recharts, Route `/prognose`).
   Hinweis: Wall Balls werden seit dieser Stufe zeitbasiert getrackt
   (`metric: "time"`), damit alle 8 Stationen in die Prognose einfliessen.
6. **[erledigt]** CSV/JSON-Import für Watch-Daten (Parser in
   `lib/import/watch-import.ts`, UI `components/watch-import.tsx`, Route
   `/import`) + Recovery/Readiness (Logik `lib/hyrox/readiness.ts`, UI
   `components/readiness-view.tsx`, Route `/readiness`, Dexie-Tabelle
   `readiness`). Push-Benachrichtigungen bleiben eine spätere Option.

**Arbeitsweise:** Je Stufe einen lauffähigen Stand liefern, committen und
stoppen. Erst nach OK die nächste Stufe.

## Projektstruktur (Kurzüberblick)

```
app/                 App Router: Seiten, Layout, Manifest-Route, Service Worker
  layout.tsx         Root-Layout, Metadaten/Viewport, Theme-Init, App-Shell
  manifest.ts        Web-App-Manifest (/manifest.webmanifest)
  sw.ts              Serwist-Service-Worker-Quelle
  page.tsx           Übersicht (Startseite)
  training|plan|fortschritt|profil|einstellungen/
components/          UI-Komponenten (Shell, Tab-Bar, Header, Theme, Install-Hint)
lib/
  hyrox/             Domänenwissen (Stationen, Divisionen)
  db/                Datenschicht: types, db (Dexie), repositories, backup
  hooks/             React-Hooks über die Datenschicht
  format.ts, cn.ts, theme.ts
scripts/
  generate-icons.mjs Icon-Generierung (`npm run icons`)
```

## Befehle

- `npm run dev` – Entwicklung (Service Worker deaktiviert).
- `npm run build` / `npm start` – Production-Build inkl. Service Worker (Offline).
- `npm run lint` – ESLint.
- `npm run icons` – PWA-Icons aus SVG neu erzeugen (benötigt `sharp`).
