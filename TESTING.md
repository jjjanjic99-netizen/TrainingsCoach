# Testanleitung – Hyrox Coach

Diese Anleitung führt dich durch das Testen der App: lokal, auf dem iPhone und
Feature für Feature. Alle automatisierten Checks sind grün (siehe unten).

## 1. Lokal starten

Voraussetzung: Node 18.18+ (getestet mit Node 22), `npm install` einmal ausführen.

```bash
# Entwicklung (Service Worker/Offline bewusst deaktiviert)
npm run dev            # http://localhost:3000

# Produktions-Preview (Service Worker aktiv -> Offline testbar)
npm run build && npm start   # http://localhost:3000
```

> Der Service Worker ist im Dev-Modus aus, damit Caching die Entwicklung nicht
> stört. Offline-Verhalten also immer über `npm run build && npm start` (oder ein
> Deployment) testen.

## 2. Automatische Checks (kannst du selbst laufen lassen)

```bash
npm run build       # Produktions-Build (inkl. Service-Worker-Bundling)
npm run typecheck   # TypeScript ohne Emit
npm run lint        # ESLint (next/core-web-vitals)
npm run test        # Vitest – Unit-Tests der Rechenfunktionen
```

**Zuletzt geprüft – alles grün:**

| Check | Ergebnis |
|---|---|
| `npm run build` | ✅ erfolgreich (17 Routen) |
| `npm run typecheck` | ✅ keine Fehler |
| `npm run lint` | ✅ keine Warnungen/Fehler |
| `npm run test` | ✅ 23 Tests in 4 Dateien |

Die Unit-Tests decken die reinen Rechenfunktionen ab: Zeit-/Pace-Parsing
(`lib/format`), VDOT & Pace-Zonen und Wochenkilometer-Progression
(`lib/hyrox/running`), Renn-Prognose inkl. Roxzone, limitierende Stationen und
Prognose-Verlauf (`lib/hyrox/forecast`) sowie die periodisierte Plan-Generierung
mit Deload (`lib/hyrox/plan`).

## 3. Auf dem iPhone testen (HTTPS nötig)

**Warum HTTPS?** Service Worker, Offline-Betrieb und „Zum Home-Bildschirm"
funktionieren nur im *secure context*. Ausnahme ist `localhost`; eine LAN-IP wie
`http://192.168.x.x` gilt **nicht** als sicher. Für den iPhone-Test brauchst du
also eine **HTTPS-URL**. Zwei Wege:

### Weg A – Deployen (empfohlen, stabil)

Standard-Next.js-App, z. B. auf **Vercel**:

1. Repository bei Vercel importieren (Framework „Next.js" wird erkannt).
2. Deployen – HTTPS ist automatisch aktiv.
3. Die vergebene `https://…`-URL in **Safari auf dem iPhone** öffnen.

Auf eigener Infrastruktur (z. B. Hetzner): `npm run build && npm start` hinter
einem Reverse-Proxy mit gültigem TLS-Zertifikat (Caddy/nginx + Let's Encrypt),
dann die HTTPS-Domain in Safari öffnen.

### Weg B – HTTPS-Tunnel zu localhost (schnell)

Erst den Produktions-Server starten, dann einen Tunnel darauf legen:

```bash
npm run build && npm start          # Terminal 1 – localhost:3000

# Terminal 2 – eine der Varianten:
cloudflared tunnel --url http://localhost:3000
# oder
ngrok http 3000
```

Das Tool zeigt eine öffentliche `https://…`-URL – diese in **Safari auf dem
iPhone** öffnen.

## 4. Als App installieren & offline testen

1. Die HTTPS-URL in **Safari** öffnen (nicht in einer In-App-Ansicht).
2. Teilen-Menü → **„Zum Home-Bildschirm"** → hinzufügen.
3. App vom Home-Bildschirm starten: sie läuft im **Vollbild (standalone)**, mit
   eigenem Icon und ohne Safari-Leisten. Der Install-Hinweis blendet sich aus.
4. **Offline testen:** App einmal normal laden, dann **Flugmodus** aktivieren und
   die App erneut vom Home-Bildschirm öffnen – sie startet und zeigt die zuletzt
   gecachten Inhalte. Deine Daten liegen ohnehin lokal (IndexedDB).

## 5. Schnellstart mit Demo-Daten

Damit Dashboard, Charts, Prognose und Radar sofort befüllt sind:

**Einstellungen (Zahnrad oben rechts) → Testdaten → „Demo-Daten laden".**

Das legt mehrere Wochen realistische Einträge an (klar als Testdaten markiert).
Mit **„Demo-Daten löschen"** verschwinden sie rückstandslos; deine echten
Einträge bleiben unberührt.

## 6. Klick-für-Klick-Checkliste

Am besten in dieser Reihenfolge. Erwartetes Verhalten steht jeweils dabei.

### Profil
1. Tab **Profil** → Name, Alter, Geschlecht, Division, Level, Ziel-Renndatum,
   Ziel-Finishzeit (z. B. `1:15:00`) eingeben → **Profil speichern**.
   → Erwartung: „Profil gespeichert."; auf der **Übersicht** erscheinen Begrüssung
   und Renn-Countdown.

### Baseline-Assessment
2. Profil → **Baseline-Assessment** (oder Übersicht → Erste Schritte).
   Einige Stationszeiten und die Lauf-Benchmarks (1 km, 5 km) eintragen →
   **Assessment speichern**.
   → Erwartung: Weiterleitung zum **Fortschritt**-Tab.

### Trainingsplan
3. Tab **Plan** → **Plan erstellen**.
   → Erwartung: 8–16-Wochen-Plan mit farbiger Wochenleiste (Base/Build/Peak/Taper),
   Deload-Markierungen und abhakbaren Einheiten. Eine Einheit **abhaken** →
   Fortschrittsbalken steigt; nach **Seite neu laden** bleibt der Haken erhalten.

### Training loggen
4. Tab **Training** → **Einheit hinzufügen**. Typ wählen, Dauer/Distanz bzw.
   Stationszeiten, RPE, Notizen → **Einheit speichern**.
   → Erwartung: Einheit erscheint im Verlauf (mit Pace bei Läufen). Antippen →
   bearbeiten/löschen möglich.

### Watch-Daten-Import
5. Training → **Watch-Daten importieren** → **Beispiel CSV** bzw. **Beispiel JSON**
   → **importieren** (oder eine eigene Datei wählen).
   → Erwartung: Vorschau, dann neue Einheiten im Verlauf. Alternativ je Eintrag
   einer bestehenden Einheit zuordnen. Schema: siehe README.

### Dashboard
6. Tab **Fortschritt**.
   → Erwartung: Kennzahlen, wählbarer **Stationstrend**, **Lauf-Pace-Entwicklung**,
   **Wochenvolumen** und automatisch abgeleitete **Bestleistungen**.

### Lauf-Coaching
7. Übersicht → **Lauf-Coaching** (oder Plan → unten).
   → Erwartung: VDOT + fünf Pace-Zonen aus deinem Test, Intervall-Workouts mit
   Zielzeiten, Wochenkilometer-Progression.

### Renn-Prognose
8. Fortschritt → **Renn-Simulator & Prognose** (oder Übersicht → Prognose).
   → Erwartung: prognostizierte Finishzeit inkl. Abstand zum Ziel, limitierende
   Stationen, **Stärken/Schwächen-Radar**, Prognose-Verlauf und **Was-wäre-wenn**
   (Stepper an Station/Lauf → Gesamtzeit ändert sich live).

### Readiness
9. Übersicht → **Readiness**. Schlaf/Muskelkater/Motivation antippen.
   → Erwartung: Empfehlung (bis zur Deload-Empfehlung bei niedrigen Werten); nach
   **Seite neu laden** bleiben die Werte erhalten.

### Backup (Export/Import)
10. Einstellungen → Daten → **Backup exportieren** (JSON-Download). Danach
    **Alle Daten löschen** → alles leer. Dann **Backup importieren** (dieselbe
    Datei) → alle Daten sind zurück.
    → Erwartung: Round-Trip stellt den Zustand vollständig wieder her.

### Persistenz
11. Beliebige Daten anlegen → **Seite neu laden** → Daten sind noch da
    (lokal in IndexedDB).

## 7. Bekannte Einschränkungen

- **Kein Live-Zugriff auf Apple Watch / HealthKit** (in einer PWA nicht möglich).
  Nutzung über den **CSV/JSON-Import** (`/import`); manuelle Eingabe bleibt immer
  möglich.
- **Offline/Installation nur über HTTPS** (bzw. `localhost`) – siehe Abschnitt 3.
- **Push-Benachrichtigungen** (Trainingserinnerungen) sind bewusst nicht Teil des
  MVP; auf iOS erst nach „Zum Home-Bildschirm" ab iOS 16.4 möglich – spätere Stufe.
- **Prognose** ist eine Schätzung: fehlende Stationszeiten werden mit Zielsplits
  angenommen, die Roxzone wird geschätzt. Sie wird genauer, je mehr Benchmarks du
  erfasst.
- Beim sehr schnellen Hin-und-Her-Navigieren kann in der Browser-Konsole eine
  harmlose Meldung „Failed to fetch RSC payload" auftauchen (abgebrochener
  Route-Prefetch); Next lädt die Seite dann normal – ohne Funktionsverlust.
