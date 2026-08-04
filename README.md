# Hyrox Coach

Persönliche **Hyrox-Trainings-Coach-App** als installierbare **PWA** – gebaut
für die Nutzung auf dem iPhone über „Zum Home-Bildschirm hinzufügen": Vollbild,
eigenes Icon, **offline-fähig**, Daten bleiben **lokal auf dem Gerät** (kein
Backend). Die Oberfläche ist durchgehend auf Deutsch (Schweizer Schreibweise,
metrische Einheiten).

> **Status: Stufe 1** – App-Grundgerüst. Die App wird in Ausbaustufen
> entwickelt (siehe [`CLAUDE.md`](./CLAUDE.md)).

## Was in Stufe 1 enthalten ist

- **Next.js 14 (App Router) + TypeScript + Tailwind CSS**
- **PWA** mit `manifest.webmanifest` (Standalone, Theme-Color, Icons 192/512
  inkl. `maskable`), `apple-touch-icon` und den nötigen Meta-Tags
  (`mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`)
- **Service Worker via [Serwist](https://serwist.pages.dev/)** für
  Offline-Betrieb – die App startet ohne Netz und zeigt gecachte Inhalte
- **Onboarding-Hinweis „Zum Home-Bildschirm hinzufügen"** (iOS-tauglich, blendet
  sich im Standalone-Modus aus)
- **Safe-Area-Insets** für Notch/Home-Indicator (`viewport-fit=cover`)
- **Datenschicht mit IndexedDB via Dexie** (Repository-/Hook-Pattern) – die UI
  kennt IndexedDB nie direkt
- **JSON-Export/-Import** aller Daten als Backup
- **Untere Tab-Bar** als Hauptnavigation
- **Dark-Mode** (System/Hell/Dunkel), flackerfrei beim Laden

## Voraussetzungen

- Node.js 18.18+ (getestet mit Node 22)
- npm

## Lokal starten

```bash
npm install
npm run dev
```

Dann [http://localhost:3000](http://localhost:3000) öffnen.

> Im Entwicklungsmodus (`npm run dev`) ist der Service Worker **deaktiviert**,
> damit Caching die Entwicklung nicht stört. Den **Offline-Betrieb** testest du
> im Production-Build:

```bash
npm run build
npm start
```

### Als App aufs iPhone (PWA)

1. Seite in **Safari** öffnen (nicht in einer In-App-Ansicht).
2. Teilen-Menü → **„Zum Home-Bildschirm"**.
3. Die App startet danach im Vollbild und funktioniert offline.

## Deployment

Die App ist eine Standard-Next.js-App und lässt sich unverändert auf
**[Vercel](https://vercel.com)** deployen (empfohlen):

1. Repository bei Vercel importieren.
2. Framework wird als „Next.js" erkannt – Build-Command `next build`,
   Output automatisch.
3. Deployen. HTTPS ist dort automatisch aktiv – Pflicht für PWA/Service Worker.

Alternativ jede Plattform, die Next.js (Node-Runtime) unterstützt. Wichtig:
**PWA/Service Worker benötigen HTTPS** (Ausnahme: `localhost`).

Icons neu erzeugen (nach Design-Änderung am SVG in `scripts/generate-icons.mjs`):

```bash
npm run icons
```

## Projektstruktur

```
app/            Seiten (App Router), Layout, Manifest-Route, Service Worker
components/      UI: App-Shell, Tab-Bar, Header, Theme-Provider, Install-Hinweis
lib/hyrox/       Hyrox-Domänenwissen (Stationen, Divisionen)
lib/db/          Datenschicht: types, Dexie-DB, Repositories, Backup (Export/Import)
lib/hooks/       React-Hooks über die Datenschicht (dexie-react-hooks)
scripts/         Icon-Generierung
```

Details und Dauer-Regeln: siehe [`CLAUDE.md`](./CLAUDE.md).

## Backup-Format (JSON)

Der Export erzeugt eine Datei `hyrox-coach-backup-JJJJ-MM-TT.json` mit dieser
Struktur (generisch über alle Tabellen – neue Tabellen werden automatisch
mitgesichert):

```jsonc
{
  "app": "hyrox-coach",
  "formatVersion": 1,
  "dbVersion": 1,
  "exportedAt": "2026-08-04T10:00:00.000Z",
  "data": {
    "profiles": [],
    "personalRecords": [],
    "sessions": [],
    "assessments": [],
    "readiness": []
  }
}
```

Beim Import kann zwischen **Ersetzen** (vorhandene Daten überschreiben) und
**Zusammenführen** (per Primärschlüssel ergänzen/aktualisieren) gewählt werden.

## Daten & Privatsphäre

Es gibt **kein Backend**. Alle Daten liegen ausschliesslich lokal im Browser
(IndexedDB) des jeweiligen Geräts. Für Sicherung oder Gerätewechsel den
JSON-Export nutzen (Einstellungen → Daten).
